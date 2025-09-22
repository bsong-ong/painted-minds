import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const TalkBuddy = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [englishTutorMode, setEnglishTutorMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      startConversation();
    }
  }, [user, englishTutorMode]);

  const startConversation = async () => {
    if (!user) return;
    
    try {
      const { data: drawings } = await supabase
        .from('drawings')
        .select('gratitude_prompt, user_description')
        .eq('user_id', user.id)
        .not('gratitude_prompt', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const topics = drawings?.map(d => d.gratitude_prompt || d.user_description).filter(Boolean) || [];
      
      const response = await supabase.functions.invoke('talk-buddy-chat', {
        body: {
          message: 'start_conversation',
          topics: topics,
          englishTutorMode: englishTutorMode,
          isInitial: true
        }
      });

      if (response.data?.message) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: response.data.message,
          isUser: false,
          timestamp: new Date()
        };
        setMessages([aiMessage]);

        // Speak the AI message
        if (response.data.audioContent) {
          speakMessage(response.data.audioContent);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('talk-buddy-chat', {
        body: {
          message: inputText,
          englishTutorMode: englishTutorMode,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        }
      });

      if (response.data?.message) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.message,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);

        // Speak the AI message
        if (response.data.audioContent) {
          speakMessage(response.data.audioContent);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = async (audioContent: string) => {
    try {
      setIsSpeaking(true);
      const audioData = atob(audioContent);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
    }
  };

  const toggleVoiceInput = async () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);
      
      // Simple voice recording implementation
      // In a real app, you'd want to use the Web Speech API or send audio to transcription
      setTimeout(() => {
        setIsListening(false);
        stream.getTracks().forEach(track => track.stop());
      }, 5000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeaking(!isSpeaking);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-gratitude-warm bg-clip-text text-transparent">
              Talk Buddy
            </h1>
          </div>
          <LanguageSwitcher />
        </div>

        {/* English Tutor Mode Toggle */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Switch
                id="english-tutor"
                checked={englishTutorMode}
                onCheckedChange={setEnglishTutorMode}
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

        {/* Chat Messages */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {englishTutorMode ? "English Practice Chat" : "Happy Chat"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input Area */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={englishTutorMode ? "Type your message in English..." : "What's making you happy today?"}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  onClick={toggleVoiceInput}
                  variant="outline"
                  size="sm"
                  className={isListening ? 'bg-destructive text-destructive-foreground' : ''}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={toggleSpeaker}
                  variant="outline"
                  size="sm"
                  className={isSpeaking ? 'bg-primary text-primary-foreground' : ''}
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalkBuddy;