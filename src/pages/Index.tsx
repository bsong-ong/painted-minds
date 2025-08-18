import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Heart, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GratitudeCanvas from '@/components/GratitudeCanvas';
import DrawingGallery from '@/components/DrawingGallery';
import RewardsPanel from '@/components/RewardsPanel';

const Index = () => {
  const { user, signOut, loading } = useAuth();
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Gratitude Art Journal</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => navigate('/journal')} className="w-full sm:w-auto">
                <BookOpen className="h-4 w-4 mr-2" />
                View Journal
              </Button>
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full sm:w-auto">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-hidden">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-8 w-full">
          <div className="lg:col-span-3 w-full min-w-0">
            <Card className="h-fit w-full">
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Express Your Gratitude</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                <GratitudeCanvas onSaveSuccess={handleSaveSuccess} />
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
