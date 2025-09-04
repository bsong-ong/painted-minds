import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Share2, Globe, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminSettings } from "@/hooks/useAdminSettings";

interface ShareDrawingDialogProps {
  drawingId: string;
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  children?: React.ReactNode;
}

const ShareDrawingDialog = ({ drawingId, isPublic, onToggle, children }: ShareDrawingDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { settings } = useAdminSettings();

  // Don't render if art sharing is disabled
  if (!settings.art_sharing_enabled) {
    return null;
  }

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
        title: newIsPublic ? t('drawingShared') : t('drawingMadePrivate'),
        description: newIsPublic 
          ? t('artNowVisibleInGallery')
          : t('drawingNowPrivate'),
      });
    } catch (error) {
      console.error('Error updating sharing status:', error);
      toast({
        title: t('error'),
        description: t('failedToUpdateSharingStatus'),
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
            {t('share')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('shareYourGratitudeArt')}
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
                  {isPublic ? t('public') : t('private')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic 
                    ? t('anyoneCanSeeYourDrawing')
                    : t('onlyYouCanSeeThis')
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
                {t('yourArtIsNowPublic')}
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('othersCanViewAndStar')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDrawingDialog;