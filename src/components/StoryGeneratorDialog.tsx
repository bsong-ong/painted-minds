import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface Drawing {
  id: string;
  title: string;
  image_url: string;
  enhanced_image_url?: string;
}

interface StoryGeneratorDialogProps {
  drawings: Drawing[];
  children: React.ReactNode;
}

const StoryGeneratorDialog = ({ drawings, children }: StoryGeneratorDialogProps) => {
  const [selectedDrawings, setSelectedDrawings] = useState<Drawing[]>([]);
  const [generatedStory, setGeneratedStory] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [open, setOpen] = useState(false);
  const { t, language } = useLanguage();

  const handleSelectDrawing = (drawing: Drawing) => {
    if (selectedDrawings.find(d => d.id === drawing.id)) {
      setSelectedDrawings(prev => prev.filter(d => d.id !== drawing.id));
    } else if (selectedDrawings.length < 3) {
      setSelectedDrawings(prev => [...prev, drawing]);
    } else {
      toast.error(t('youCanOnlySelect3Images'));
    }
  };

  const handleGenerateStory = async () => {
    if (selectedDrawings.length !== 3) {
      toast.error(t('pleaseSelectExactly3Images'));
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrls = selectedDrawings.map(d => d.enhanced_image_url || d.image_url);
      const titles = selectedDrawings.map(d => d.title);

      const { data, error } = await supabase.functions.invoke('generate-story', {
        body: { 
          imageUrls, 
          titles, 
          language: language === 'th' ? 'thai' : 'english'
        }
      });

      if (error) throw error;

      setGeneratedStory(data.story);
      toast.success(t('storyGeneratedSuccessfully'));
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error(t('failedToGenerateStory'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadStory = () => {
    if (!generatedStory) return;

    const content = `# My Gratitude Story\n\n${generatedStory}\n\n---\nGenerated from my gratitude art collection`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-gratitude-story.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSelectedDrawings([]);
    setGeneratedStory('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('createYourGratitudeStory')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!generatedStory ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('selectExactly3Images')}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium">{t('selected')}: {selectedDrawings.length}/3</span>
                  {selectedDrawings.length === 3 && (
                    <Badge variant="secondary">{t('readyToGenerate')}</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {drawings.map((drawing) => {
                  const isSelected = selectedDrawings.find(d => d.id === drawing.id);
                  return (
                    <Card 
                      key={drawing.id} 
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectDrawing(drawing)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-square rounded-lg overflow-hidden mb-2">
                          <img 
                            src={drawing.enhanced_image_url || drawing.image_url} 
                            alt={drawing.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-medium truncate">{drawing.title}</p>
                        {isSelected && (
                          <Badge variant="default" className="mt-1 text-xs">
                            {t('selected')} #{selectedDrawings.findIndex(d => d.id === drawing.id) + 1}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleGenerateStory}
                  disabled={selectedDrawings.length !== 3 || isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('generatingStory')}
                    </>
                  ) : (
                    t('generateStory')
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  {t('reset')}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('yourGratitudeStory')}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadStory}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('download')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    {t('createNewStory')}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {selectedDrawings.map((drawing, index) => (
                  <div key={drawing.id} className="text-center">
                    <div className="aspect-square rounded-lg overflow-hidden mb-2">
                      <img 
                        src={drawing.enhanced_image_url || drawing.image_url} 
                        alt={drawing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {t('illustration')} {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="bg-muted/30 rounded-lg p-6 whitespace-pre-wrap">
                  {generatedStory}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryGeneratorDialog;