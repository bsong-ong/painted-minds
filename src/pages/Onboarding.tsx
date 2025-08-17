import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Sparkles, Trophy, Palette } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/');
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Heart className="h-12 w-12 text-primary mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Gratitude Art Journal
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your daily gratitude practice into beautiful visual memories with AI-enhanced artwork
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Daily Gratitude</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Draw what you're grateful for each day to build a positive mindset and mindfulness habit
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Palette className="h-8 w-8 text-secondary mx-auto mb-2" />
                <CardTitle className="text-lg">Creative Expression</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Express your gratitude through simple drawings - no artistic skills required, just authentic feelings
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Sparkles className="h-8 w-8 text-accent mx-auto mb-2" />
                <CardTitle className="text-lg">AI Enhancement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Transform your sketches into beautiful artwork with AI enhancement that preserves your original intent
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Trophy className="h-8 w-8 text-warning mx-auto mb-2" />
                <CardTitle className="text-lg">Build Consistency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Earn rewards and track streaks to maintain your gratitude practice and see your growth over time
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Choose Your Gratitude</h3>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered suggestions or pick your own inspiration for what to draw
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-secondary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Draw & Describe</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a simple sketch and add a personal description of your gratitude
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-accent">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Enhance & Reflect</h3>
                  <p className="text-sm text-muted-foreground">
                    Watch your sketch transform into beautiful art and reflect on your gratitude journey
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <Button onClick={handleGetStarted} size="lg" className="px-8">
              Start Your Gratitude Journey
            </Button>
            <div>
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                Skip and continue to app
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;