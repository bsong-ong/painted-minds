import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LinkAccountRequest {
  linkToken: string; // A one-time token to link accounts
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create authenticated Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { linkToken }: LinkAccountRequest = await req.json();

    if (!linkToken) {
      return new Response(
        JSON.stringify({ error: "linkToken is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the link token and get LINE user info
    // In a real implementation, you would verify this token with LINE
    // For now, we'll extract the LINE user ID from the token
    // Token format: "LINE_USERID_TIMESTAMP"
    const parts = linkToken.split("_");
    if (parts.length < 2 || parts[0] !== "LINE") {
      return new Response(
        JSON.stringify({ error: "Invalid link token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lineUserId = parts[1];

    // Check if this LINE account is already linked
    const { data: existing } = await supabase
      .from("line_accounts")
      .select("*")
      .eq("line_user_id", lineUserId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "This LINE account is already linked to another user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Link the LINE account
    const { data, error } = await supabase
      .from("line_accounts")
      .upsert({
        user_id: user.id,
        line_user_id: lineUserId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error linking LINE account:", error);
      throw error;
    }

    console.log(`Successfully linked LINE account ${lineUserId} to user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in line-link-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});