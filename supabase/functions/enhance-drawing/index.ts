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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin settings to determine which backend to use
    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('use_openrouter_for_images')
      .single();

    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError);
    }

    const useOpenRouter = adminSettings?.use_openrouter_for_images || false;
    
    console.log(`Using ${useOpenRouter ? 'OpenRouter/Gemini Flash' : 'Replicate'} for image enhancement`);

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

    // Create enhanced prompt for image generation, prioritizing user intent
    const userIntent = userDescription ? `The user intended to draw: ${userDescription}. ` : '';
    const styleHint = prompt ? `Style: ${prompt}. ` : '';
    const enhancedPrompt = `A charming colored pencil drawing, soft and artistic style, beautiful colors, hand-drawn aesthetic. ${userIntent}${styleHint}Based on the visual analysis: ${description}. Warm and inviting art style, detailed but not overly complex, pleasant and appealing.`;

    let imageUrl = null;

    if (useOpenRouter) {
      // Use OpenRouter with Gemini 2.5 Flash Image Preview for image generation
      const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
      if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set');
      }

      console.log('Generating image with OpenRouter/Gemini 2.5 Flash Image Preview');
      
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://painted-smiles.lovable.app',
          'X-Title': 'Painted Smiles Drawing Enhancement'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Generate an enhanced version of this drawing: ${enhancedPrompt}`
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
          max_tokens: 4096
        }),
      });

      if (!openRouterResponse.ok) {
        const errorData = await openRouterResponse.json();
        console.error('OpenRouter API error:', errorData);
        throw new Error(`OpenRouter API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const openRouterData = await openRouterResponse.json();
      // Log a compact preview of the response for debugging
      try {
        console.log('OpenRouter response (preview):', JSON.stringify(openRouterData).slice(0, 1500));
      } catch (_) {}

      // Try to extract an image from various possible response shapes
      const choice = openRouterData?.choices?.[0];
      const content = choice?.message?.content;
      let foundUrl: string | null = null;
      let dataUrl: string | null = null;

      const tryExtractFromText = (txt: string) => {
        const urlMatch = txt.match(/https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp|gif)/i);
        if (urlMatch) foundUrl = urlMatch[0];
        const dataMatch = txt.match(/data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/);
        if (dataMatch) dataUrl = dataMatch[0];
      };

      if (Array.isArray(content)) {
        for (const part of content) {
          if (typeof part === 'string') {
            tryExtractFromText(part);
          } else if (part && typeof part === 'object') {
            // Common OpenRouter content formats
            if (typeof part.text === 'string') tryExtractFromText(part.text);
            if (typeof part.image_url === 'string') foundUrl = part.image_url;
            if (typeof part.url === 'string' && /^(data:image\/.+;base64,|https?:\/\/)/i.test(part.url)) {
              if (part.url.startsWith('data:')) dataUrl = part.url; else foundUrl = part.url;
            }
            if (typeof part.b64_json === 'string') dataUrl = `data:image/png;base64,${part.b64_json}`;
            if (typeof part.image_base64 === 'string') dataUrl = `data:image/png;base64,${part.image_base64}`;
            if (part.image && typeof part.image === 'string') {
              if (part.image.startsWith('data:')) dataUrl = part.image; else foundUrl = part.image;
            }
          }
          if (foundUrl || dataUrl) break;
        }
      } else if (typeof content === 'string') {
        tryExtractFromText(content);
      }

      if (foundUrl) {
        imageUrl = foundUrl;
        console.log('Gemini image URL extracted');
      } else if (dataUrl) {
        imageUrl = dataUrl; // Will be handled later as data URL
        console.log('Gemini image data URL extracted');
      } else {
        throw new Error('No image found in Gemini response');
      }

    } else {
      // Use Replicate with Flux as before
      const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_TOKEN');
      if (!REPLICATE_API_KEY) {
        throw new Error('REPLICATE_API_TOKEN is not set');
      }

      console.log('Generating image with Replicate/Flux');

      // Generate image using Flux via Replicate
      const fluxResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "black-forest-labs/flux-dev",
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
      const maxAttempts = 60;
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
    }
    
    // Fetch the image (or decode data URL) and convert to blob
    let imageBlob: Blob;
    let contentType = 'image/png';

    if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        throw new Error('Invalid data URL returned by model');
      }
      contentType = match[1];
      const base64Data = match[2];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBlob = new Blob([bytes], { type: contentType });
    } else {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
      }
      contentType = imageResponse.headers.get('content-type') || contentType;
      imageBlob = await imageResponse.blob();
    }

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
        contentType,
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