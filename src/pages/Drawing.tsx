import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Save, RefreshCw, ArrowLeft, Heart, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { MobileCanvas, MobileCanvasRef } from '@/components/MobileCanvas';
import { MobileToolbar } from '@/components/MobileToolbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Drawing = () => {
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const canvasRef = useRef<MobileCanvasRef>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'erase' | 'rectangle' | 'circle'>('draw');
  const [activeColor, setActiveColor] = useState('#000000');
  const [gratitudeText, setGratitudeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const isMobile = useIsMobile();

  const colors = [
    '#000000', // black
    '#dc2626', // red
    '#16a34a', // green
    '#2563eb', // blue
    '#ca8a04', // yellow
    '#9333ea', // purple
    '#ea580c', // orange
    '#0891b2', // cyan
    '#be123c', // rose
    '#374151', // gray
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    // Get gratitude text from localStorage
    const storedText = localStorage.getItem('gratitude_text');
    if (!storedText) {
      navigate('/text-entry');
      return;
    }
    setGratitudeText(storedText);
  }, [user, loading, navigate]);

  // Canvas initialization is now handled by MobileCanvas component

  // Tool and color changes are now handled by MobileCanvas component

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);
  };

  const handleClear = () => {
    canvasRef.current?.clear();
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
  };

  const updateUserStreak = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (existingStreak) {
        const lastEntryDate = existingStreak.last_entry_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = 1;
        if (lastEntryDate === yesterdayStr) {
          newStreak = existingStreak.current_streak + 1;
        } else if (lastEntryDate === today) {
          return;
        }

        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, existingStreak.longest_streak),
            last_entry_date: today,
          })
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('user_streaks')
          .insert({
            user_id: user?.id,
            current_streak: 1,
            longest_streak: 1,
            last_entry_date: today,
          });
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Helper function to detect Thai text and translate to English
  const translateToEnglish = async (text: string) => {
    // Simple Thai detection (contains Thai characters)
    const hasThaiChars = /[\u0E00-\u0E7F]/.test(text);
    
    if (!hasThaiChars) {
      return text; // Already in English or other non-Thai language
    }

    try {
      // Simple translation using Google Translate API-like approach
      // For now, we'll just pass the text as-is and let the AI handle it
      // In a production app, you'd use a proper translation service
      return text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original if translation fails
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current?.canvas || !user) {
      toast.error(t('pleaseDrawSomething'));
      return;
    }

    try {
      setSaving(true);
      
      const dataURL = canvasRef.current.getDataURL();

      const blob = await fetch(dataURL).then(res => res.blob());
      const fileName = `gratitude-${Date.now()}.png`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('drawings')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('drawings')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('drawings')
        .insert({
          user_id: user.id,
          title: gratitudeText || 'My Gratitude Drawing',
          image_url: urlData.publicUrl,
          storage_path: filePath,
          gratitude_prompt: gratitudeText,
          is_gratitude_entry: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t('gratitudeDrawingSaved'));
      await updateUserStreak();

      // Auto-enhance the drawing
      try {
        setEnhancing(true);
        
        // Translate Thai text to English for AI processing
        const translatedText = await translateToEnglish(gratitudeText);
        
        const { data: enhanceData, error: enhanceError } = await supabase.functions.invoke('enhance-drawing', {
          body: {
            imageData: dataURL,
            prompt: '',
            userDescription: translatedText,
            drawingId: data.id,
          },
        });

        if (enhanceError) throw enhanceError;
        toast.success(t('gratitudeDrawingEnhanced'));
      } catch (enhanceError) {
        console.error('Error enhancing drawing:', enhanceError);
      } finally {
        setEnhancing(false);
      }

      // Clear the stored text and navigate back
      localStorage.removeItem('gratitude_text');
      navigate('/');

    } catch (error) {
      console.error('Error saving drawing:', error);
      toast.error(t('failedToSaveDrawing'));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-primary">{t('gratitudeArtJournal')}</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => navigate('/text-entry')} className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
              <LanguageSwitcher />
              <span className="text-sm text-muted-foreground hidden sm:block">
                {t('welcome')}, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full sm:w-auto">
                <LogOut className="h-4 w-4 mr-2" />
                {t('signOut')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-hidden">
        {/* Gratitude Prompt Display */}
        <Card className="mb-6 bg-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-primary">{t('drawYourGratitude')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-lg font-medium text-foreground italic">
              "{gratitudeText}"
            </p>
          </CardContent>
        </Card>

        {/* Drawing Canvas */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-primary">{t('expressYourGratitudeThrough')}</CardTitle>
          </CardHeader>
          <CardContent className={`space-y-4 p-3 sm:p-6 ${activeTool === 'draw' || activeTool === 'erase' ? 'drawing-mode' : ''}`}>
            {/* Desktop toolbar or mobile canvas */}
            {!isMobile && (
              <>
                <MobileToolbar
                  activeTool={activeTool}
                  activeColor={activeColor}
                  colors={colors}
                  onToolClick={handleToolClick}
                  onColorChange={setActiveColor}
                  onClear={handleClear}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                />
                <div className="my-4" />
              </>
            )}

            <MobileCanvas
              ref={canvasRef}
              activeTool={activeTool}
              activeColor={activeColor}
              onToolChange={setActiveTool}
            />

            <div className={`flex justify-center pt-4 ${isMobile ? 'pb-24' : ''}`}>
              <Button 
                onClick={handleSave} 
                disabled={saving || enhancing} 
                size={isMobile ? "lg" : "default"}
                className="bg-primary hover:bg-primary/90 min-h-[48px] px-6"
              >
                {saving || enhancing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? t('saving') : enhancing ? t('enhancing') : t('saveAndEnhanceEntry')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile toolbar */}
        {isMobile && (
          <MobileToolbar
            activeTool={activeTool}
            activeColor={activeColor}
            colors={colors}
            onToolClick={handleToolClick}
            onColorChange={setActiveColor}
            onClear={handleClear}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        )}
      </main>
    </div>
  );
};

export default Drawing;