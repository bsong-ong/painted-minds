import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Share2, Globe, Lock } from "lucide-react";

interface ShareDrawingDialogProps {
  drawingId: string;
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  children?: React.ReactNode;
}

const ShareDrawingDialog = ({ drawingId, isPublic, onToggle, children }: ShareDrawingDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggleShare = async (newIsPublic: boolean) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('drawings')
        .update({ is_public: newIsPublic })
        .eq('id', drawingId);

      if (error) throw error;

      onToggle(newIsPublic);
      
      toast({
        title: newIsPublic ? "Drawing Shared!" : "Drawing Made Private",
        description: newIsPublic 
          ? "Your gratitude art is now visible in the public gallery" 
          : "Your drawing is now private",
      });
    } catch (error) {
      console.error('Error updating sharing status:', error);
      toast({
        title: "Error",
        description: "Failed to update sharing status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Gratitude Art
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-gray-500" />
              )}
              <div>
                <Label className="text-sm font-medium">
                  {isPublic ? "Public" : "Private"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic 
                    ? "Anyone can see your drawing in the public gallery"
                    : "Only you can see this drawing"
                  }
                </p>
              </div>
            </div>
            
            <Switch
              checked={isPublic}
              onCheckedChange={handleToggleShare}
              disabled={loading}
            />
          </div>
          
          {isPublic && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Your art is now public!
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Others can view and star your gratitude art in the public gallery. 
                Sharing your creativity helps inspire the community!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDrawingDialog;