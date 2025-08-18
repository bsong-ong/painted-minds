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
    const { imageData, prompt, userDescription, drawingId } = await req.json();
    
    if (!imageData || !drawingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageData and drawingId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log('Analyzing and enhancing drawing with user description:', userDescription, 'and style prompt:', prompt);

    // First, use OpenAI Vision to analyze the drawing
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this drawing and provide a detailed description. The user says they drew: "${userDescription || 'no description provided'}". Focus on the shapes, objects, composition, and artistic elements that relate to what the user intended. Then create a detailed prompt for generating a charming colored pencil drawing that enhances what the user actually drew. Additional style context: ${prompt || 'colored pencil style'}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 500
      }),
    });

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json();
      console.error('OpenAI Vision API error:', errorData);
      throw new Error(`OpenAI Vision API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const visionData = await visionResponse.json();
    const description = visionData.choices[0].message.content;
    console.log('Drawing analysis completed:', description);

    // Create enhanced prompt for Flux, prioritizing user intent
    const userIntent = userDescription ? `The user intended to draw: ${userDescription}. ` : '';
    const styleHint = prompt ? `Style: ${prompt}. ` : '';
    const enhancedPrompt = `A charming colored pencil drawing, soft and artistic style, beautiful colors, hand-drawn aesthetic. ${userIntent}${styleHint}Based on the visual analysis: ${description}. Warm and inviting art style, detailed but not overly complex, pleasant and appealing.`;

    // Get Replicate API key
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_TOKEN');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_TOKEN is not set');
    }

    // Generate image using Flux via Replicate
    const fluxResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "b0306d92aa025bb747dc74162f3c27d6ed83798e08e5f8977adf3d859d0536a3",
        input: {
          prompt: enhancedPrompt,
          num_outputs: 1,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          width: 1024,
          height: 1024
        }
      }),
    });

    if (!fluxResponse.ok) {
      const errorData = await fluxResponse.json();
      console.error('Replicate API error:', errorData);
      throw new Error(`Replicate API error: ${errorData.detail || 'Unknown error'}`);
    }

    const fluxData = await fluxResponse.json();
    console.log('Flux generation started:', fluxData.id);

    // Poll for completion
    let imageUrl = null;
    const maxAttempts = 60; // Increased from 30 to 60 attempts
    let attempts = 0;

    while (attempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${fluxData.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Status check:', statusData.status);
        
        if (statusData.status === 'succeeded' && statusData.output) {
          imageUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
          break;
        } else if (statusData.status === 'failed') {
          throw new Error('Flux generation failed');
        }
      }
      
      attempts++;
    }

    if (!imageUrl) {
      throw new Error('Flux generation timed out');
    }
    
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
        flux_prompt: enhancedPrompt,
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