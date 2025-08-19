import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Heart, BookOpen, PenTool } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DrawingGallery from '@/components/DrawingGallery';
import RewardsPanel from '@/components/RewardsPanel';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (!onboardingCompleted && user && !loading) {
      navigate('/onboarding');
    }
  }, [user, loading, navigate]);

  const handleSaveSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleStartGratitudeEntry = () => {
    navigate('/text-entry');
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-gratitude-warm bg-clip-text text-transparent hover:opacity-80 transition-opacity">{t('gratitudeArtJournal')}</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => navigate('/journal')} className="w-full sm:w-auto">
                <BookOpen className="h-4 w-4 mr-2" />
                {t('viewJournal')}
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
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-8 w-full">
          <div className="lg:col-span-3 w-full min-w-0 space-y-4">
            {/* Start Gratitude Entry Card */}
            <Card className="h-fit w-full bg-gradient-to-r from-primary/10 to-gratitude-warm/10 border-primary/20">
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-lg sm:text-xl text-center bg-gradient-to-r from-primary to-gratitude-warm bg-clip-text text-transparent">{t('startYourDailyGratitude')}</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6 text-center">
                <p className="text-muted-foreground mb-6">
                  {t('takeAMomentToReflect')}
                </p>
                <Button onClick={handleStartGratitudeEntry} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-gratitude-warm hover:from-primary/90 hover:to-gratitude-warm/90">
                  <PenTool className="h-4 w-4 mr-2" />
                  {t('startGratitudeEntry')}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Drawings */}
            <Card className="h-fit w-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-gratitude-success bg-clip-text text-transparent">{t('yourRecentGratitudeArt')}</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                <DrawingGallery refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 w-full min-w-0">
            <RewardsPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
