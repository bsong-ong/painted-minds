import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas as FabricCanvas, Circle, Rect, PencilBrush } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Pencil, Eraser, Palette, Save, RefreshCw, ArrowLeft, Heart, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Drawing = () => {
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'erase' | 'rectangle' | 'circle'>('draw');
  const [activeColor, setActiveColor] = useState('#000000');
  const [gratitudeText, setGratitudeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  const colors = [
    '#000000', // black
    '#dc2626', // red
    '#16a34a', // green
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: '#ffffff',
      enablePointerEvents: true,
      allowTouchScrolling: false,
    });

    // Initialize drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = 3;
    canvas.isDrawingMode = true;
    
    // Add debugging and path preservation
    canvas.on('path:created', (e) => {
      console.log('Path created and preserved on canvas');
      // Ensure the path stays on canvas
      const path = e.path;
      if (path) {
        path.selectable = false; // Prevent accidental selection
        canvas.add(path);
        canvas.renderAll();
      }
    });

    // Add more debugging
    canvas.on('mouse:down', () => {
      console.log('Mouse down - drawing started');
    });

    canvas.on('mouse:up', () => {
      console.log('Mouse up - drawing ended, canvas objects:', canvas.getObjects().length);
    });

    setFabricCanvas(canvas);

    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container && canvas) {
        const containerRect = container.getBoundingClientRect();
        const availableWidth = Math.max(containerRect.width - 32, 280);
        const maxSize = Math.min(availableWidth, window.innerHeight * 0.5, 600);
        
        const scale = maxSize / 600;
        const scaledSize = 600 * scale;
        
        canvas.setDimensions({
          width: scaledSize,
          height: scaledSize
        });
        canvas.setZoom(scale);
        
        if (canvasRef.current) {
          canvasRef.current.style.width = `${scaledSize}px`;
          canvasRef.current.style.height = `${scaledSize}px`;
          canvasRef.current.style.maxWidth = '100%';
        }
      }
    };

    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    console.log('Updating tool and color:', activeTool, activeColor);
    
    // Set drawing mode based on tool
    fabricCanvas.isDrawingMode = activeTool === 'draw' || activeTool === 'erase';
    
    // Update brush properties
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeTool === 'erase' ? '#ffffff' : activeColor;
      fabricCanvas.freeDrawingBrush.width = activeTool === 'erase' ? 10 : 3;
    }
    
    // Don't call renderAll() here as it can interfere with drawing
  }, [activeTool, activeColor, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    console.log('Tool clicked:', tool);
    setActiveTool(tool);
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    console.log('Clearing canvas');
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    toast.success(t('canvasCleared'));
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
    if (!fabricCanvas || !user) {
      toast.error(t('pleaseDrawSomething'));
      return;
    }

    try {
      setSaving(true);
      
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1,
      });

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

        {/* Drawing Tools */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-primary">{t('expressYourGratitudeThrough')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-3 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
              <Button
                variant={activeTool === 'draw' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('draw')}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t('pencil')}
              </Button>
              <Button
                variant={activeTool === 'erase' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('erase')}
              >
                <Eraser className="h-4 w-4 mr-2" />
                {t('eraser')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                {t('clear')}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {t('colors')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${
                      activeColor === color ? 'border-primary' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setActiveColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="border-2 border-primary/50 rounded-lg overflow-hidden bg-card w-full max-w-full shadow-xl">
              <div className="w-full overflow-hidden flex justify-center p-6 bg-gradient-to-br from-primary/5 to-accent/10">
                <canvas ref={canvasRef} className="max-w-full h-auto block rounded-lg border-4 border-primary/30 shadow-lg bg-white" />
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button onClick={handleSave} disabled={saving || enhancing} size="lg" className="bg-primary hover:bg-primary/90">
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
      </main>
    </div>
  );
};

export default Drawing;