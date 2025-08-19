import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, PencilBrush } from 'fabric';
import { useMobileGestures } from '@/hooks/use-mobile-gestures';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface MobileCanvasProps {
  activeTool: 'select' | 'draw' | 'erase' | 'rectangle' | 'circle';
  activeColor: string;
  onToolChange?: (tool: 'select' | 'draw' | 'erase' | 'rectangle' | 'circle') => void;
}

export interface MobileCanvasRef {
  canvas: FabricCanvas | null;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  getDataURL: () => string;
}

export const MobileCanvas = forwardRef<MobileCanvasRef, MobileCanvasProps>(
  ({ activeTool, activeColor, onToolChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
    const [canvasZoom, setCanvasZoom] = useState(1);
    const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isMobile = useIsMobile();

    // Mobile gesture handling
    const gestureRef = useMobileGestures({
      onPinchZoom: (scale) => {
        if (fabricCanvas && isMobile) {
          const newZoom = Math.max(0.5, Math.min(3, canvasZoom * scale));
          fabricCanvas.setZoom(newZoom);
          setCanvasZoom(newZoom);
        }
      },
      onDoubleTap: () => {
        if (fabricCanvas && isMobile) {
          const resetZoom = 1;
          fabricCanvas.setZoom(resetZoom);
          setCanvasZoom(resetZoom);
          fabricCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];
        }
      },
    });

    // Initialize canvas
    useEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Calculate optimal canvas size for mobile
      const maxWidth = isMobile ? Math.min(containerRect.width - 32, window.innerWidth - 32) : 800;
      const maxHeight = isMobile ? Math.min(window.innerHeight * 0.4, 400) : 400;
      
      const canvas = new FabricCanvas(canvasRef.current, {
        width: maxWidth,
        height: maxHeight,
        backgroundColor: '#ffffff',
        enablePointerEvents: true,
        allowTouchScrolling: false,
        selection: activeTool === 'select',
      });

      // Configure drawing brush
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = isMobile ? 4 : 3; // Slightly thicker for mobile

      // Enhanced touch support
      if (isMobile) {
        // Prevent scrolling when drawing
        canvas.on('mouse:down', () => {
          document.body.style.overflow = 'hidden';
        });
        
        canvas.on('mouse:up', () => {
          document.body.style.overflow = '';
        });

        // Better palm rejection
        canvas.on('path:created', () => {
          saveState(canvas);
        });
      }

      setFabricCanvas(canvas);

      // Handle window resize
      const handleResize = () => {
        if (!container || !canvas) return;
        
        const newRect = container.getBoundingClientRect();
        const newMaxWidth = isMobile ? Math.min(newRect.width - 32, window.innerWidth - 32) : 800;
        const newMaxHeight = isMobile ? Math.min(window.innerHeight * 0.4, 400) : 400;
        
        canvas.setDimensions({
          width: newMaxWidth,
          height: newMaxHeight,
        });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        canvas.dispose();
      };
    }, [isMobile]);

    // Update canvas based on active tool
    useEffect(() => {
      if (!fabricCanvas) return;

      fabricCanvas.isDrawingMode = activeTool === 'draw' || activeTool === 'erase';
      fabricCanvas.selection = activeTool === 'select';
      
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = activeTool === 'erase' ? '#ffffff' : activeColor;
        fabricCanvas.freeDrawingBrush.width = activeTool === 'erase' ? (isMobile ? 12 : 10) : (isMobile ? 4 : 3);
      }

      fabricCanvas.renderAll();
    }, [activeTool, activeColor, fabricCanvas, isMobile]);

    // History management
    const saveState = (canvas: FabricCanvas) => {
      const state = JSON.stringify(canvas.toJSON());
      const newHistory = canvasHistory.slice(0, historyIndex + 1);
      newHistory.push(state);
      
      // Limit history to 20 states
      if (newHistory.length > 20) {
        newHistory.shift();
      }
      
      setCanvasHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
      if (historyIndex > 0 && fabricCanvas) {
        const newIndex = historyIndex - 1;
        const state = canvasHistory[newIndex];
        fabricCanvas.loadFromJSON(state, () => {
          fabricCanvas.renderAll();
          setHistoryIndex(newIndex);
        });
      }
    };

    const redo = () => {
      if (historyIndex < canvasHistory.length - 1 && fabricCanvas) {
        const newIndex = historyIndex + 1;
        const state = canvasHistory[newIndex];
        fabricCanvas.loadFromJSON(state, () => {
          fabricCanvas.renderAll();
          setHistoryIndex(newIndex);
        });
      }
    };

    const clear = () => {
      if (fabricCanvas) {
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = '#ffffff';
        fabricCanvas.renderAll();
        saveState(fabricCanvas);
        toast.success('Canvas cleared');
      }
    };

    const getDataURL = () => {
      if (!fabricCanvas) return '';
      return fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1,
      });
    };

    // Handle shape tools
    const handleShapeAdd = (shape: 'rectangle' | 'circle') => {
      if (!fabricCanvas) return;

      const centerX = fabricCanvas.width! / 2;
      const centerY = fabricCanvas.height! / 2;

      if (shape === 'rectangle') {
        const rect = new Rect({
          left: centerX - 50,
          top: centerY - 50,
          fill: activeColor,
          width: 100,
          height: 100,
        });
        fabricCanvas.add(rect);
      } else if (shape === 'circle') {
        const circle = new Circle({
          left: centerX - 50,
          top: centerY - 50,
          fill: activeColor,
          radius: 50,
        });
        fabricCanvas.add(circle);
      }

      saveState(fabricCanvas);
      onToolChange?.('select'); // Switch to select mode after adding shape
    };

    // Handle tool actions
    useEffect(() => {
      if (activeTool === 'rectangle' || activeTool === 'circle') {
        handleShapeAdd(activeTool);
      }
    }, [activeTool]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      canvas: fabricCanvas,
      clear,
      undo,
      redo,
      getDataURL,
    }));

    // Attach gesture ref to container
    useEffect(() => {
      if (containerRef.current && gestureRef.current !== containerRef.current) {
        // @ts-ignore
        gestureRef.current = containerRef.current;
      }
    }, []);

    return (
      <div 
        ref={containerRef}
        className="w-full bg-card rounded-lg border overflow-hidden"
        style={{ touchAction: isMobile ? 'none' : 'auto' }}
      >
        <div className="relative w-full">
          {isMobile && canvasZoom !== 1 && (
            <div className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs">
              {Math.round(canvasZoom * 100)}%
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            className="block max-w-full h-auto"
            style={{ 
              cursor: activeTool === 'draw' ? 'crosshair' : 
                     activeTool === 'erase' ? 'grab' : 'default'
            }}
          />
        </div>
      </div>
    );
  }
);

MobileCanvas.displayName = 'MobileCanvas';