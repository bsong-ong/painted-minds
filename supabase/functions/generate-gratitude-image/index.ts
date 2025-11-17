import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateImageRequest {
  gratitudeText: string;
  userId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { gratitudeText, userId }: GenerateImageRequest = await req.json();

    if (!gratitudeText) {
      return new Response(
        JSON.stringify({ error: "gratitudeText is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating gratitude image for: "${gratitudeText}"`);

    // Create an artistic prompt for the image generation
    const imagePrompt = `Create a beautiful, warm, and uplifting artistic illustration representing gratitude for: "${gratitudeText}". 
Style: Soft watercolor or dreamy digital art with warm colors (golds, oranges, pinks, soft blues). 
Mood: Peaceful, joyful, and thankful. 
Include abstract or symbolic elements that capture the essence of gratitude. 
High quality, aesthetically pleasing, suitable for a gratitude journal.`;

    // Generate image using Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    console.log("Image generated successfully");

    // If userId is provided, save to database
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Convert base64 to blob
      const base64Data = imageUrl.split(",")[1];
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      
      // Upload to storage
      const fileName = `gratitude_${userId}_${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("drawings")
        .upload(fileName, binaryData, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
      } else {
        console.log("Image saved to storage:", fileName);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("drawings")
          .getPublicUrl(fileName);

        // Save to drawings table
        await supabase.from("drawings").insert({
          user_id: userId,
          gratitude_prompt: gratitudeText,
          image_url: urlData.publicUrl,
          storage_path: fileName,
          is_gratitude_entry: true,
          title: gratitudeText.substring(0, 100),
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        message: "Image generated successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-gratitude-image function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});