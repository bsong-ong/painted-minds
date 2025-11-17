import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageRequest {
  to: string; // User ID, Group ID, or Room ID
  messages: Array<{
    type: string;
    text?: string;
    // Add more message types as needed (image, video, sticker, etc.)
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
    }

    const { to, messages }: SendMessageRequest = await req.json();

    if (!to || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, messages" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Sending ${messages.length} message(s) to ${to}`);

    // Send push message via LINE Messaging API
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LINE API error:", errorText);
      throw new Error(`LINE API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Message sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in line-send-message function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
