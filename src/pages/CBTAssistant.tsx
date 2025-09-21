import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, RotateCcw, Send, Brain, ArrowLeft } from 'lucide-react';
import { VoiceActivityDetector, blobToBase64, playAudioFromBase64 } from '@/utils/voice-activity-detector';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CBTAssistant = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [needsMicResume, setNeedsMicResume] = useState(false);
  const { toast } = useToast();

  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const conversationHistory = useRef<Array<{ role: string; content: string }>>([]);

  const isLowContent = (s: string | undefined | null) => {
    const t = (s ?? '').trim();
    if (t.length < 2) return true;
    return /^[\p{P}\p{Z}\p{C}]+$/u.test(t);
  };

  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content:
        language === 'th'
          ? 'สวัสดีค่ะ! ฉันเป็นผู้ช่วย CBT ของคุณ ฉันมาช่วยให้คุณได้สำรวจความคิดและความรู้สึกผ่านเทคนิค CBT ที่ได้รับการพิสูจน์แล้ว คุณสามารถพิมพ์หรือพูดกับฉันเกี่ยวกับสิ่งที่คุณคิด วันนี้คุณรู้สึกอย่างไรบ้างคะ?'
          : "Hello! I'm your CBT assistant. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [language]);

  const handleAudioRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setStatus('Transcribing audio...');

    try {
      const base64Audio = await blobToBase64(audioBlob);

      const transcriptionResult = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio, language },
        headers: { Accept: 'application/json' },
      });

      if (transcriptionResult.error) {
        throw new Error(transcriptionResult.error.message || 'Transcription failed');
      }

      const transcribedText = transcriptionResult.data?.text as string | undefined;
      console.log('Transcribed text:', transcribedText);

      if (isLowContent(transcribedText)) {
        throw new Error('No meaningful speech detected. Please try again.');
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: transcribedText!,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      await processMessage(transcribedText!, true);
    } catch (err) {
      console.error('Error processing audio:', err);
      const msg = err instanceof Error ? err.message : 'Failed to process audio';
      setError(msg);
      toast({
        title: 'Audio Processing Error',
        description: msg,
        variant: 'destructive',
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
      const responseResult = await supabase.functions.invoke('generate-cbt-response', {
        body: {
          message: text,
          conversationHistory: conversationHistory.current,
          language,
        },
        headers: { Accept: 'application/json' },
      });

      if (responseResult.error) {
        throw new Error(responseResult.error.message || 'Generation failed');
      }

      const assistantResponse = responseResult.data.response as string;
      console.log('Generated response:', assistantResponse);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      conversationHistory.current.push(
        { role: 'user', content: text },
        { role: 'assistant', content: assistantResponse }
      );
      if (conversationHistory.current.length > 20) {
        conversationHistory.current = conversationHistory.current.slice(-20);
      }

      if (isVoiceMessage) {
        setStatus('Converting to speech...');
        const wasListening = isListening;

        try {
          vadRef.current?.pause();

          const ttsResult = await supabase.functions.invoke('text-to-speech-cbt', {
            body: { text: assistantResponse, voice: 'alloy', language },
            headers: { Accept: 'application/json' },
          });

          if (ttsResult.error) {
            console.error('TTS Error:', ttsResult.error);
          } else if (ttsResult.data?.audioContent) {
            await playAudioFromBase64(ttsResult.data.audioContent);
          }
        } catch (ttsErr) {
          console.error('TTS playback error:', ttsErr);
        } finally {
          await new Promise((r) => setTimeout(r, 200)); // let echo die down
          if (wasListening && vadRef.current) {
            // self-heal & re-arm the VAD
            await vadRef.current.ensureAlive();
            await vadRef.current.resume();

            if (!(vadRef.current as any).vadCheckInterval) {
              vadRef.current.startListening();
            }

            const health = vadRef.current.health?.();
            console.log('VAD health after ensureAlive:', health);

            if (health?.ctxState !== 'running') {
              setNeedsMicResume(true);
              setStatus(
                language === 'th'
                  ? 'แตะ “Resume Mic” เพื่อเริ่มฟังอีกครั้ง'
                  : 'Tap “Resume Mic” to continue listening'
              );
            } else {
              setNeedsMicResume(false);
              setStatus(
                language === 'th'
                  ? '🎤 กำลังฟังเสียง... พูดตามธรรมชาติ!'
                  : '🎤 Listening for voice... Speak naturally!'
              );
            }
          }
        }
      }

      toast({
        title: 'Response Generated',
        description: 'CBT assistant has responded successfully.',
      });
    } catch (err) {
      console.error('Error processing message:', err);
      const msg = err instanceof Error ? err.message : 'Failed to process message';
      setError(msg);
      toast({
        title: 'Processing Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      if (!isVoiceMessage) setStatus('Ready');
    }
  };

  const resumeMic = async () => {
    try {
      await vadRef.current?.ensureAlive();
      await vadRef.current?.resume();
      if (vadRef.current && !(vadRef.current as any).vadCheckInterval) {
        vadRef.current.startListening();
      }
      console.log('Resume Mic clicked; health:', vadRef.current?.health());
      setNeedsMicResume(false);
      setStatus(
        language === 'th'
          ? '🎤 กำลังฟังเสียง... พูดตามธรรมชาติ!'
          : '🎤 Listening for voice... Speak naturally!'
      );
    } catch (e) {
      console.error('Resume mic failed:', e);
    }
  };

  // Auto-resume on next user gesture if the browser requires it
  useEffect(() => {
    if (!needsMicResume) return;
    const onGesture = async () => {
      await resumeMic();
      window.removeEventListener('click', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('click', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('click', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [needsMicResume]);

  const startVoiceMode = async () => {
    if (isListening || isProcessing) return;

    try {
      setError('');
      vadRef.current = new VoiceActivityDetector(
        handleAudioRecording,
        () => {
          setIsRecording(true);
          setStatus(language === 'th' ? '🔴 ตรวจพบเสียงพูด... กำลังบันทึก!' : '🔴 Speaking detected... Recording!');
        },
        () => {
          setIsRecording(false);
          setStatus('🔄 Processing audio...');
        },
        (volume) => {
          // Show 0 when paused so the bar drops instead of freezing mid-green
          const isPaused = vadRef.current && (vadRef.current as any).paused;
          setVolumeLevel(isPaused ? 0 : volume);
        }
      );

      await vadRef.current.initialize();
      vadRef.current.startListening();
      await vadRef.current.ensureAlive();
      await vadRef.current.resume();

      setIsListening(true);
      setStatus(language === 'th' ? '🎤 กำลังฟังเสียง... พูดตามธรรมชาติ!' : '🎤 Listening for voice... Speak naturally!');

      toast({
        title: language === 'th' ? 'เปิดโหมดเสียง' : 'Voice Mode Active',
        description:
          language === 'th'
            ? 'พูดตามธรรมชาติ! ฉันจะตรวจจับอัตโนมัติเมื่อคุณเริ่มและหยุดพูด'
            : "Speak naturally! I'll automatically detect when you start and stop talking.",
      });
    } catch (err) {
      console.error('Error starting voice mode:', err);
      setStatus('Ready');
      setError(`Error: ${(err as Error).message}`);
      toast({
        title: 'Microphone Error',
        description: 'Failed to start voice mode. Please check your microphone permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopVoiceMode = () => {
    if (!isListening || !vadRef.current) return;

    vadRef.current.stopListening();
    vadRef.current.dispose(); // only dispose when user explicitly stops
    vadRef.current = null;

    setIsListening(false);
    setIsRecording(false);
    setVolumeLevel(0);
    setStatus('Ready');

    toast({
      title: 'Voice Mode Stopped',
      description: 'Voice detection has been disabled.',
    });
  };

  useEffect(() => {
    return () => {
      if (vadRef.current) vadRef.current.dispose();
    };
  }, []);

  const resetSession = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content:
          language === 'th'
            ? 'สวัสดีค่ะ! ฉันเป็นผู้ช่วย CBT ของคุณ ฉันมาช่วยให้คุณได้สำรวจความคิดและความรู้สึกผ่านเทคนิค CBT ที่ได้รับการพิสูจน์แล้ว คุณสามารถพิมพ์หรือพูดกับฉันเกี่ยวกับสิ่งที่คุณคิด วันนี้คุณรู้สึกอย่างไรบ้างคะ?'
            : "Hello! I'm your CBT assistant. I'm here to help you explore your thoughts and feelings through evidence-based cognitive behavioral therapy techniques. You can either type or speak to me about what's on your mind. How are you feeling today?",
        timestamp: new Date(),
      },
    ]);
    conversationHistory.current = [];
    setStatus('Ready');
    setError('');
    toast({
      title: language === 'th' ? 'รีเซ็ตเซสชัน' : 'Session Reset',
      description: language === 'th' ? 'เริ่มเซสชันใหม่เรียบร้อยแล้ว' : 'New session started successfully.',
    });
  };

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    await processMessage(text, false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {language === 'th' ? 'กลับ' : 'Back'}
            </Button>
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">CBT Assistant</h1>
            </div>
            <LanguageSwitcher />
          </div>
          <p className="text-muted-foreground">
            {language === 'th'
              ? 'ผู้ช่วย CBT ส่วนตัวของคุณด้วยการประมวลผล AI แบบต่อเชื่อม'
              : 'Your personal cognitive behavioral therapy assistant with chained AI processing'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={resetSession} disabled={isListening || isRecording} variant="outline" size="lg" className="w-full">
            <RotateCcw className="w-5 h-5 mr-2" />
            {language === 'th' ? 'รีเซ็ตเซสชัน' : 'Reset Session'}
          </Button>

          <Button
            onClick={isListening ? stopVoiceMode : startVoiceMode}
            disabled={isProcessing}
            variant={isListening ? 'destructive' : 'default'}
            size="lg"
            className="w-full"
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                {language === 'th' ? 'หยุดโหมดเสียง' : 'Stop Voice Mode'}
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                {language === 'th' ? 'เริ่มโหมดเสียง' : 'Start Voice Mode'}
              </>
            )}
          </Button>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
            <div className="text-sm text-foreground mb-2">{error || status}</div>

            {needsMicResume && (
              <Button size="sm" onClick={resumeMic} className="mb-2">
                {language === 'th' ? 'Resume Mic' : 'Resume Mic'}
              </Button>
            )}

            {isListening && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Voice Activity</div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-150 ${volumeLevel > 0.02 ? 'bg-green-500' : 'bg-gray-300'}`}
                    style={{ width: `${Math.min(volumeLevel * 500, 100)}%` }}
                  />
                </div>
                {isRecording && (
                  <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
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
            <CardDescription>Share your thoughts and let’s work through them together using CBT techniques</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
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
                <Button onClick={() => sendMessage()} disabled={!inputText.trim() || isProcessing} className="gap-2">
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
