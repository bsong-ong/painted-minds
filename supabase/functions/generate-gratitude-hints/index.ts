import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, recentEntries } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get some default prompts from database
    const { data: defaultPrompts } = await supabase
      .from('gratitude_prompts')
      .select('prompt_text')
      .limit(5);

    const systemPrompt = `You are a helpful assistant that generates personalized gratitude journaling prompts. 
    Your prompts should be visual and encourage drawing/sketching something the user is grateful for.
    Keep prompts simple, positive, and actionable for visual expression.
    
    ${defaultPrompts ? `Here are some example prompts: ${defaultPrompts.map(p => p.prompt_text).join(', ')}` : ''}
    ${recentEntries ? `Recent entries the user has done: ${recentEntries.join(', ')}` : ''}
    ${mood ? `User's current mood: ${mood}` : ''}
    
    Generate 3 unique, personalized gratitude drawing prompts that are different from recent entries.`;

    console.log('Generating gratitude hints with mood:', mood);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate 3 personalized gratitude drawing prompts for me.' }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse the generated content into individual prompts
    const prompts = generatedContent
      .split('\n')
      .filter(line => line.trim() && !line.match(/^\d+\./))
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .filter(line => line.length > 10)
      .slice(0, 3);

    console.log('Generated gratitude hints:', prompts);

    return new Response(JSON.stringify({ prompts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-gratitude-hints function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});