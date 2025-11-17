import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineEvent {
  type: string;
  timestamp: number;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  replyToken: string;
  message?: {
    id: string;
    type: string;
    text?: string;
  };
}

interface WebhookBody {
  destination: string;
  events: LineEvent[];
}

// Verify LINE signature for security
async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!LINE_CHANNEL_SECRET) {
    console.error("LINE_CHANNEL_SECRET is not set");
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(LINE_CHANNEL_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureData = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );

  const base64Signature = btoa(
    String.fromCharCode(...new Uint8Array(signatureData))
  );

  return base64Signature === signature;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("LINE webhook received");

    // Get the raw body text for signature verification
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature");

    if (!signature) {
      console.error("No signature provided");
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the signature
    const isValidSignature = await verifySignature(bodyText, signature);
    if (!isValidSignature) {
      console.error("Invalid signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const webhookBody: WebhookBody = JSON.parse(bodyText);
    console.log("Webhook body:", JSON.stringify(webhookBody, null, 2));

    // Process each event
    for (const event of webhookBody.events) {
      console.log(`Processing event type: ${event.type}`);

      switch (event.type) {
        case "message":
          if (event.message?.type === "text") {
            console.log(
              `Received message from ${event.source.userId}: ${event.message.text}`
            );
            // TODO: Add your custom logic here
            // You can store the message, trigger actions, reply, etc.
          }
          break;

        case "follow":
          console.log(`New follower: ${event.source.userId}`);
          // TODO: Send welcome message or store user info
          break;

        case "unfollow":
          console.log(`User unfollowed: ${event.source.userId}`);
          // TODO: Clean up user data if needed
          break;

        case "join":
          console.log(`Bot joined group/room: ${event.source.groupId || event.source.roomId}`);
          // TODO: Send greeting or store group info
          break;

        case "leave":
          console.log(`Bot left group/room: ${event.source.groupId || event.source.roomId}`);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    }

    // LINE expects a 200 OK response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in line-webhook function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
