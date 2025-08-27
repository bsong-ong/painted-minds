import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, StarOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Drawing {
  id: string;
  title: string;
  image_url: string;
  enhanced_image_url?: string;
  star_count: number;
  created_at: string;
  user_starred?: boolean;
  profiles?: {
    display_name?: string;
  };
}

const Gallery = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [starring, setStarring] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicDrawings();
  }, [user]);

  const fetchPublicDrawings = async () => {
    try {
      setLoading(true);
      
      // Fetch public drawings with star counts and user star status
      const { data: publicDrawings, error: drawingsError } = await supabase
        .from('drawings')
        .select(`
          id,
          title,
          image_url,
          enhanced_image_url,
          star_count,
          created_at,
          user_id
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (drawingsError) {
        console.error('Error fetching public drawings:', drawingsError);
        return;
      }

      if (!publicDrawings) {
        setDrawings([]);
        return;
      }

      // Fetch profiles for the drawings
      const userIds = [...new Set(publicDrawings.map(d => d.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // If user is logged in, check which drawings they've starred
      if (user) {
        const { data: userStars, error: starsError } = await supabase
          .from('drawing_stars')
          .select('drawing_id')
          .eq('user_id', user.id);

        if (starsError) {
          console.error('Error fetching user stars:', starsError);
        }

        const starredDrawingIds = new Set(userStars?.map(star => star.drawing_id) || []);
        
        const drawingsWithStarStatus = publicDrawings.map(drawing => ({
          ...drawing,
          user_starred: starredDrawingIds.has(drawing.id),
          profiles: profilesMap.get(drawing.user_id)
        }));

        setDrawings(drawingsWithStarStatus);
      } else {
        const drawingsWithProfiles = publicDrawings.map(drawing => ({
          ...drawing,
          profiles: profilesMap.get(drawing.user_id)
        }));
        setDrawings(drawingsWithProfiles);
      }
    } catch (error) {
      console.error('Error in fetchPublicDrawings:', error);
      toast({
        title: t('error'),
        description: t('failedToLoadPublicDrawings'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStar = async (drawingId: string, isCurrentlyStarred: boolean) => {
    if (!user) {
      toast({
        title: t('authenticationRequired'),
        description: t('pleaseSignInToStar'),
        variant: "destructive",
      });
      return;
    }

    setStarring(drawingId);
    
    try {
      if (isCurrentlyStarred) {
        // Remove star
        const { error } = await supabase
          .from('drawing_stars')
          .delete()
          .eq('user_id', user.id)
          .eq('drawing_id', drawingId);

        if (error) throw error;
      } else {
        // Add star
        const { error } = await supabase
          .from('drawing_stars')
          .insert({
            user_id: user.id,
            drawing_id: drawingId
          });

        if (error) throw error;
      }

      // Update local state
      setDrawings(prev => prev.map(drawing => 
        drawing.id === drawingId 
          ? { 
              ...drawing, 
              user_starred: !isCurrentlyStarred,
              star_count: isCurrentlyStarred ? drawing.star_count - 1 : drawing.star_count + 1
            }
          : drawing
      ));

    } catch (error) {
      console.error('Error starring drawing:', error);
      toast({
        title: t('error'),
        description: t('failedToUpdateStar'),
        variant: "destructive",
      });
    } finally {
      setStarring(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loadingPublicGallery')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('back')}
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-gratitude-warm bg-clip-text text-transparent">
              {t('publicGallery')}
            </h1>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Gallery Grid */}
        {drawings.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noPublicDrawingsYet')}</h3>
            <p className="text-muted-foreground">
              {t('beTheFirstToShare')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {drawings.map((drawing) => (
              <Card key={drawing.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <img
                      src={drawing.enhanced_image_url || drawing.image_url}
                      alt={drawing.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Star button overlay */}
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant={drawing.user_starred ? "default" : "secondary"}
                        onClick={() => handleStar(drawing.id, drawing.user_starred || false)}
                        disabled={starring === drawing.id || !user}
                        className="h-8 w-8 p-0 rounded-full"
                      >
                        {drawing.user_starred ? (
                          <Star className="h-4 w-4 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Enhanced badge */}
                    {drawing.enhanced_image_url && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 left-2 text-xs"
                      >
                        {t('aiEnhanced')}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                      {drawing.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {t('by')} {drawing.profiles?.display_name || t('anonymous')}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                        <span>{drawing.star_count}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(drawing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;