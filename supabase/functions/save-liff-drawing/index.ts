import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, userId } = await req.json();

    if (!imageData || !userId) {
      throw new Error('Missing imageData or userId');
    }

    console.log('Processing drawing save for user:', userId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to blob
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `liff-drawing-${Date.now()}.png`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading to storage:', filePath);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(filePath, binaryData, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('drawings')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);

    // Insert into database
    const { error: insertError } = await supabase
      .from('drawings')
      .insert({
        user_id: userId,
        image_url: publicUrl,
        storage_path: filePath,
        title: 'LINE Drawing',
        is_gratitude_entry: false,
        is_public: false,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Drawing saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        publicUrl,
        message: 'Drawing saved successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-liff-drawing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
