import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getMessage, type Language } from "../_shared/line-messages.ts";

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

      // Check if this LINE user is linked to an app account and get language
      const { data: linkedAccount } = await supabase
        .from("line_accounts")
        .select("user_id")
        .eq("line_user_id", lineUserId)
        .single();

      console.log(`LINE user ${lineUserId} linked:`, !!linkedAccount);

      // Get user's language preference
      let userLanguage: Language = 'en';
      if (linkedAccount) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", linkedAccount.user_id)
          .single();
        
        console.log('Profile query result:', { profile, profileError, userId: linkedAccount.user_id });
        
        if (profile?.language) {
          userLanguage = profile.language as Language;
          console.log('User language set to:', userLanguage);
        } else {
          console.log('No language in profile, defaulting to en');
        }
      }
      
      console.log('Final userLanguage for messages:', userLanguage);

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
                  text: getMessage(userLanguage, 'linkAccount.title') + '\n\n' + getMessage(userLanguage, 'linkAccount.message', linkToken),
                },
              ]);
            } else if (messageText.includes("help") || messageText.includes("menu")) {
              // Help menu
              await replyMessage(event.replyToken, [
                {
                  type: "text",
                  text: getMessage(userLanguage, 'help.title') + '\n\n' + getMessage(userLanguage, 'help.message'),
                },
              ]);
            } else if (messageText.includes("test reminder")) {
              // Send test reminder - matches actual daily reminder format
              await replyMessage(event.replyToken, [
                {
                  type: "text",
                  text: getMessage(userLanguage, 'dailyReminder.title') + '\n\n' + getMessage(userLanguage, 'dailyReminder.text'),
                },
              ]);
            } else if (messageText.includes("journal")) {
              // Show recent gratitude drawings (last 90 days)
              const ninetyDaysAgo = new Date();
              ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
              
              console.log(`Fetching drawings for user: ${linkedAccount.user_id}`);
              console.log(`Date range: from ${ninetyDaysAgo.toISOString()} to now`);
              
              const { data: drawings, error: drawingsError } = await supabase
                .from('drawings')
                .select('id, title, gratitude_prompt, created_at, enhanced_image_url, image_url, is_enhanced')
                .eq('user_id', linkedAccount.user_id)
                .gte('created_at', ninetyDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10); // Show up to 10 most recent drawings

              console.log(`Drawings query result:`, { 
                count: drawings?.length || 0, 
                error: drawingsError,
                drawings: drawings?.map(d => ({ id: d.id, title: d.title, created_at: d.created_at }))
              });

              if (drawingsError) {
                console.error('Error fetching drawings:', drawingsError);
                await replyMessage(event.replyToken, [
                  {
                    type: "text",
                    text: getMessage(userLanguage, 'errors.fetchJournalFailed'),
                  },
                ]);
                break;
              }

              if (!drawings || drawings.length === 0) {
                await replyMessage(event.replyToken, [
                  {
                    type: "text",
                    text: getMessage(userLanguage, 'journal.noEntries'),
                  },
                ]);
                break;
              }

              // Create carousel of drawing entries
              const bubbles = drawings.map(drawing => {
                const date = new Date(drawing.created_at);
                const formattedDate = date.toLocaleDateString(userLanguage === 'th' ? 'th-TH' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                const imageUrl = drawing.is_enhanced ? drawing.enhanced_image_url : drawing.image_url;
                
                return {
                  type: "bubble",
                  size: "kilo",
                  hero: imageUrl ? {
                    type: "image",
                    url: imageUrl,
                    size: "full",
                    aspectRatio: "1:1",
                    aspectMode: "cover"
                  } : undefined,
                  header: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: drawing.title || getMessage(userLanguage, 'journal.untitled'),
                        weight: "bold",
                        size: "lg",
                        wrap: true,
                        color: "#1DB446"
                      },
                      {
                        type: "text",
                        text: formattedDate,
                        size: "xs",
                        color: "#999999",
                        margin: "sm"
                      }
                    ],
                    paddingAll: "15px"
                  },
                  body: drawing.gratitude_prompt ? {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: drawing.gratitude_prompt,
                        wrap: true,
                        size: "sm",
                        color: "#666666"
                      }
                    ],
                    paddingAll: "15px"
                  } : undefined,
                  footer: drawing.is_enhanced ? {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "✨ Enhanced",
                        size: "xs",
                        color: "#FF1493",
                        align: "center"
                      }
                    ],
                    paddingAll: "10px"
                  } : undefined
                };
              });

              await replyMessage(event.replyToken, [
                {
                  type: "flex",
                  altText: getMessage(userLanguage, 'journal.carouselAlt', drawings.length),
                  contents: {
                    type: "carousel",
                    contents: bubbles
                  }
                }
              ]);
            } else {
              // User is sending gratitude - store it and offer to draw
              console.log(`Received gratitude text from ${lineUserId}: "${event.message.text}"`);
              
              // Get LIFF ID from environment
              const liffId = Deno.env.get('VITE_LIFF_ID');
              
              if (!liffId) {
                console.error('VITE_LIFF_ID not configured');
                await replyMessage(event.replyToken, [
                  {
                    type: "text",
                    text: getMessage(userLanguage, 'errors.liffNotConfigured'),
                  },
                ]);
                break;
              }
              
              // Create LIFF URL with gratitude text as parameter
              const liffUrl = `https://liff.line.me/${liffId}?gratitude=${encodeURIComponent(event.message.text || '')}`;
              
              await replyMessage(event.replyToken, [
                {
                  type: "text",
                  text: getMessage(userLanguage, 'gratitudeReceived.thankYou', event.message.text),
                },
                {
                  type: "template",
                  altText: getMessage(userLanguage, 'gratitudeReceived.buttonLabel'),
                  template: {
                    type: "buttons",
                    text: getMessage(userLanguage, 'gratitudeReceived.buttonText'),
                    actions: [
                      {
                        type: "uri",
                        label: getMessage(userLanguage, 'gratitudeReceived.buttonLabel'),
                        uri: liffUrl,
                      },
                    ],
                  },
                },
              ]);
            }
          }
          break;

        case "follow":
          console.log(`New follower: ${lineUserId}`);
          await replyMessage(event.replyToken, [
            {
              type: "text",
              text: getMessage(userLanguage, 'welcome.newFollower'),
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
