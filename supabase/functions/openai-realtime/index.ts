import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Upgrade': 'websocket',
  'Connection': 'Upgrade'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected websocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let openAIWebSocket: WebSocket | null = null;

  socket.onopen = () => {
    console.log("Client WebSocket connected");
    
    // Connect to OpenAI Realtime API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      socket.send(JSON.stringify({ error: 'OpenAI API key not configured' }));
      socket.close();
      return;
    }

    const openAIUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
    openAIWebSocket = new WebSocket(openAIUrl, [], {
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    openAIWebSocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
      
      // Send session configuration
      const sessionConfig = {
        event_id: `event_${Date.now()}`,
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: "You are a compassionate and professional Cognitive Behavioral Therapy (CBT) assistant. Your role is to help users identify, examine, and restructure unhelpful thought patterns using evidence-based CBT techniques. Keep responses brief and supportive, around 1-2 sentences.",
          voice: "alloy",
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          temperature: 0.8,
          max_response_output_tokens: 4096
        }
      };
      
      openAIWebSocket!.send(JSON.stringify(sessionConfig));
    };

    openAIWebSocket.onmessage = (event) => {
      // Forward OpenAI messages to client
      socket.send(event.data);
    };

    openAIWebSocket.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
      socket.send(JSON.stringify({ error: 'OpenAI connection error' }));
    };

    openAIWebSocket.onclose = () => {
      console.log("OpenAI WebSocket closed");
      socket.close();
    };
  };

  socket.onmessage = (event) => {
    // Forward client messages to OpenAI
    if (openAIWebSocket && openAIWebSocket.readyState === WebSocket.OPEN) {
      openAIWebSocket.send(event.data);
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket disconnected");
    if (openAIWebSocket) {
      openAIWebSocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    if (openAIWebSocket) {
      openAIWebSocket.close();
    }
  };

  return response;
});