import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, RotateCcw, Send, Brain } from 'lucide-react';
import { AudioRecorder, encodeAudioForAPI, playAudioData } from '@/utils/openai-audio';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CBTAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState('');
  const { toast } = useToast();
  
  // OpenAI Realtime API setup
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const responseIdRef = useRef<string>('');
  const currentTranscriptRef = useRef<string>('');

  // Initialize OpenAI Realtime API connection
  useEffect(() => {
    const initClient = async () => {
      try {
        console.log('Initializing audio context...');
        
        // Initialize audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
        
        console.log('Connecting to OpenAI Realtime API...');
        setStatus('Connecting...');
        
        // Wait a moment for the edge function to be ready
        setTimeout(() => {
          connectToOpenAI();
        }, 1000);
      } catch (error) {
        console.error('Error initializing client:', error);
        setError('Failed to initialize AI client. Please try again.');
        setStatus('Error');
      }
    };
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your CBT assistant powered by OpenAI. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    
    initClient();
    
    return () => {
      // Cleanup
      cleanup();
    };
  }, []);

  const connectToOpenAI = async () => {
    try {
      const wsUrl = `wss://jmhabxgjckihgptoyupm.functions.supabase.co/functions/v1/openai-realtime`;
      console.log('Connecting to:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setError('Failed to create WebSocket connection');
      setStatus('Error');
      return;
    }
    
    wsRef.current.onopen = () => {
      console.log('Connected to edge function WebSocket');
      setStatus('Connected to server, waiting for OpenAI...');
      setError('');
    };
    
    wsRef.current.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message type:', data.type);
        
        if (data.error) {
          console.error('Server error:', data.error);
          setError(`Server error: ${data.error}`);
          setStatus('Error');
          return;
        }
        
        if (data.type === 'openai_connected') {
          console.log('OpenAI connection established');
          setStatus('OpenAI Connected - Ready!');
          return;
        }
        
        switch (data.type) {
          case 'session.created':
            console.log('Session created');
            break;
            
          case 'session.updated':
            console.log('Session updated');
            break;
            
          case 'response.audio.delta':
            // Handle audio response
            if (audioContextRef.current && data.delta) {
              const binaryString = atob(data.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              await playAudioData(audioContextRef.current, bytes);
            }
            break;
            
          case 'response.audio_transcript.delta':
            // Handle transcript delta for display
            if (data.delta) {
              currentTranscriptRef.current += data.delta;
            }
            break;
            
          case 'response.audio_transcript.done':
            // Complete transcript received
            if (currentTranscriptRef.current.trim()) {
              const newMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: currentTranscriptRef.current.trim(),
                timestamp: new Date()
              };
              setMessages(prev => [...prev, newMessage]);
              currentTranscriptRef.current = '';
            }
            break;
            
          case 'response.done':
            console.log('Response complete');
            break;
            
          case 'input_audio_buffer.speech_started':
            console.log('Speech detected');
            break;
            
          case 'input_audio_buffer.speech_stopped':
            console.log('Speech ended');
            break;
            
          default:
            console.log('Unhandled message type:', data.type);
        }
      } catch (parseError) {
        console.error('Failed to parse WebSocket message:', parseError);
        return;
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error. Please check your internet connection and try again.');
      setStatus('Connection Error');
    };
    
    wsRef.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setStatus(`Disconnected (${event.code}): ${event.reason || 'Unknown reason'}`);
    };
  };

  const startRecording = async () => {
    if (isRecording || !audioContextRef.current || !wsRef.current) return;

    try {
      await audioContextRef.current.resume();
      setStatus('Starting recording...');

      audioRecorderRef.current = new AudioRecorder((audioData) => {
        if (isRecording && wsRef.current?.readyState === WebSocket.OPEN) {
          const audioBase64 = encodeAudioForAPI(audioData);
          const audioMessage = {
            type: 'input_audio_buffer.append',
            audio: audioBase64
          };
          wsRef.current.send(JSON.stringify(audioMessage));
        }
      });

      await audioRecorderRef.current.start();
      setIsRecording(true);
      setStatus('🔴 Recording... Speak now!');
      
      toast({
        title: "Recording Started",
        description: "Speak now! The AI will respond with both text and voice.",
      });
    } catch (err) {
      console.error('Error starting recording:', err);
      setStatus(`Error: ${(err as Error).message}`);
      setError(`Error: ${(err as Error).message}`);
      stopRecording();
      toast({
        title: "Microphone Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    setStatus('Stopping recording...');
    setIsRecording(false);

    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }

    setStatus('Recording stopped. Click Start to begin again.');
    toast({
      title: "Recording Stopped",
      description: "Processing your input..."
    });
  };

  const resetSession = () => {
    cleanup();
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your CBT assistant powered by OpenAI. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
      timestamp: new Date()
    }]);
    connectToOpenAI();
    setStatus('Session reset');
    setError('');
    toast({
      title: "Session Reset",
      description: "New session started successfully."
    });
  };

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      // Send text message to OpenAI
      const event = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: text
            }
          ]
        }
      };
      
      wsRef.current.send(JSON.stringify(event));
      wsRef.current.send(JSON.stringify({type: 'response.create'}));
      
      toast({
        title: "Message Sent",
        description: "Processing your message..."
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Send Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cleanup = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">CBT Assistant</h1>
          </div>
          <p className="text-muted-foreground">
            Your personal cognitive behavioral therapy assistant powered by OpenAI
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={resetSession}
            disabled={isRecording}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset Session
          </Button>
          
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN}
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className="w-full"
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </>
            )}
          </Button>
          
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
            <div className="text-sm text-foreground">{error || status}</div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Share your thoughts and let's work through them together using CBT techniques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <Textarea
                placeholder="Type your thoughts here or use voice recording..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[100px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              
              <div className="flex items-center justify-end">
                <Button
                  onClick={() => sendMessage()}
                  disabled={!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CBTAssistant;