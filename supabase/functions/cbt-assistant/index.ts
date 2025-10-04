import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build conversation context for CBT
    const systemPrompt = `You are a compassionate and professional Cognitive Behavioral Therapy (CBT) assistant. Your role is to help users identify, examine, and restructure unhelpful thought patterns using evidence-based CBT techniques.

Key CBT techniques to use:
1. Thought challenging: Help identify cognitive distortions (all-or-nothing thinking, catastrophizing, mind reading, etc.)
2. Behavioral activation: Suggest small, manageable activities
3. Mindfulness: Help users stay present and observe thoughts without judgment
4. Problem-solving: Break down overwhelming problems into manageable steps
5. Psychoeducation: Briefly explain the connection between thoughts, feelings, and behaviors

Guidelines:
- Be warm, empathetic, and non-judgmental
- Ask thoughtful follow-up questions to help users explore their thoughts
- Suggest practical coping strategies and homework assignments
- Validate emotions while gently challenging unhelpful thought patterns
- Keep responses conversational and accessible, not overly clinical
- If someone expresses suicidal thoughts or severe mental health crisis, encourage them to seek immediate professional help

Remember: You're a supportive tool, not a replacement for professional therapy.`;

    // Convert conversation history to OpenAI format
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with message count:', messages.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');

    const assistantResponse = data.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from OpenAI');
    }

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in CBT assistant function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        response: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or consider reaching out to a mental health professional if you need immediate support."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});