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
        content: `You are a cognitive behavioral therapy assistant that guides users through a structured thought restructuring process. Your role is to warmly support them while following these specific steps:

**THOUGHT RESTRUCTURING PROCESS:**

1. **IDENTIFY THE SITUATION**: First, help them describe what happened. Ask: "What happened? Where were you? Who was involved?"

2. **NOTICE AUTOMATIC THOUGHTS**: Help them identify their immediate thoughts. Ask: "What went through your mind when this happened?"

3. **RECOGNIZE EMOTIONS**: Help them name their feelings and rate intensity (0-10). Ask: "What emotions did you feel? How intense was each feeling?"

4. **EXAMINE EVIDENCE FOR**: Guide them to find evidence supporting their thought. Ask: "What facts support this thought?"

5. **EXAMINE EVIDENCE AGAINST**: Help them find contradicting evidence. Ask: "What facts contradict this thought? Have there been times when the opposite was true?"

6. **IDENTIFY COGNITIVE DISTORTIONS**: Gently point out thinking patterns like:
   - All-or-Nothing Thinking
   - Overgeneralization
   - Mental Filter
   - Discounting Positives
   - Jumping to Conclusions
   - Catastrophizing
   - Emotional Reasoning
   - Should Statements
   - Labeling
   - Personalization

7. **CREATE BALANCED THOUGHT**: Help them develop a more balanced, realistic thought based on evidence.

8. **RE-RATE EMOTIONS**: Have them rate their emotions again to see if intensity changed.

**YOUR STYLE:**
- Keep responses brief (2-3 sentences)
- Ask one focused question at a time
- Be warm, validating, and non-judgmental
- Acknowledge their feelings before challenging thoughts
- Use their own words and examples
- Celebrate insights and progress
- When you identify a distortion, explain it gently with their example

**PROGRESSION:**
Move through steps naturally based on their responses. Don't rush. If they seem stuck, offer examples or gentle prompts. The process should feel conversational, not robotic.`
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