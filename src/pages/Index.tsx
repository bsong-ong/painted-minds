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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Gratitude Art Journal</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/journal')}>
              <BookOpen className="h-4 w-4 mr-2" />
              View Journal
            </Button>
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Express Your Gratitude</CardTitle>
              </CardHeader>
              <CardContent>
                <GratitudeCanvas onSaveSuccess={handleSaveSuccess} />
              </CardContent>
            </Card>

            <DrawingGallery refreshTrigger={refreshTrigger} />
          </div>
          
          <div className="lg:col-span-1">
            <RewardsPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
