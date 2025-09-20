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
    const { message, conversationHistory } = await req.json();
    
    if (!message) {
      throw new Error('No message provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating CBT response with gpt-4.1...');

    // Prepare conversation history for API
    const messages = [
      {
        role: 'system',
        content: `You are a compassionate and professional Cognitive Behavioral Therapy (CBT) assistant. Your role is to help users identify, examine, and restructure unhelpful thought patterns using evidence-based CBT techniques. 

Key guidelines:
- Keep responses brief and supportive (1-3 sentences)
- Use CBT techniques like cognitive restructuring, thought challenging, and behavioral interventions
- Ask thoughtful questions to help users explore their thoughts and feelings
- Provide gentle guidance without being directive
- Validate emotions while helping reframe negative thought patterns
- Suggest practical coping strategies when appropriate
- Maintain a warm, non-judgmental tone`
      },
      ...(conversationHistory || []),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        max_completion_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ChatCompletion API error:', error);
      throw new Error(`Chat completion failed: ${error}`);
    }

    const result = await response.json();
    const generatedText = result.choices[0].message.content;
    
    console.log('Generated response:', generatedText);

    return new Response(
      JSON.stringify({ response: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in CBT response function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});