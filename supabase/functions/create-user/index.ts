import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  username?: string;
  display_name?: string;
  gratitude_journaling_enabled?: boolean;
  talk_buddy_enabled?: boolean;
  thought_buddy_enabled?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify the requesting user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabaseServiceRole
      .from('admins')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminData) {
      throw new Error("Access denied: Admin privileges required");
    }

    const { 
      email, 
      password, 
      username, 
      display_name,
      gratitude_journaling_enabled = true,
      talk_buddy_enabled = true,
      thought_buddy_enabled = true
    }: CreateUserRequest = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Create the user using service role
    const { data: newUser, error: createError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username,
        display_name,
        admin_created: true // Flag to indicate this was created by admin
      }
    });

    if (createError) {
      throw createError;
    }

    // Create user permissions record
    const { error: permissionsError } = await supabaseServiceRole
      .from('user_permissions')
      .insert({
        user_id: newUser.user?.id,
        gratitude_journaling_enabled,
        talk_buddy_enabled,
        thought_buddy_enabled
      });

    if (permissionsError) {
      console.error("Error creating user permissions:", permissionsError);
      // Don't fail the entire operation if permissions fail, just log it
    }

    console.log("User created successfully:", newUser.user?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user?.id,
          email: newUser.user?.email,
          username,
          display_name
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);