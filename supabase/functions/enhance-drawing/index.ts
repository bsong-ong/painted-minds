import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, prompt, drawingId } = await req.json();
    
    if (!imageData || !prompt || !drawingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageData, prompt, and drawingId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log('Enhancing drawing with prompt:', prompt);

    // Create the enhanced prompt
    const enhancedPrompt = `Transform this simple sketch into a beautiful, detailed drawing. ${prompt}. Make it artistic and visually appealing while maintaining the core elements of the original sketch.`;

    // Call OpenAI's image generation API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('Invalid response from OpenAI API');
    }

    // Get the image URL
    const imageUrl = data.data[0].url;
    
    // Fetch the image and convert to blob
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the original drawing to extract user_id
    const { data: originalDrawing, error: fetchError } = await supabase
      .from('drawings')
      .select('user_id, title')
      .eq('id', drawingId)
      .single();

    if (fetchError || !originalDrawing) {
      throw new Error('Original drawing not found');
    }

    // Upload enhanced image to storage
    const enhancedFileName = `${originalDrawing.user_id}/${Date.now()}_enhanced_${originalDrawing.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(enhancedFileName, imageBlob, {
        contentType: 'image/png',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL for the enhanced image
    const { data: { publicUrl } } = supabase.storage
      .from('drawings')
      .getPublicUrl(enhancedFileName);

    // Update the original drawing record with enhanced image data
    const { error: updateError } = await supabase
      .from('drawings')
      .update({
        enhanced_image_url: publicUrl,
        enhanced_storage_path: enhancedFileName,
        enhancement_prompt: prompt,
        is_enhanced: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', drawingId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Drawing enhanced successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        enhancedImageUrl: publicUrl,
        message: 'Drawing enhanced successfully!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhance-drawing function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to enhance drawing', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});