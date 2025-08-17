import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Drawing {
  id: string;
  title: string;
  image_url: string;
  storage_path: string;
  created_at: string;
}

interface DrawingGalleryProps {
  refreshTrigger: number;
}

const DrawingGallery: React.FC<DrawingGalleryProps> = ({ refreshTrigger }) => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDrawings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('drawings')
        .remove([drawing.storage_path]);

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

  const handleDownload = (drawing: Drawing) => {
    const link = document.createElement('a');
    link.href = drawing.image_url;
    link.download = `${drawing.title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            {drawings.map((drawing) => (
              <div key={drawing.id} className="group">
                <Card className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={drawing.image_url}
                      alt={drawing.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(drawing)}
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
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate mb-2">{drawing.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(drawing.created_at).toLocaleDateString()}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DrawingGallery;