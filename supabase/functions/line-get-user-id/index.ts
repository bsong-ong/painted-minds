import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lineUserId } = await req.json();

    console.log("Received request with LINE user ID:", lineUserId);

    if (!lineUserId) {
      console.error("No lineUserId provided in request");
      return new Response(
        JSON.stringify({ error: "lineUserId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Query line_accounts using service role to bypass RLS
    console.log("Querying database for LINE user ID:", lineUserId);
    const { data, error } = await supabase
      .from("line_accounts")
      .select("user_id, line_user_id")
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    console.log("Database query result:", { data, error });

    if (error) {
      console.error("Database query error:", error);
      throw error;
    }

    if (!data) {
      console.log("No matching LINE account found for:", lineUserId);
      return new Response(
        JSON.stringify({ error: "LINE account not linked", receivedId: lineUserId }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found user:", data.user_id);
    return new Response(
      JSON.stringify({ userId: data.user_id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in line-get-user-id function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
