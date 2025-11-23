import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, language, contentType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Default to English if no language specified, or if invalid language
    const validLanguage = (language === 'th' || language === 'en') ? language : 'en';
    console.log('Transcribing audio in language:', validLanguage);

    // Determine audio format from content type
    const audioType = contentType || 'audio/webm';
    const extension = audioType.includes('m4a') ? 'm4a' : audioType.includes('webm') ? 'webm' : 'mp3';
    console.log('Audio format:', audioType, 'extension:', extension);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing audio transcription with gpt-4o-transcribe...');

    // Convert base64 to blob for OpenAI API
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create form data for transcription
    const formData = new FormData();
    const audioBlob = new Blob([bytes], { type: audioType });
    formData.append('file', audioBlob, `audio.${extension}`);
    formData.append('model', 'gpt-4o-transcribe');
    formData.append('language', validLanguage);

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      console.error('Transcription API error:', error);
      throw new Error(`Transcription failed: ${error}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    console.log('Transcription result:', transcriptionResult.text);

    return new Response(
      JSON.stringify({ text: transcriptionResult.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcription function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});