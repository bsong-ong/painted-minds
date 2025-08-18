import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, Trash2, Download, Sparkles, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Drawing {
  id: string;
  title: string;
  image_url: string;
  storage_path: string;
  created_at: string;
  enhanced_image_url?: string;
  enhanced_storage_path?: string;
  enhancement_prompt?: string;
  flux_prompt?: string;
  is_enhanced: boolean;
}

interface DrawingGalleryProps {
  refreshTrigger: number;
}

const DrawingGallery: React.FC<DrawingGalleryProps> = ({ refreshTrigger }) => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showEnhanced, setShowEnhanced] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();

  const fetchDrawings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_gratitude_entry', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      setDrawings(data || []);
    } catch (error) {
      console.error('Error fetching drawings:', error);
      toast.error('Failed to load drawings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, [user, refreshTrigger]);

  const handleDelete = async (drawing: Drawing) => {
    if (!user) return;

    setDeleting(drawing.id);

    try {
      // Delete from storage (both original and enhanced if exists)
      const pathsToDelete = [drawing.storage_path];
      if (drawing.enhanced_storage_path) {
        pathsToDelete.push(drawing.enhanced_storage_path);
      }
      
      const { error: storageError } = await supabase.storage
        .from('drawings')
        .remove(pathsToDelete);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('drawings')
        .delete()
        .eq('id', drawing.id);

      if (dbError) throw dbError;

      setDrawings(drawings.filter(d => d.id !== drawing.id));
      toast.success('Drawing deleted successfully');
    } catch (error) {
      console.error('Error deleting drawing:', error);
      toast.error('Failed to delete drawing');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (drawing: Drawing, isEnhanced = false) => {
    const link = document.createElement('a');
    const imageUrl = isEnhanced && drawing.enhanced_image_url ? drawing.enhanced_image_url : drawing.image_url;
    const fileName = isEnhanced ? `${drawing.title}_enhanced.png` : `${drawing.title}.png`;
    
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleView = (drawingId: string) => {
    setShowEnhanced(prev => ({
      ...prev,
      [drawingId]: !prev[drawingId]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading your drawings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          My Drawings ({drawings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {drawings.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No drawings yet</h3>
            <p className="text-muted-foreground">
              Create your first drawing using the canvas above!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drawings.map((drawing) => {
              const isShowingEnhanced = showEnhanced[drawing.id] && drawing.enhanced_image_url;
              const currentImageUrl = isShowingEnhanced ? drawing.enhanced_image_url! : drawing.image_url;
              
              return (
                <div key={drawing.id} className="group">
                  <Card className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={currentImageUrl}
                        alt={drawing.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          {drawing.enhanced_image_url && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => toggleView(drawing.id)}
                              className="bg-purple-100 hover:bg-purple-200 text-purple-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownload(drawing, !!isShowingEnhanced)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(drawing)}
                            disabled={deleting === drawing.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Enhanced indicator */}
                      {drawing.enhanced_image_url && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Enhanced
                          </Badge>
                        </div>
                      )}
                      
                      {/* View toggle indicator */}
                      {drawing.enhanced_image_url && (
                        <div className="absolute bottom-2 left-2">
                          <Badge variant={isShowingEnhanced ? "default" : "secondary"} className="text-xs">
                            {isShowingEnhanced ? "Enhanced" : "Original"}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium truncate mb-2">{drawing.title}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {new Date(drawing.created_at).toLocaleDateString()}
                        </Badge>
                        {drawing.enhanced_image_url && isShowingEnhanced && drawing.enhancement_prompt && (
                          <Badge variant="outline" className="text-xs max-w-[120px] truncate">
                            {drawing.enhancement_prompt}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Debug: Show Flux Dev prompt */}
                      {drawing.flux_prompt && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <div className="font-medium text-muted-foreground mb-1">Full Flux Dev Prompt:</div>
                          <div className="text-muted-foreground break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {drawing.flux_prompt}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DrawingGallery;