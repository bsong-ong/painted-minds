import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { FeatureGate } from '@/components/FeatureGate';
import { Mic, MicOff, RotateCcw, Send, Brain, ArrowLeft } from 'lucide-react';
import { AudioRecorder, blobToBase64, playAudioFromBase64 } from '@/utils/audio-recorder';
import { supabase } from '@/integrations/supabase/client';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CBTAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const { toast } = useToast();
  
  // Audio recording setup
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const conversationHistory = useRef<Array<{role: string, content: string}>>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if this is a standalone page (not embedded in tabs)
  const isStandalonePage = location.pathname === '/cbt-assistant';

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Initialize welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: t('cbtWelcomeMessage') || "Hello! I'm your CBT assistant. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [t]);

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

    } catch (error) {
      console.error('Error processing message:', error);
      setError(error instanceof Error ? error.message : 'Failed to process message');
    } finally {
      setIsProcessing(false);
      setStatus('Ready');
    }
  };

  const startRecording = async () => {
    if (isRecording || isProcessing) return;

    try {
      setError('');
      audioRecorderRef.current = new AudioRecorder(handleAudioRecording);
      await audioRecorderRef.current.start();
      
      setIsRecording(true);
      setStatus('🔴 Recording... Speak now!');
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setStatus('Ready');
      setError(`Error: ${(err as Error).message}`);
    }
  };

  const stopRecording = () => {
    if (!isRecording || !audioRecorderRef.current) return;

    audioRecorderRef.current.stop();
    setIsRecording(false);
    setStatus('Processing audio...');
  };

  const resetSession = () => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: t('cbtWelcomeMessage') || "Hello! I'm your CBT assistant. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    conversationHistory.current = [];
    setStatus(t('ready') || 'Ready');
    setError('');
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
    <FeatureGate feature="thought_buddy">
      <div className={isStandalonePage ? "min-h-screen bg-background" : "w-full"}>
      <div className={isStandalonePage ? "container mx-auto px-4 py-8 max-w-4xl" : "max-w-4xl mx-auto"}>
        {isStandalonePage && (
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToHome') || 'Back to Home'}
            </Button>
            <LanguageSwitcher />
          </div>
        )}
        
        <div className="mb-6 text-center">
          {isStandalonePage && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">{t('Thought Buddy') || 'Thought Buddy'}</h1>
            </div>
          )}
          <p className="text-muted-foreground">
            {t('cbtDescription') || 'Your personal cognitive behavioral therapy assistant with chained AI processing'}
          </p>
        </div>


        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('conversation') || 'Conversation'}</CardTitle>
            <CardDescription>
              {t('shareThoughts') || 'Share your thoughts and let\'s work through them together using CBT techniques'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full pr-4" ref={scrollAreaRef}>
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

        <div className="space-y-4">
          {/* Control Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={resetSession}
              disabled={isRecording}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              {t('resetSession') || 'Reset Session'}
            </Button>
            
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="w-full"
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  {t('stopRecording') || 'Stop Recording'}
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  {t('startRecording') || 'Start Recording'}
                </>
              )}
            </Button>
            
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">{t('status') || 'Status'}</div>
              <div className="text-sm text-foreground">{error || status}</div>
            </div>
          </div>

          {/* Text Input */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <Textarea
                  placeholder={t('typeThoughtsPlaceholder') || 'Type your thoughts here or use voice recording...'}
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
                    {t('send') || 'Send'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </FeatureGate>
  );
};

export default CBTAssistant;