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
    const { message, topics, englishTutorMode, conversationHistory, isInitial } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let userMessage = message;

    if (englishTutorMode) {
      systemPrompt = `You are an English conversation tutor for Thai speakers. Your role is to:
1. Help users practice English conversation about topics that make them happy
2. Gently correct grammar, pronunciation, and word choice errors
3. Provide explanations in Thai when users request clarification (use "ภาษาไทย:" prefix)
4. Keep conversations positive and encouraging
5. Focus on topics from their gratitude journal: ${topics.join(', ')}

Be friendly, patient, and supportive. Correct errors naturally within your responses.
If users ask for Thai explanations, provide them clearly.`;
    } else {
      systemPrompt = `You are a cheerful AI companion called "Talk Buddy" who loves talking about happy topics.
Your role is to:
1. Have warm, engaging conversations about things that make people happy
2. Draw topics from the user's gratitude journal entries: ${topics.join(', ')}
3. Be encouraging and positive
4. Ask follow-up questions to keep the conversation flowing
5. Share in their joy and help them explore what makes them happy

Keep responses conversational, warm, and under 100 words.`;
    }

    if (isInitial) {
      if (topics.length === 0) {
        userMessage = englishTutorMode 
          ? "Start an English practice conversation about general happy topics since the user hasn't written any journal entries yet."
          : "Start a conversation about general happy topics since the user hasn't written any journal entries yet.";
      } else {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        userMessage = englishTutorMode
          ? `Start an English practice conversation about this topic from their journal: "${randomTopic}"`
          : `Start a conversation about this topic from their journal: "${randomTopic}"`;
      }
    }

    // Build conversation context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-8).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    console.log('Sending request to OpenAI with messages:', messages);

    // Get text response
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!chatResponse.ok) {
      const error = await chatResponse.text();
      console.error('Chat API error:', error);
      throw new Error(`Chat API failed: ${error}`);
    }

    const chatData = await chatResponse.json();
    const responseText = chatData.choices[0].message.content;

    console.log('Generated response:', responseText);

    // Generate speech from text
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        input: responseText,
        voice: 'echo',
        response_format: 'mp3',
      }),
    });

    let audioContent = null;
    if (ttsResponse.ok) {
      const arrayBuffer = await ttsResponse.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Convert to base64 in chunks
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      audioContent = btoa(binaryString);
      console.log('Generated audio content');
    } else {
      console.error('TTS API error:', await ttsResponse.text());
    }

    return new Response(
      JSON.stringify({ 
        message: responseText,
        audioContent: audioContent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in talk-buddy-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});