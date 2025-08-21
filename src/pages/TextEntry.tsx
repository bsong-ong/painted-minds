import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, RefreshCw, Lightbulb, LogOut, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TextEntry = () => {
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiHints, setAiHints] = useState<string[]>([]);
  const [loadingHints, setLoadingHints] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const generateAIHints = async () => {
    try {
      setLoadingHints(true);
      
      // Get recent drawings for context
      const { data: recentDrawings } = await supabase
        .from('drawings')
        .select('gratitude_prompt, user_description')
        .eq('user_id', user?.id)
        .eq('is_gratitude_entry', true)
        .order('created_at', { ascending: false })
        .limit(5);

      const recentEntries = recentDrawings?.map(d => 
        d.gratitude_prompt || d.user_description
      ).filter(Boolean) || [];

      const { data, error } = await supabase.functions.invoke('generate-gratitude-hints', {
        body: { 
          mood: null,
          recentEntries 
        }
      });

      if (error) throw error;
      setAiHints(data.prompts || []);
      toast.success(t('aiHintsGenerated'));
    } catch (error) {
      console.error('Error generating AI hints:', error);
      toast.error(t('failedToGenerateHints'));
    } finally {
      setLoadingHints(false);
    }
  };

  const handleNext = () => {
    if (!customPrompt.trim()) {
      toast.error(t('pleaseEnterText'));
      return;
    }
    
    // Store the gratitude text in localStorage to pass to drawing page
    localStorage.setItem('gratitude_text', customPrompt);
    navigate('/drawing');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/onboarding')}>
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">{t('gratitudeArtJournal')}</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center justify-center text-primary">
              <Lightbulb className="h-6 w-6 text-primary" />
              {t('whatAreYouGratefulFor')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateAIHints}
                disabled={loadingHints}
              >
                {loadingHints ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {t('getRandomPrompt')}
              </Button>
            </div>

            {aiHints.length > 0 && (
              <div className="space-y-3">
                <Label>{t('aiSuggestions')}</Label>
                <div className="flex flex-wrap gap-2">
                  {aiHints.slice(0, 3).map((hint, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        const currentText = customPrompt.trim();
                        const newText = currentText ? `${currentText} ${hint}` : hint;
                        setCustomPrompt(newText);
                      }}
                    >
                      {hint}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="custom-prompt">{t('writeAboutWhatMakes')}</Label>
              <Input
                id="custom-prompt"
                placeholder={t('writeAboutWhatMakes')}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="text-base py-3"
              />
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleNext} 
                size="lg"
                disabled={!customPrompt.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                {t('continueToDrawing')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TextEntry;