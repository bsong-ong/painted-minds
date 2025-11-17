import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LinkAccountRequest {
  linkToken: string;
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

    // Extract JWT token from "Bearer <token>"
    const jwt = authHeader.replace("Bearer ", "");

    // Create Supabase client with service role key for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user (JWT is already validated by verify_jwt=true)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      console.error("Auth error:", authError);
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

    // Verify the link token format
    const parts = linkToken.split("_");
    if (parts.length < 3 || parts[0] !== "LINE") {
      return new Response(
        JSON.stringify({ error: "Invalid link token format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lineUserId = parts[1];
    const timestamp = parseInt(parts[2]);

    // Check token expiration (5 minutes)
    const now = Date.now();
    const tokenAge = now - timestamp;
    const fiveMinutes = 5 * 60 * 1000;

    if (tokenAge > fiveMinutes) {
      return new Response(
        JSON.stringify({ error: "Link token has expired. Please request a new one from LINE." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if this LINE account is already linked
    const { data: existing } = await supabase
      .from("line_accounts")
      .select("*")
      .eq("line_user_id", lineUserId)
      .maybeSingle();

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