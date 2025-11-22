import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, prompt, userDescription, drawingId } = await req.json();
    
    if (!imageData || !drawingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageData and drawingId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not set');
    }

    console.log('Analyzing and enhancing drawing with user description:', userDescription, 'and style prompt:', prompt);

    // First, use Lovable AI Vision to analyze the drawing
    const visionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this drawing and provide a detailed description. The user says they drew: "${userDescription || 'no description provided'}". Focus on the shapes, objects, composition, and artistic elements that relate to what the user intended. Then create a detailed prompt for generating a charming colored pencil drawing that enhances what the user actually drew. Additional style context: ${prompt || 'colored pencil style'}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 500
      }),
    });

    if (!visionResponse.ok) {
      if (visionResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (visionResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      const errorData = await visionResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Lovable AI Vision error:', errorData);
      throw new Error(`Lovable AI Vision error: ${errorData.error || 'Unknown error'}`);
    }

    const visionData = await visionResponse.json();
    const description = visionData.choices[0].message.content;
    console.log('Drawing analysis completed:', description);

    // Create enhanced prompt for image generation, prioritizing user intent
    const userIntent = userDescription ? `The user intended to draw: ${userDescription}. ` : '';
    const styleHint = prompt ? `Style: ${prompt}. ` : '';
    const enhancedPrompt = `A charming colored pencil drawing, soft and artistic style, beautiful colors, hand-drawn aesthetic. ${userIntent}${styleHint}Based on the visual analysis: ${description}. Warm and inviting art style, detailed but not overly complex, pleasant and appealing. IMPORTANT: Do not add any text, titles, words, or labels to the image. Pure visual artwork only, no text overlay.`;

    console.log('Generating enhanced image with Lovable AI...');
    
    // Use Lovable AI to generate enhanced image
    const imageGenResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate an enhanced version of this drawing: ${enhancedPrompt}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"],
        max_tokens: 4096
      }),
    });

    if (!imageGenResponse.ok) {
      if (imageGenResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (imageGenResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      const errorData = await imageGenResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Lovable AI Image Generation error:', errorData);
      throw new Error(`Lovable AI Image Generation error: ${errorData.error || 'Unknown error'}`);
    }

    const imageGenData = await imageGenResponse.json();
    console.log('Image generation response received');

    // Extract image from response
    const choice = imageGenData?.choices?.[0];
    const images = choice?.message?.images;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('No image found in AI response');
    }

    const imageUrl = images[0]?.image_url?.url;
    if (!imageUrl) {
      throw new Error('Invalid image URL in AI response');
    }

    console.log('Enhanced image generated successfully');
    
    // Convert data URL to blob if needed
    let imageBlob: Blob;
    let contentType = 'image/png';

    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        throw new Error('Invalid data URL returned by AI');
      }
      contentType = match[1];
      const base64Data = match[2];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBlob = new Blob([bytes], { type: contentType });
    } else {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
      }
      contentType = imageResponse.headers.get('content-type') || contentType;
      imageBlob = await imageResponse.blob();
    }

    // Get the original drawing to extract user_id
    const { data: originalDrawing, error: fetchError } = await supabase
      .from('drawings')
      .select('user_id, title')
      .eq('id', drawingId)
      .single();

    if (fetchError || !originalDrawing) {
      throw new Error('Original drawing not found');
    }

    // Upload enhanced image to storage
    const enhancedFileName = `${originalDrawing.user_id}/${Date.now()}_enhanced_${originalDrawing.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(enhancedFileName, imageBlob, {
        contentType,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL for the enhanced image
    const { data: { publicUrl } } = supabase.storage
      .from('drawings')
      .getPublicUrl(enhancedFileName);

    // Update the original drawing record with enhanced image data
    const { error: updateError } = await supabase
      .from('drawings')
      .update({
        enhanced_image_url: publicUrl,
        enhanced_storage_path: enhancedFileName,
        enhancement_prompt: prompt,
        flux_prompt: enhancedPrompt,
        is_enhanced: true,
        user_description: userDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', drawingId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Drawing enhanced successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        enhancedImageUrl: publicUrl,
        message: 'Drawing enhanced successfully!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in enhance-drawing function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to enhance drawing', 
        details: message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});