import React, { useRef, useEffect, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, PencilBrush } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Pencil, Eraser, Square, Circle as CircleIcon, Palette, Save, Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GratitudeCanvasProps {
  onSaveSuccess: () => void;
}

const GratitudeCanvas: React.FC<GratitudeCanvasProps> = ({ onSaveSuccess }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'erase' | 'rectangle' | 'circle'>('draw');
  const [activeColor, setActiveColor] = useState('#2563eb');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiHints, setAiHints] = useState<string[]>([]);
  const [loadingHints, setLoadingHints] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [savedDrawingId, setSavedDrawingId] = useState<string | null>(null);
  const { user } = useAuth();

  const colors = [
    '#2563eb', // blue
    '#dc2626', // red
    '#16a34a', // green
    '#ca8a04', // yellow
    '#9333ea', // purple
    '#ea580c', // orange
    '#0891b2', // cyan
    '#be123c', // rose
    '#374151', // gray
    '#000000', // black
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 400,
      backgroundColor: '#ffffff',
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = 3;

    setFabricCanvas(canvas);

    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container && canvas) {
        // Get the actual available width, accounting for all padding and margins
        const containerRect = container.getBoundingClientRect();
        const availableWidth = Math.max(containerRect.width - 16, 280); // Minimum 280px width
        const availableHeight = Math.min(window.innerHeight * 0.35, 400); // Limit to 35% of viewport height
        
        const scaleX = availableWidth / 800;
        const scaleY = availableHeight / 400;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original size
        
        const scaledWidth = 800 * scale;
        const scaledHeight = 400 * scale;
        
        canvas.setDimensions({
          width: scaledWidth,
          height: scaledHeight
        });
        canvas.setZoom(scale);
        
        // Ensure the canvas element doesn't exceed container
        if (canvasRef.current) {
          canvasRef.current.style.width = `${scaledWidth}px`;
          canvasRef.current.style.height = `${scaledHeight}px`;
          canvasRef.current.style.maxWidth = '100%';
        }
      }
    };

    // Initial resize with slight delay to ensure DOM is ready
    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw' || activeTool === 'erase';
    
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeTool === 'erase' ? '#ffffff' : activeColor;
      fabricCanvas.freeDrawingBrush.width = activeTool === 'erase' ? 10 : 3;
    }
  }, [activeTool, activeColor, fabricCanvas]);

  const generateAIHints = async () => {
    try {
      setLoadingHints(true);
      
      // Get recent drawings for context
      const { data: recentDrawings } = await supabase
        .from('drawings')
        .select('gratitude_prompt, user_description')
        .eq('user_id', user?.id)
        .eq('is_gratitude_entry', true)
        .order('created_at', { ascending: false })
        .limit(5);

      const recentEntries = recentDrawings?.map(d => 
        d.gratitude_prompt || d.user_description
      ).filter(Boolean) || [];

      const { data, error } = await supabase.functions.invoke('generate-gratitude-hints', {
        body: { 
          mood: null, // Could add mood selector later
          recentEntries 
        }
      });

      if (error) throw error;
      setAiHints(data.prompts || []);
      toast.success('AI hints generated!');
    } catch (error) {
      console.error('Error generating AI hints:', error);
      toast.error('Failed to generate AI hints');
    } finally {
      setLoadingHints(false);
    }
  };

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (tool === 'rectangle') {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 100,
        height: 100,
      });
      fabricCanvas?.add(rect);
    } else if (tool === 'circle') {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: activeColor,
        radius: 50,
      });
      fabricCanvas?.add(circle);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    setSavedDrawingId(null);
    toast.success('Canvas cleared');
  };

  const handleSave = async () => {
    if (!fabricCanvas || !user) {
      toast.error('Please draw something first');
      return;
    }

    try {
      setSaving(true);
      
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1,
      });

      const blob = await fetch(dataURL).then(res => res.blob());
      const fileName = `gratitude-${Date.now()}.png`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('drawings')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('drawings')
        .getPublicUrl(filePath);

      const finalPrompt = selectedPrompt || customPrompt || null;

      const { data, error } = await supabase
        .from('drawings')
        .insert({
          user_id: user.id,
          title: finalPrompt || 'My Gratitude Drawing',
          image_url: urlData.publicUrl,
          storage_path: filePath,
          gratitude_prompt: finalPrompt,
          is_gratitude_entry: true,
        })
        .select()
        .single();

      if (error) throw error;

      setSavedDrawingId(data.id);
      toast.success('Gratitude drawing saved!');
      onSaveSuccess();

      // Update user streak
      await updateUserStreak();

      // Auto-enhance the drawing
      await handleEnhance(data.id, dataURL, finalPrompt);

    } catch (error) {
      console.error('Error saving drawing:', error);
      toast.error('Failed to save drawing');
    } finally {
      setSaving(false);
    }
  };

  const updateUserStreak = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (existingStreak) {
        const lastEntryDate = existingStreak.last_entry_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = 1;
        if (lastEntryDate === yesterdayStr) {
          newStreak = existingStreak.current_streak + 1;
        } else if (lastEntryDate === today) {
          return; // Already counted today
        }

        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, existingStreak.longest_streak),
            last_entry_date: today,
          })
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('user_streaks')
          .insert({
            user_id: user?.id,
            current_streak: 1,
            longest_streak: 1,
            last_entry_date: today,
          });
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const handleEnhance = async (drawingId?: string, imageData?: string, enhancementPrompt?: string) => {
    const targetDrawingId = drawingId || savedDrawingId;
    
    if (!fabricCanvas || !targetDrawingId) {
      toast.error('Please save your drawing first');
      return;
    }

    try {
      setEnhancing(true);
      const dataURL = imageData || fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1,
      });

      const promptText = enhancementPrompt || selectedPrompt || customPrompt || '';

      const { data, error } = await supabase.functions.invoke('enhance-drawing', {
        body: {
          imageData: dataURL,
          prompt: '',
          userDescription: promptText,
          drawingId: targetDrawingId,
        },
      });

      if (error) throw error;

      toast.success('Your gratitude drawing is being enhanced! Check back in a moment.');
      onSaveSuccess();
    } catch (error) {
      console.error('Error enhancing drawing:', error);
      toast.error('Failed to enhance drawing');
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Gratitude Prompts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            What are you grateful for today?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateAIHints}
              disabled={loadingHints}
            >
              {loadingHints ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Get AI Suggestions
            </Button>
          </div>

          {aiHints.length > 0 && (
            <div className="space-y-2">
              <Label>AI Suggestions:</Label>
              <div className="flex flex-wrap gap-2">
                {aiHints.map((hint, index) => (
                  <Badge
                    key={index}
                    variant={selectedPrompt === hint ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedPrompt(selectedPrompt === hint ? '' : hint)}
                  >
                    {hint}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Or write your own gratitude prompt:</Label>
            <Input
              id="custom-prompt"
              placeholder="I'm grateful for..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Drawing Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Draw Your Gratitude</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-3 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
            <Button
              variant={activeTool === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('draw')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Pencil
            </Button>
            <Button
              variant={activeTool === 'erase' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('erase')}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Eraser
            </Button>
            <Button
              variant={activeTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToolClick('rectangle')}
            >
              <Square className="h-4 w-4 mr-2" />
              Rectangle
            </Button>
            <Button
              variant={activeTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToolClick('circle')}
            >
              <CircleIcon className="h-4 w-4 mr-2" />
              Circle
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 ${
                    activeColor === color ? 'border-primary' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setActiveColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-card w-full max-w-full">
            <div className="w-full overflow-hidden flex justify-center">
              <canvas ref={canvasRef} className="max-w-full h-auto block" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Save Your Gratitude Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving || enhancing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : enhancing ? 'Enhancing...' : 'Save & Enhance Entry'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GratitudeCanvas;