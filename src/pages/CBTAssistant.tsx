import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, RotateCcw, Send, Brain } from 'lucide-react';
import { VoiceActivityDetector, blobToBase64, playAudioFromBase64 } from '@/utils/voice-activity-detector';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CBTAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const { toast } = useToast();
  
  // Voice Activity Detector setup
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const conversationHistory = useRef<Array<{role: string, content: string}>>([]);

  // Initialize welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your CBT assistant. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleAudioRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setStatus('Transcribing audio...');

    try {
      // Step 1: Convert audio to base64 and transcribe
      const base64Audio = await blobToBase64(audioBlob);
      
      const transcriptionResult = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (transcriptionResult.error) {
        throw new Error(transcriptionResult.error.message);
      }

      const transcribedText = transcriptionResult.data.text;
      console.log('Transcribed text:', transcribedText);

      if (!transcribedText?.trim()) {
        throw new Error('No speech detected. Please try speaking more clearly.');
      }

      // Add user message to chat
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: transcribedText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Process the transcribed text
      await processMessage(transcribedText, true);

    } catch (error) {
      console.error('Error processing audio:', error);
      setError(error instanceof Error ? error.message : 'Failed to process audio');
      toast({
        title: "Audio Processing Error",
        description: error instanceof Error ? error.message : 'Failed to process audio',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setStatus('Ready');
    }
  };

  const processMessage = async (text: string, isVoiceMessage = false) => {
    setIsProcessing(true);
    setStatus('Generating response...');

    try {
      // Step 2: Generate CBT response using gpt-4.1
      const responseResult = await supabase.functions.invoke('generate-cbt-response', {
        body: { 
          message: text,
          conversationHistory: conversationHistory.current
        }
      });

      if (responseResult.error) {
        throw new Error(responseResult.error.message);
      }

      const assistantResponse = responseResult.data.response;
      console.log('Generated response:', assistantResponse);

      // Add assistant message to chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update conversation history
      conversationHistory.current.push(
        { role: 'user', content: text },
        { role: 'assistant', content: assistantResponse }
      );

      // Keep only last 10 exchanges to manage context length
      if (conversationHistory.current.length > 20) {
        conversationHistory.current = conversationHistory.current.slice(-20);
      }

      // Step 3: Convert response to speech if this was a voice message
      if (isVoiceMessage) {
        setStatus('Converting to speech...');
        
        const ttsResult = await supabase.functions.invoke('text-to-speech-cbt', {
          body: { text: assistantResponse, voice: 'alloy' }
        });

        if (ttsResult.error) {
          console.error('TTS Error:', ttsResult.error);
          // Don't throw error for TTS failure, just log it
        } else {
          // Play the generated audio
          await playAudioFromBase64(ttsResult.data.audioContent);
        }
      }

      toast({
        title: "Response Generated",
        description: "CBT assistant has responded successfully."
      });

    } catch (error) {
      console.error('Error processing message:', error);
      setError(error instanceof Error ? error.message : 'Failed to process message');
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : 'Failed to process message',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setStatus('Ready');
    }
  };

  const startVoiceMode = async () => {
    if (isListening || isProcessing) return;

    try {
      setError('');
      vadRef.current = new VoiceActivityDetector(
        handleAudioRecording,
        () => {
          setIsRecording(true);
          setStatus('🔴 Speaking detected... Recording!');
        },
        () => {
          setIsRecording(false);
          setStatus('🔄 Processing audio...');
        },
        (volume) => {
          setVolumeLevel(volume);
        }
      );
      
      await vadRef.current.initialize();
      vadRef.current.startListening();
      
      setIsListening(true);
      setStatus('🎤 Listening for voice... Speak naturally!');
      
      toast({
        title: "Voice Mode Active",
        description: "Speak naturally! I'll automatically detect when you start and stop talking.",
      });
    } catch (err) {
      console.error('Error starting voice mode:', err);
      setStatus('Ready');
      setError(`Error: ${(err as Error).message}`);
      toast({
        title: "Microphone Error",
        description: "Failed to start voice mode. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopVoiceMode = () => {
    if (!isListening || !vadRef.current) return;

    vadRef.current.stopListening();
    vadRef.current.dispose();
    vadRef.current = null;
    
    setIsListening(false);
    setIsRecording(false);
    setVolumeLevel(0);
    setStatus('Ready');
    
    toast({
      title: "Voice Mode Stopped",
      description: "Voice detection has been disabled."
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vadRef.current) {
        vadRef.current.dispose();
      }
    };
  }, []);

  const resetSession = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your CBT assistant. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
      timestamp: new Date()
    }]);
    conversationHistory.current = [];
    setStatus('Ready');
    setError('');
    toast({
      title: "Session Reset",
      description: "New session started successfully."
    });
  };

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    await processMessage(text, false);
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
            Your personal cognitive behavioral therapy assistant with chained AI processing
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={resetSession}
            disabled={isListening || isRecording}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset Session
          </Button>
          
          <Button
            onClick={isListening ? stopVoiceMode : startVoiceMode}
            disabled={isProcessing}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="w-full"
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop Voice Mode
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Voice Mode
              </>
            )}
          </Button>
          
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
            <div className="text-sm text-foreground mb-2">{error || status}</div>
            {isListening && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Voice Activity</div>
                <div className="w-full bg-background rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-150 ${
                      volumeLevel > 0.02 ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    style={{ width: `${Math.min(volumeLevel * 500, 100)}%` }}
                  />
                </div>
                {isRecording && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Recording...
                  </div>
                )}
              </div>
            )}
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
                  disabled={!inputText.trim() || isProcessing}
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