import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, RotateCcw, Send, Brain } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '@/utils/audio';

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
  
  // Gemini Live Audio setup
  const clientRef = useRef<GoogleGenAI | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputNodeRef = useRef<GainNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  // Initialize Gemini client and audio contexts
  useEffect(() => {
    const initClient = async () => {
      try {
        console.log('Initializing audio contexts...');
        
        // Initialize audio contexts
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000
        });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
        
        inputNodeRef.current = inputAudioContextRef.current.createGain();
        outputNodeRef.current = outputAudioContextRef.current.createGain();
        outputNodeRef.current.connect(outputAudioContextRef.current.destination);
        
        nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
        
        console.log('Creating GoogleGenAI client...');
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          setError('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your environment.');
          setStatus('Error: Missing API Key');
          return;
        }
        
        clientRef.current = new GoogleGenAI({
          apiKey: apiKey,
        });
        
        console.log('Client created successfully');
        setStatus('Ready');
        
        await initSession();
      } catch (error) {
        console.error('Error initializing client:', error);
        setError('Failed to initialize AI client. Please check your API key.');
        setStatus('Error');
      }
    };
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your CBT assistant. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    
    initClient();
    
    return () => {
      // Cleanup
      sessionRef.current?.close();
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
    };
  }, []);

  const initSession = async () => {
    if (!clientRef.current) return;
    
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';
    
    try {
      console.log('Initializing session...');
      sessionRef.current = await clientRef.current.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            console.log('Session opened successfully');
            setStatus('Connected');
            setError('');
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log('Received message:', message);
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData;

            if (audio) {
              console.log('Processing audio response...');
              if (!outputAudioContextRef.current) return;
              
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputAudioContextRef.current.currentTime,
              );

              try {
                const audioBuffer = await decodeAudioData(
                  decode(audio.data),
                  outputAudioContextRef.current,
                  24000,
                  1,
                );
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNodeRef.current!);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                sourcesRef.current.add(source);
              } catch (audioError) {
                console.error('Error playing audio:', audioError);
              }
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = outputAudioContextRef.current?.currentTime || 0;
            }
            
            // Handle text content for display
            const textContent = message.serverContent?.modelTurn?.parts.find(part => part.text)?.text;
            if (textContent) {
              const newMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: textContent,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, newMessage]);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setError(e.message);
            setStatus('Error');
          },
          onclose: (e: CloseEvent) => {
            console.log('Session closed:', e.reason);
            setStatus('Disconnected: ' + e.reason);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a compassionate and professional Cognitive Behavioral Therapy (CBT) assistant. Your role is to help users identify, examine, and restructure unhelpful thought patterns using evidence-based CBT techniques. Respond immediately as the user speaks—no need to wait for silence. Keep responses brief and supportive.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
            languageCode: 'en-US'
          }
        },
      });
      console.log('Session initialized successfully');
    } catch (e) {
      console.error('Error initializing session:', e);
      setError('Failed to initialize session: ' + (e as Error).message);
      setStatus('Error');
    }
  };

  const startRecording = async () => {
    if (isRecording || !inputAudioContextRef.current) return;

    try {
      await inputAudioContextRef.current.resume();
      await outputAudioContextRef.current?.resume();
      setStatus('Requesting microphone access...');

      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setStatus('Microphone access granted. Starting capture...');

      sourceNodeRef.current = inputAudioContextRef.current.createMediaStreamSource(
        mediaStreamRef.current,
      );
      sourceNodeRef.current.connect(inputNodeRef.current!);

      const bufferSize = 256;
      scriptProcessorNodeRef.current = inputAudioContextRef.current.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      scriptProcessorNodeRef.current.onaudioprocess = (audioProcessingEvent) => {
        if (!isRecording || !sessionRef.current) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        try {
          const audioBlob = createBlob(pcmData);
          sessionRef.current.sendRealtimeInput({ media: audioBlob as any });
        } catch (error) {
          console.error('Error sending audio chunk:', error);
        }
      };

      sourceNodeRef.current.connect(scriptProcessorNodeRef.current);
      scriptProcessorNodeRef.current.connect(inputAudioContextRef.current.destination);

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
    if (!isRecording && !mediaStreamRef.current && !inputAudioContextRef.current) return;

    setStatus('Stopping recording...');
    setIsRecording(false);

    if (scriptProcessorNodeRef.current && sourceNodeRef.current && inputAudioContextRef.current) {
      scriptProcessorNodeRef.current.disconnect();
      sourceNodeRef.current.disconnect();
    }

    scriptProcessorNodeRef.current = null;
    sourceNodeRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setStatus('Recording stopped. Click Start to begin again.');
    toast({
      title: "Recording Stopped",
      description: "Processing your input..."
    });
  };

  const resetSession = () => {
    sessionRef.current?.close();
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your CBT assistant. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
      timestamp: new Date()
    }]);
    initSession();
    setStatus('Session reset');
    setError('');
    toast({
      title: "Session Reset",
      description: "New session started successfully."
    });
  };

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || !sessionRef.current) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      // Send text message to Gemini
      const textBlob = new Blob([text], { type: 'text/plain' });
      await sessionRef.current.sendRealtimeInput({
        media: textBlob as any
      });
      
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">CBT Assistant</h1>
          </div>
          <p className="text-muted-foreground">
            Your personal cognitive behavioral therapy assistant powered by Gemini AI
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
            disabled={!sessionRef.current}
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
                  disabled={!inputText.trim() || !sessionRef.current}
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