import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Star, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRewardsData();
    }
  }, [user]);

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
        setStreak(streakData);
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
    if (streakCount >= 30) return { name: 'Gratitude Master', color: 'bg-purple-500' };
    if (streakCount >= 14) return { name: 'Mindful Soul', color: 'bg-blue-500' };
    if (streakCount >= 7) return { name: 'Thankful Heart', color: 'bg-green-500' };
    if (streakCount >= 3) return { name: 'Grateful Beginner', color: 'bg-yellow-500' };
    return { name: 'Starting Journey', color: 'bg-gray-500' };
  };

  const getEntryMilestone = (count: number) => {
    if (count >= 100) return { name: 'Century Creator', icon: Star };
    if (count >= 50) return { name: 'Dedicated Artist', icon: Trophy };
    if (count >= 25) return { name: 'Consistent Creator', icon: Target };
    if (count >= 10) return { name: 'Growing Artist', icon: Flame };
    return { name: 'New Artist', icon: Flame };
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Your Gratitude Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Streak */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Streak</span>
            <Badge className={`${streakLevel.color} text-white`}>
              {streakLevel.name}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{currentStreak}</span>
            <span className="text-muted-foreground">days</span>
          </div>
          {longestStreak > currentStreak && (
            <p className="text-xs text-muted-foreground">
              Personal best: {longestStreak} days
            </p>
          )}
        </div>

        {/* Total Entries */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Gratitude Entries</span>
            <Badge variant="outline">
              {entryMilestone.name}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <MilestoneIcon className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{totalEntries}</span>
            <span className="text-muted-foreground">entries</span>
          </div>
        </div>

        {/* Progress to next milestone */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Next Milestone</span>
          {(() => {
            let nextTarget = 0;
            let nextName = '';
            
            if (totalEntries < 10) {
              nextTarget = 10;
              nextName = 'Growing Artist';
            } else if (totalEntries < 25) {
              nextTarget = 25;
              nextName = 'Consistent Creator';
            } else if (totalEntries < 50) {
              nextTarget = 50;
              nextName = 'Dedicated Artist';
            } else if (totalEntries < 100) {
              nextTarget = 100;
              nextName = 'Century Creator';
            } else {
              return (
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700">
                    🎉 You've reached the highest milestone!
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
                  {nextTarget - totalEntries} more entries to go!
                </p>
              </div>
            );
          })()}
        </div>

        {/* Motivation */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg">
          <p className="text-sm text-center text-muted-foreground">
            {currentStreak === 0 
              ? "Start your gratitude journey today! 🌱"
              : currentStreak === 1
              ? "Great start! Keep the momentum going! 💪"
              : currentStreak < 7
              ? "You're building a beautiful habit! ✨"
              : currentStreak < 30
              ? "Amazing consistency! You're inspiring! 🌟"
              : "You're a true gratitude master! 🏆"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardsPanel;