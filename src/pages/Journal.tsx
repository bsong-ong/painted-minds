import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Calendar, Eye, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Drawing {
  id: string;
  title: string;
  image_url: string;
  enhanced_image_url?: string;
  user_description?: string;
  gratitude_prompt?: string;
  created_at: string;
  storage_path: string;
  enhanced_storage_path?: string;
}

const Journal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysToShow, setDaysToShow] = useState(7);
  const [showEnhanced, setShowEnhanced] = useState<{ [key: string]: boolean }>({});
  const [globalEnhancedView, setGlobalEnhancedView] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDrawings();
    }
  }, [user, daysToShow]);

  const fetchDrawings = async () => {
    try {
      setLoading(true);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToShow);

      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_gratitude_entry', true)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrawings(data || []);
    } catch (error) {
      console.error('Error fetching drawings:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (drawing: Drawing) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      // Delete from storage
      const filesToDelete = [drawing.storage_path];
      if (drawing.enhanced_storage_path) {
        filesToDelete.push(drawing.enhanced_storage_path);
      }

      for (const filePath of filesToDelete) {
        await supabase.storage.from('drawings').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('drawings')
        .delete()
        .eq('id', drawing.id);

      if (error) throw error;

      toast.success('Journal entry deleted');
      fetchDrawings();
    } catch (error) {
      console.error('Error deleting drawing:', error);
      toast.error('Failed to delete journal entry');
    }
  };

  const handleDownload = async (drawing: Drawing, useEnhanced = false) => {
    try {
      const imageUrl = useEnhanced && drawing.enhanced_image_url 
        ? drawing.enhanced_image_url 
        : drawing.image_url;
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${drawing.title}-${useEnhanced ? 'enhanced' : 'original'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const toggleView = (drawingId: string) => {
    setShowEnhanced(prev => ({
      ...prev,
      [drawingId]: !prev[drawingId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">Loading your gratitude journal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Back to Drawing</span>
              </Button>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/onboarding')}>
                <Calendar className="h-6 w-6 text-primary" />
                <h1 className="text-lg sm:text-xl font-bold hover:opacity-80 transition-opacity">Painted Smiles</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="days">Show past</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={daysToShow}
                onChange={(e) => setDaysToShow(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="global-enhanced">Show all as enhanced</Label>
              <Switch
                id="global-enhanced"
                checked={globalEnhancedView}
                onCheckedChange={setGlobalEnhancedView}
              />
            </div>
          </div>
        </div>

        {drawings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No gratitude entries found for the past {daysToShow} days.
              </p>
              <Button onClick={() => navigate('/')}>
                Create Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {drawings.map((drawing) => {
              const showEnhancedForThis = globalEnhancedView || 
                (showEnhanced[drawing.id] !== undefined 
                  ? showEnhanced[drawing.id] 
                  : !!drawing.enhanced_image_url); // Default to enhanced if available
              const currentImageUrl = showEnhancedForThis && drawing.enhanced_image_url
                ? drawing.enhanced_image_url
                : drawing.image_url;

              return (
                <Card key={drawing.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{drawing.title}</CardTitle>
                      <div className="flex gap-1">
                        {drawing.enhanced_image_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleView(drawing.id)}
                            title={showEnhancedForThis ? 'Show original' : 'Show enhanced'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(drawing, showEnhancedForThis)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(drawing)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(drawing.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={currentImageUrl}
                          alt={drawing.title}
                          className="w-full h-full object-cover"
                        />
                        {showEnhancedForThis && drawing.enhanced_image_url && (
                          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Enhanced
                          </div>
                        )}
                      </div>
                      
                      {drawing.gratitude_prompt && (
                        <div className="text-sm">
                          <p className="font-medium text-primary mb-1">Prompt:</p>
                          <p className="text-muted-foreground italic">"{drawing.gratitude_prompt}"</p>
                        </div>
                      )}
                      
                      {drawing.user_description && (
                        <div className="text-sm">
                          <p className="font-medium mb-1">Your reflection:</p>
                          <p className="text-muted-foreground">{drawing.user_description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Journal;