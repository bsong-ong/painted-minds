import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Star, Target, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

// Import puppy images
import puppyNeutral from '@/assets/puppy-neutral.png';
import puppyHappy from '@/assets/puppy-happy.png';
import puppyJoyful from '@/assets/puppy-joyful.png';
import puppyExcited from '@/assets/puppy-excited.png';
import puppyCelebration from '@/assets/puppy-celebration.png';

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_entry_date: string;
}

interface UserPoints {
  total: number;
  level: number;
  next_level_points: number;
}

const RewardsPanel = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRewardsData();
    }
  }, [user]);

  const validateAndUpdateStreak = async (streakData: UserStreak) => {
    if (!streakData.last_entry_date) return streakData;

    const today = new Date();
    const lastEntry = new Date(streakData.last_entry_date);
    const daysDifference = Math.floor((today.getTime() - lastEntry.getTime()) / (1000 * 60 * 60 * 24));

    // If more than 1 day has passed since last entry, reset current streak
    if (daysDifference > 1) {
      const updatedStreakData = {
        ...streakData,
        current_streak: 0
      };

      // Update in database
      await supabase
        .from('user_streaks')
        .update({ current_streak: 0 })
        .eq('user_id', user?.id);

      return updatedStreakData;
    }

    return streakData;
  };

  const fetchRewardsData = async () => {
    try {
      setLoading(true);

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (streakData) {
        // Validate and potentially reset streak if user hasn't journaled
        const validatedStreak = await validateAndUpdateStreak(streakData);
        setStreak(validatedStreak);
      }

      // Fetch points data
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (pointsData) {
        setPoints(pointsData);
      }

      // Fetch total gratitude entries
      const { count } = await supabase
        .from('drawings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_gratitude_entry', true);

      setTotalEntries(count || 0);

    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakLevel = (streakCount: number) => {
    if (streakCount >= 30) return { name: t('gratitudeMaster'), color: 'bg-purple-500' };
    if (streakCount >= 14) return { name: t('mindfulSoul'), color: 'bg-blue-500' };
    if (streakCount >= 7) return { name: t('thankfulHeart'), color: 'bg-green-500' };
    if (streakCount >= 3) return { name: t('gratefulBeginner'), color: 'bg-yellow-500' };
    return { name: t('startingJourney'), color: 'bg-gray-500' };
  };

  const getEntryMilestone = (count: number) => {
    if (count >= 100) return { name: t('centuryCreator'), icon: Star };
    if (count >= 50) return { name: t('dedicatedArtist'), icon: Trophy };
    if (count >= 25) return { name: t('consistentCreator'), icon: Target };
    if (count >= 10) return { name: t('growingArtist'), icon: Flame };
    return { name: t('newArtist'), icon: Flame };
  };

  const getPuppyImage = (streakCount: number) => {
    if (streakCount >= 30) return puppyCelebration; // Master level - celebration puppy
    if (streakCount >= 14) return puppyExcited;     // 2+ weeks - excited puppy
    if (streakCount >= 7) return puppyJoyful;       // 1 week - joyful puppy
    if (streakCount >= 3) return puppyHappy;        // Getting started - happy puppy
    return puppyNeutral;                            // Just starting - neutral puppy
  };

  const getPuppyMessage = (streakCount: number) => {
    if (streakCount >= 30) return t('Your gratitude buddy is absolutely thrilled! You\'re a true gratitude master!');
    if (streakCount >= 14) return t('Your gratitude buddy is jumping with excitement! Amazing consistency!');
    if (streakCount >= 7) return t('Your gratitude buddy is so happy! You\'re building a wonderful habit!');
    if (streakCount >= 3) return t('Your gratitude buddy is getting happier! Keep it up!');
    if (streakCount >= 1) return t('Your gratitude buddy is excited to start this journey with you!');
    return t('Meet your gratitude buddy! They\'ll get happier as you build your practice!');
  };

  const getNextBuddyState = (streakCount: number) => {
    if (streakCount >= 30) return null; // Already at max level
    if (streakCount >= 14) return { target: 30, state: 'absolutely thrilled (celebration mode)' };
    if (streakCount >= 7) return { target: 14, state: 'jumping with excitement' };
    if (streakCount >= 3) return { target: 7, state: 'joyful and happy' };
    if (streakCount >= 1) return { target: 3, state: 'getting happier' };
    return { target: 1, state: 'excited to start' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const streakLevel = getStreakLevel(currentStreak);
  const entryMilestone = getEntryMilestone(totalEntries);
  const MilestoneIcon = entryMilestone.icon;
  const puppyImage = getPuppyImage(currentStreak);
  const puppyMessage = getPuppyMessage(currentStreak);
  const nextBuddyState = getNextBuddyState(currentStreak);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {t('yourGratitudeJourney')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gratitude Buddy */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 p-2">
            <img
              src={puppyImage}
              alt="Your gratitude buddy"
              className="w-full h-full object-cover rounded-full animate-scale-in"
            />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {puppyMessage}
          </p>
          
          {/* Buddy State Info */}
          {nextBuddyState && (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-3 max-w-xs mx-auto">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-foreground">
                  <span className="font-medium">{t('nextBuddyState')}</span>
                  <br />
                  {t('buddyWillBe')} {t('whenYouReach')} {nextBuddyState.target}{t('dayStreak')}
                  <br />
                  <span className="text-primary font-medium">
                    {nextBuddyState.target - currentStreak} {t('moreDaysToGo')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Current Streak */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('currentStreak')}</span>
            <Badge className={`${streakLevel.color} text-white`}>
              {streakLevel.name}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{currentStreak}</span>
            <span className="text-muted-foreground">{t('days')}</span>
          </div>
          {longestStreak > currentStreak && (
            <p className="text-xs text-muted-foreground">
              {t('personalBest')}: {longestStreak} {t('days')}
            </p>
          )}
        </div>

        {/* Total Entries */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('gratitudeEntries')}</span>
            <Badge variant="outline">
              {entryMilestone.name}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <MilestoneIcon className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{totalEntries}</span>
            <span className="text-muted-foreground">{t('entries')}</span>
          </div>
        </div>

        {/* Progress to next milestone */}
        <div className="space-y-2">
          <span className="text-sm font-medium">{t('nextMilestone')}</span>
          {(() => {
            let nextTarget = 0;
            let nextName = '';
            
            if (totalEntries < 10) {
              nextTarget = 10;
              nextName = t('growingArtist');
            } else if (totalEntries < 25) {
              nextTarget = 25;
              nextName = t('consistentCreator');
            } else if (totalEntries < 50) {
              nextTarget = 50;
              nextName = t('dedicatedArtist');
            } else if (totalEntries < 100) {
              nextTarget = 100;
              nextName = t('centuryCreator');
            } else {
              return (
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700">
                    {t('highestMilestone')}
                  </p>
                </div>
              );
            }

            const progress = (totalEntries / nextTarget) * 100;

            return (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{totalEntries}</span>
                  <span className="text-muted-foreground">{nextName}</span>
                  <span>{nextTarget}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {nextTarget - totalEntries} {t('moreEntriesToGo')}
                </p>
              </div>
            );
          })()}
        </div>

      </CardContent>
    </Card>
  );
};

export default RewardsPanel;