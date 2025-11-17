import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET");
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

// Helper function to reply to messages
async function replyMessage(replyToken: string, messages: any[]) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("LINE_CHANNEL_ACCESS_TOKEN not set");
    return;
  }

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to reply:", errorText);
    }
  } catch (error) {
    console.error("Error replying to message:", error);
  }
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

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Process each event
    for (const event of webhookBody.events) {
      console.log(`Processing event type: ${event.type}`);
      const lineUserId = event.source.userId;

      if (!lineUserId) {
        console.log("No user ID in event, skipping");
        continue;
      }

      // Check if this LINE user is linked to an app account
      const { data: linkedAccount } = await supabase
        .from("line_accounts")
        .select("user_id")
        .eq("line_user_id", lineUserId)
        .single();

      console.log(`LINE user ${lineUserId} linked:`, !!linkedAccount);

      switch (event.type) {
        case "message":
          if (event.message?.type === "text") {
            console.log(
              `Received message from ${lineUserId}: ${event.message.text}`
            );

            const messageText = event.message.text?.toLowerCase() || "";

            if (!linkedAccount) {
              // Generate link token for unlinked user
              const linkToken = `LINE_${lineUserId}_${Date.now()}`;
              
              // Send the link token
              await replyMessage(event.replyToken, [
                {
                  type: "text",
                  text: `🔗 Link Your Account\n\nYour link token is:\n\n${linkToken}\n\nCopy this token and paste it in the Painted Minds app under Settings > LINE to connect your account.\n\nThis token expires in 5 minutes.`,
                },
              ]);
            } else if (messageText.includes("help") || messageText.includes("menu")) {
              // Help menu
              await replyMessage(event.replyToken, [
                {
                  type: "text",
                  text: "✨ Painted Minds Help\n\n📝 Your account is linked!\n\n🎨 Send me what you're grateful for and I'll create a beautiful image for you!\n\nExample: \"I'm grateful for my family\"\n\n⭐ Track your streaks and achievements in the app\n🔔 Get daily reminders\n\nVisit the app for more features!",
                },
              ]);
            } else {
              // User is sending gratitude - generate image
              await replyMessage(event.replyToken, [
                {
                  type: "text",
                  text: "🎨 Creating your gratitude image...\n\nThis may take a moment. I'll send it to you shortly! ✨",
                },
              ]);

              // Generate image in background
              try {
                console.log(`Generating image for gratitude: "${event.message.text}"`);
                
                const imageResponse = await fetch(
                  `${SUPABASE_URL}/functions/v1/generate-gratitude-image`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                    },
                    body: JSON.stringify({
                      gratitudeText: event.message.text,
                      userId: linkedAccount.user_id,
                    }),
                  }
                );

                if (!imageResponse.ok) {
                  throw new Error(`Image generation failed: ${imageResponse.status}`);
                }

                const imageData = await imageResponse.json();
                console.log("Image generated, sending to LINE");

                // Convert base64 to blob URL for LINE
                const base64Image = imageData.imageUrl.split(",")[1];
                const binaryData = Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0));
                
                // Upload to temporary storage for LINE
                const fileName = `temp_${lineUserId}_${Date.now()}.png`;
                const uploadResponse = await fetch(
                  `${SUPABASE_URL}/storage/v1/object/drawings/${fileName}`,
                  {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                      "Content-Type": "image/png",
                    },
                    body: binaryData,
                  }
                );

                if (!uploadResponse.ok) {
                  throw new Error("Failed to upload image");
                }

                // Get public URL
                const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/drawings/${fileName}`;

                // Send image via LINE
                await fetch("https://api.line.me/v2/bot/message/push", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
                  },
                  body: JSON.stringify({
                    to: lineUserId,
                    messages: [
                      {
                        type: "image",
                        originalContentUrl: publicUrl,
                        previewImageUrl: publicUrl,
                      },
                      {
                        type: "text",
                        text: `✨ Here's your gratitude image!\n\n"${event.message.text}"\n\nYou can view all your gratitude entries in the Painted Minds app. Keep up the great work! 🌟`,
                      },
                    ],
                  }),
                });

                console.log("Image sent successfully to LINE");
              } catch (error) {
                console.error("Error generating/sending image:", error);
                
                // Send error message to user
                await fetch("https://api.line.me/v2/bot/message/push", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
                  },
                  body: JSON.stringify({
                    to: lineUserId,
                    messages: [
                      {
                        type: "text",
                        text: "Sorry, I had trouble creating your image. Please try again or send 'help' for options.",
                      },
                    ],
                  }),
                });
              }
            }
          }
          break;

        case "follow":
          console.log(`New follower: ${lineUserId}`);
          await replyMessage(event.replyToken, [
            {
              type: "text",
              text: "🎨 Welcome to Painted Minds!\n\nSend me any message to get your link token and connect your account.\n\nOnce linked, you'll receive:\n✅ Daily gratitude reminders\n✅ Achievement notifications\n✅ Personalized encouragement",
            },
          ]);
          break;

        case "unfollow":
          console.log(`User unfollowed: ${lineUserId}`);
          // Optionally unlink the account
          if (linkedAccount) {
            await supabase
              .from("line_accounts")
              .delete()
              .eq("line_user_id", lineUserId);
          }
          break;

        case "join":
          console.log(`Bot joined group/room: ${event.source.groupId || event.source.roomId}`);
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
