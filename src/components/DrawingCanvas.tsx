import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, PencilBrush } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Square, Circle as CircleIcon, Pencil, Eraser, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DrawingCanvasProps {
  onSaveSuccess: () => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSaveSuccess }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState('#000000');
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'rectangle' | 'circle' | 'eraser'>('draw');
  const [drawingTitle, setDrawingTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth - 40,
      height: window.innerHeight - 200,
      backgroundColor: '#ffffff',
    });

    // Don't set drawing mode here - let the tool useEffect handle it
    setFabricCanvas(canvas);
    toast.success('Canvas ready! Start drawing!');
    
    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 40,
        height: window.innerHeight - 200,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    console.log('Setting drawing mode:', activeTool, activeTool === 'draw' || activeTool === 'eraser');
    fabricCanvas.isDrawingMode = activeTool === 'draw' || activeTool === 'eraser';
    
    // Force brush initialization if in drawing mode
    if (fabricCanvas.isDrawingMode) {
      // Check if brush exists, if not, create it using the correct API
      if (!fabricCanvas.freeDrawingBrush) {
        console.log('Creating new brush');
        fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      }
      
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#ffffff' : activeColor;
        fabricCanvas.freeDrawingBrush.width = activeTool === 'eraser' ? 20 : 3;
        console.log('Brush configured:', fabricCanvas.freeDrawingBrush.color, fabricCanvas.freeDrawingBrush.width);
      } else {
        console.error('Failed to create brush');
      }
    }
    
    fabricCanvas.renderAll();
  }, [activeTool, activeColor, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (tool === 'rectangle') {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 100,
        height: 80,
        stroke: activeColor,
        strokeWidth: 2,
      });
      fabricCanvas?.add(rect);
    } else if (tool === 'circle') {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: 'transparent',
        radius: 50,
        stroke: activeColor,
        strokeWidth: 2,
      });
      fabricCanvas?.add(circle);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    toast.success('Canvas cleared!');
  };

  const handleSave = async () => {
    if (!fabricCanvas || !user || !drawingTitle.trim()) {
      toast.error('Please enter a title for your drawing');
      return;
    }

    setSaving(true);

    try {
      // Convert canvas to blob
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.9,
        multiplier: 1,
      });
      
      const response = await fetch(dataURL);
      const blob = await response.blob();
      
      const fileName = `${user.id}/${Date.now()}_${drawingTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('drawings')
        .upload(fileName, blob, {
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('drawings')
        .getPublicUrl(fileName);

      // Save drawing metadata to database
      const { error: dbError } = await supabase
        .from('drawings')
        .insert({
          user_id: user.id,
          title: drawingTitle,
          image_url: publicUrl,
          storage_path: fileName,
        });

      if (dbError) throw dbError;

      toast.success('Drawing saved successfully!');
      setDrawingTitle('');
      handleClear();
      onSaveSuccess();
    } catch (error) {
      console.error('Error saving drawing:', error);
      toast.error('Failed to save drawing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Drawing Canvas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={activeTool === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('select')}
            >
              Select
            </Button>
            <Button
              variant={activeTool === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('draw')}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Draw
            </Button>
            <Button
              variant={activeTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToolClick('rectangle')}
            >
              <Square className="h-4 w-4 mr-1" />
              Rectangle
            </Button>
            <Button
              variant={activeTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToolClick('circle')}
            >
              <CircleIcon className="h-4 w-4 mr-1" />
              Circle
            </Button>
            <Button
              variant={activeTool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('eraser')}
            >
              <Eraser className="h-4 w-4 mr-1" />
              Eraser
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 ${
                  activeColor === color ? 'border-ring' : 'border-border'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setActiveColor(color)}
              />
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Label htmlFor="drawing-title">Drawing Title</Label>
              <Input
                id="drawing-title"
                placeholder="Enter a title for your drawing"
                value={drawingTitle}
                onChange={(e) => setDrawingTitle(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !drawingTitle.trim()}
              className="self-end"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <canvas ref={canvasRef} className="touch-none" />
      </div>
    </div>
  );
};

export default DrawingCanvas;