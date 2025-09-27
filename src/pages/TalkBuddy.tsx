import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { FeatureGate } from '@/components/FeatureGate';
import { Mic, MicOff, RotateCcw, Send, Heart, ArrowLeft, LogOut } from 'lucide-react';
import { AudioRecorder, blobToBase64, playAudioFromBase64 } from '@/utils/audio-recorder';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const TalkBuddy = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const [englishTutorMode, setEnglishTutorMode] = useState(false);
  
  // Audio recording setup
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const conversationHistory = useRef<Array<{role: string, content: string}>>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Initialize welcome message and load user topics
  useEffect(() => {
    if (!loading && user) {
      initializeConversation();
    }
  }, [user, loading, englishTutorMode, t]);

  const initializeConversation = async () => {
    if (!user?.id) {
      console.log('User not available, skipping conversation initialization');
      return;
    }

    try {
      // Get user's gratitude topics from journal
      const { data: drawings } = await supabase
        .from('drawings')
        .select('gratitude_prompt, user_description')
        .eq('user_id', user.id)
        .not('gratitude_prompt', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const topics = drawings?.map(d => d.gratitude_prompt || d.user_description).filter(Boolean) || [];
      
      let welcomeMessage = '';
      if (englishTutorMode) {
        welcomeMessage = topics.length > 0 
          ? `Hello! I'm your Talk Buddy in English tutor mode! I'll help you practice English while talking about happy topics from your journal. I'll gently correct your English and can explain in Thai if needed. Let's talk about: ${topics.slice(0, 3).join(', ')}. What would you like to discuss?`
          : "Hello! I'm your Talk Buddy in English tutor mode! I'll help you practice English conversation about happy topics. Since you haven't written any journal entries yet, let's talk about things that make you happy in general. What makes you smile?";
      } else {
        if (topics.length > 0) {
          const randomTopic = topics[Math.floor(Math.random() * topics.length)];
          welcomeMessage = `Hi there! I'm your Talk Buddy! 😊 I love chatting about happy things. I noticed you wrote about "${randomTopic}" in your journal - that sounds wonderful! Tell me more about what makes you happy about that, or we can talk about something else that's bringing you joy today.`;
        } else {
          welcomeMessage = "Hi there! I'm your Talk Buddy! 😊 I love chatting about happy things that make people smile. Since you haven't written any journal entries yet, let's start fresh - what's something that made you happy recently?";
        }
      }

      const initialMessage: Message = {
        id: '1',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      conversationHistory.current = [];
    } catch (error) {
      console.error('Error initializing conversation:', error);
      const fallbackMessage: Message = {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your Talk Buddy! Let's chat about happy things! 😊",
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
    }
  };

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
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsProcessing(true);
    setStatus('Generating response...');

    try {
      // Get user's topics for context
      const { data: drawings } = await supabase
        .from('drawings')
        .select('gratitude_prompt, user_description')
        .eq('user_id', user.id)
        .not('gratitude_prompt', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const topics = drawings?.map(d => d.gratitude_prompt || d.user_description).filter(Boolean) || [];

      // Generate response using talk-buddy-chat function
      const responseResult = await supabase.functions.invoke('talk-buddy-chat', {
        body: { 
          message: text,
          topics: topics,
          englishTutorMode: englishTutorMode,
          conversationHistory: conversationHistory.current,
          isInitial: false
        }
      });

      if (responseResult.error) {
        throw new Error(responseResult.error.message);
      }

      const assistantResponse = responseResult.data.message;
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

      // Convert response to speech if this was a voice message
      if (isVoiceMessage && responseResult.data.audioContent) {
        setStatus('Converting to speech...');
        await playAudioFromBase64(responseResult.data.audioContent);
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
    initializeConversation();
    setStatus('Ready');
    setError('');
  };

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isProcessing || !user?.id) return;

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Show loading state while user is being authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to use Talk Buddy</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="talk_buddy">
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
        
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{t('talkBuddy')}</h1>
          </div>
          <p className="text-muted-foreground">
            Your cheerful AI companion for happy conversations about your gratitude journal
          </p>
        </div>

        {/* English Tutor Mode Toggle */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Switch
                id="english-tutor"
                checked={englishTutorMode}
                onCheckedChange={(checked) => {
                  setEnglishTutorMode(checked);
                }}
              />
              <Label htmlFor="english-tutor" className="text-sm font-medium">
                English Conversation Tutor (สำหรับคนไทย)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {englishTutorMode 
                ? "AI will help you practice English and correct your grammar/pronunciation"
                : "AI will chat with you about happy topics from your journal"
              }
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              {englishTutorMode 
                ? "Practice English while talking about happy things from your journal"
                : "Chat about the wonderful things that make you happy"
              }
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
              Reset Session
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

          {/* Text Input */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <Textarea
                  placeholder={englishTutorMode ? "Type your message in English..." : "What's making you happy today?"}
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
      </div>
    </FeatureGate>
  );
};

export default TalkBuddy;