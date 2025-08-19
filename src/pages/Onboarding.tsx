import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Sparkles, Trophy, Palette } from 'lucide-react';
import paintedSmilesHeroImage from '@/assets/painted-smiles-hero.jpg';

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative mb-8">
                <img 
                  src={paintedSmilesHeroImage} 
                  alt="Painted Smiles - Creative happiness and artistic expression" 
                  className="w-full max-w-2xl h-64 sm:h-80 object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl" />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
                  <Heart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-amber-300" />
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold">
                    Painted Smiles
                  </h1>
                </div>
              </div>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Capture happiness through art and creativity. Express your emotions, memories, and joyful moments 
                through simple drawings and watch them transform into beautiful, smile-inducing artwork.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <Heart className="h-10 w-10 text-orange-600 dark:text-orange-400 mx-auto mb-3" />
                <CardTitle className="text-lg text-orange-900 dark:text-orange-100">Daily Gratitude</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Draw what you're grateful for each day to build a positive mindset and mindfulness habit
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800">
              <CardHeader>
                <Palette className="h-10 w-10 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
                <CardTitle className="text-lg text-rose-900 dark:text-rose-100">Creative Expression</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  Express your gratitude through simple drawings - no artistic skills required, just authentic feelings
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <Sparkles className="h-10 w-10 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                <CardTitle className="text-lg text-amber-900 dark:text-amber-100">AI Enhancement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Transform your sketches into beautiful artwork with AI enhancement that preserves your original intent
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">Build Consistency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Earn rewards and track streaks to maintain your gratitude practice and see your growth over time
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-12 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-violet-900 dark:text-violet-100">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-xl font-bold text-white">1</span>
                  </div>
                  <h3 className="font-semibold mb-3 text-violet-900 dark:text-violet-100">Choose Your Gratitude</h3>
                  <p className="text-sm text-violet-700 dark:text-violet-300">
                    Get AI-powered suggestions or pick your own inspiration for what to draw
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-xl font-bold text-white">2</span>
                  </div>
                  <h3 className="font-semibold mb-3 text-violet-900 dark:text-violet-100">Draw Your Feeling</h3>
                  <p className="text-sm text-violet-700 dark:text-violet-300">
                    Create a simple sketch expressing your gratitude - no artistic experience needed
                  </p>
                </div>
                <div className="text-center sm:col-span-2 lg:col-span-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-xl font-bold text-white">3</span>
                  </div>
                  <h3 className="font-semibold mb-3 text-violet-900 dark:text-violet-100">Enhance & Reflect</h3>
                  <p className="text-sm text-violet-700 dark:text-violet-300">
                    Watch your sketch transform into beautiful art and reflect on your gratitude journey
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-6">
              <Button 
                onClick={handleGetStarted} 
                size="lg" 
                className="px-12 py-6 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Start Painting Smiles
              </Button>
            <div>
              <Button 
                variant="ghost" 
                onClick={handleSkip} 
                className="text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
              >
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