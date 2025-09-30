import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Heart, BookOpen, PenTool, Globe, Settings, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { getRedirectPath } from '@/utils/userRedirect';
import DrawingGallery from '@/components/DrawingGallery';
import RewardsPanel from '@/components/RewardsPanel';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { FeatureGate } from '@/components/FeatureGate';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const { isAdmin } = useIsAdmin();
  const { permissions } = useUserPermissions();
  const { settings } = useAdminSettings();
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
      return;
    }

    // Redirect users based on their permissions if they don't have access to gratitude journaling
    if (!loading && user && permissions && !isAdmin && !permissions.gratitude_journaling_enabled) {
      const redirectPath = getRedirectPath(permissions, isAdmin);
      if (redirectPath !== '/') {
        navigate(redirectPath);
      }
    }
  }, [user, loading, navigate, permissions, isAdmin]);

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
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/onboarding')}>
              <img src="/lovable-uploads/01795ac7-0239-4692-8c4d-ef3130b2f3eb.png" alt="Painted Smiles" className="h-8 w-auto" />
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-gratitude-warm bg-clip-text text-transparent hover:opacity-80 transition-opacity">{t('gratitudeArtJournal')}</h1>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="flex-shrink-0">
                  <Settings className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Admin</span>
                  <span className="ml-2 sm:hidden">Admin</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate('/journal')} className="flex-shrink-0">
                <BookOpen className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">{t('viewJournal')}</span>
                <span className="ml-2 sm:hidden">Journal</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/gallery')} className="flex-shrink-0">
                <Globe className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">{t('publicGallery')}</span>
                <span className="ml-2 sm:hidden">Gallery</span>
              </Button>
              {settings.cbt_assistant_visible && (
                <Button variant="outline" size="sm" onClick={() => navigate('/cbt-assistant')} className="flex-shrink-0">
                  <Brain className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">{t('thoughtBuddy')}</span>
                  <span className="ml-2 sm:hidden">CBT</span>
                </Button>
              )}
              {settings.talk_buddy_visible && (
                <Button variant="outline" size="sm" onClick={() => navigate('/talk-buddy')} className="flex-shrink-0">
                  <Heart className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">{t('talkBuddy')}</span>
                  <span className="ml-2 sm:hidden">Talk</span>
                </Button>
              )}
              {settings.language_switcher_enabled && <LanguageSwitcher />}
              <Button variant="outline" size="sm" onClick={handleSignOut} className="flex-shrink-0">
                <LogOut className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">{t('signOut')}</span>
                <span className="ml-2 sm:hidden">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-hidden">
        {settings.gratitude_drawing_visible && (
          <FeatureGate feature="gratitude_journaling">
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
            </div>
            
            <div className="lg:col-span-1 w-full min-w-0">
              <RewardsPanel />
              </div>
            </div>
          </FeatureGate>
        )}
      </main>
    </div>
  );
};

export default Index;
