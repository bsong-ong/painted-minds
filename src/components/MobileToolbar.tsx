import React from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Pencil, Eraser, Square, Circle, Palette, Settings, Undo, Redo } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileToolbarProps {
  activeTool: 'select' | 'draw' | 'erase' | 'rectangle' | 'circle';
  activeColor: string;
  colors: string[];
  onToolClick: (tool: 'select' | 'draw' | 'erase' | 'rectangle' | 'circle') => void;
  onColorChange: (color: string) => void;
  onClear: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({
  activeTool,
  activeColor,
  colors,
  onToolClick,
  onColorChange,
  onClear,
  onUndo,
  onRedo,
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // Desktop toolbar
    return (
      <div className="flex flex-wrap items-center gap-2 p-2 bg-card rounded-lg border">
        <Button
          variant={activeTool === 'draw' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolClick('draw')}
          className="min-w-[44px] min-h-[44px]"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'erase' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolClick('erase')}
          className="min-w-[44px] min-h-[44px]"
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'rectangle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolClick('rectangle')}
          className="min-w-[44px] min-h-[44px]"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'circle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolClick('circle')}
          className="min-w-[44px] min-h-[44px]"
        >
          <Circle className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1 ml-2">
          {colors.slice(0, 6).map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded border-2 ${
                activeColor === color ? 'border-primary' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
        
        {onUndo && (
          <Button variant="outline" size="sm" onClick={onUndo} className="min-w-[44px] min-h-[44px]">
            <Undo className="h-4 w-4" />
          </Button>
        )}
        {onRedo && (
          <Button variant="outline" size="sm" onClick={onRedo} className="min-w-[44px] min-h-[44px]">
            <Redo className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Mobile toolbar with drawer
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="flex items-center justify-between gap-2 p-3 bg-card rounded-xl border shadow-lg backdrop-blur-sm">
        {/* Quick access tools */}
        <div className="flex gap-2">
          <Button
            variant={activeTool === 'draw' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolClick('draw')}
            className="min-w-[48px] min-h-[48px] rounded-xl"
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant={activeTool === 'erase' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolClick('erase')}
            className="min-w-[48px] min-h-[48px] rounded-xl"
          >
            <Eraser className="h-5 w-5" />
          </Button>
        </div>

        {/* Color indicator */}
        <div 
          className="w-10 h-10 rounded-full border-2 border-primary"
          style={{ backgroundColor: activeColor }}
        />

        {/* More tools drawer */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[48px] min-h-[48px] rounded-xl">
              <Settings className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>Drawing Tools</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-6">
              {/* Tools */}
              <div className="space-y-3">
                <h3 className="font-medium">Tools</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={activeTool === 'rectangle' ? 'default' : 'outline'}
                    onClick={() => onToolClick('rectangle')}
                    className="min-h-[56px] flex flex-col gap-1"
                  >
                    <Square className="h-5 w-5" />
                    <span className="text-xs">Rectangle</span>
                  </Button>
                  <Button
                    variant={activeTool === 'circle' ? 'default' : 'outline'}
                    onClick={() => onToolClick('circle')}
                    className="min-h-[56px] flex flex-col gap-1"
                  >
                    <Circle className="h-5 w-5" />
                    <span className="text-xs">Circle</span>
                  </Button>
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Colors
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-12 h-12 rounded-lg border-2 ${
                        activeColor === color ? 'border-primary scale-110' : 'border-gray-300'
                      } transition-all`}
                      style={{ backgroundColor: color }}
                      onClick={() => onColorChange(color)}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <h3 className="font-medium">Actions</h3>
                <div className="flex gap-3">
                  {onUndo && (
                    <Button variant="outline" onClick={onUndo} className="flex-1 min-h-[48px]">
                      <Undo className="h-4 w-4 mr-2" />
                      Undo
                    </Button>
                  )}
                  {onRedo && (
                    <Button variant="outline" onClick={onRedo} className="flex-1 min-h-[48px]">
                      <Redo className="h-4 w-4 mr-2" />
                      Redo
                    </Button>
                  )}
                  <Button variant="destructive" onClick={onClear} className="flex-1 min-h-[48px]">
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};