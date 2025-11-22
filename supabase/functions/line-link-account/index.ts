import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LinkAccountRequest {
  linkToken: string;
}

function parseJwtSubject(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    let base = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base.length % 4;
    if (pad) base += '='.repeat(4 - pad);
    const json = atob(base);
    const obj = JSON.parse(json);
    return obj.sub || null;
  } catch (_e) {
    return null;
  }
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

    // Get user id from JWT (already validated by verify_jwt)
    const userId = parseJwtSubject(jwt);
    if (!userId) {
      console.error("Failed to parse user id from JWT");
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

    // Look up the token in database
    const { data: tokenData, error: tokenError } = await supabase
      .from("line_link_tokens")
      .select("*")
      .eq("token", linkToken.toUpperCase())
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired link token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check token expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Link token has expired. Please request a new one." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the LINE user ID from the token
    const lineUserId = tokenData.line_user_id;
    
    if (!lineUserId) {
      return new Response(
        JSON.stringify({ error: "Invalid token: LINE user ID not found" }),
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
        user_id: userId,
        line_user_id: lineUserId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error linking LINE account:", error);
      throw error;
    }

    // Delete the used token
    await supabase
      .from("line_link_tokens")
      .delete()
      .eq("token", linkToken.toUpperCase());

    console.log(`Successfully linked LINE account ${lineUserId} to user ${userId}`);

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