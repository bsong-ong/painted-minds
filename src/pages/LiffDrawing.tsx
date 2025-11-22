import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import liff from "@line/liff";
import type { MobileCanvasRef } from "@/components/MobileCanvas";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { LIFF_CONFIG } from "@/config/liff";
import { supabase } from "@/integrations/supabase/client";
import { CanvasLoader } from "@/components/CanvasLoader";

// Lazy load the heavy MobileCanvas component (contains fabric.js ~400KB)
const MobileCanvas = lazy(() => import("@/components/MobileCanvas"));

export default function LiffDrawing() {
  const [searchParams] = useSearchParams();
  const gratitudeParam = searchParams.get('gratitude');
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>("Connecting to LINE...");
  const [activeTool, setActiveTool] = useState<"draw" | "select" | "rectangle" | "circle">("draw");
  const [activeColor, setActiveColor] = useState("#000000");
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const canvasRef = useRef<MobileCanvasRef>(null);
  const navigate = useNavigate();
  const isGratitudeMode = !!gratitudeParam;

  useEffect(() => {
    const initLiff = async () => {
      try {
        if (!LIFF_CONFIG.liffId) {
          toast.error("LIFF ID is not configured. Please add your LIFF ID to src/config/liff.ts");
          return;
        }

        setLoadingStage("Connecting to LINE...");
        await liff.init({ liffId: LIFF_CONFIG.liffId });
        
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        setLoadingStage("Authenticating...");
        setIsLiffReady(true);
        
        // Get LINE user profile
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;

        setLoadingStage("Loading your account...");
        
        // Find the app user linked to this LINE account via edge function
        const { data, error } = await supabase.functions.invoke('line-get-user-id', {
          body: { lineUserId }
        });

        if (error || !data?.userId) {
          toast.error("LINE account not linked. Please link your account in the app settings.");
          if (liff.isInClient()) {
            setTimeout(() => liff.closeWindow(), 2000);
          }
          return;
        }

        setUserId(data.userId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to initialize LINE app: ${errorMessage}`);
        if (liff.isInClient()) {
          setTimeout(() => liff.closeWindow(), 2000);
        }
      }
    };

    initLiff();
  }, []);

  const handleSave = async () => {
    if (!canvasRef.current || !userId) {
      toast.error("Cannot save - missing canvas or user ID");
      return;
    }

    setIsSaving(true);
    try {
      const dataUrl = canvasRef.current.getDataURL();

      const { data, error } = await supabase.functions.invoke('save-liff-drawing', {
        body: {
          imageData: dataUrl,
          userId: userId,
          gratitudePrompt: gratitudeParam || null,
        }
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to save drawing');
      }

      // If in gratitude mode, enhance the drawing
      if (isGratitudeMode && data.drawingId) {
        setIsEnhancing(true);
        
        const { data: enhanceData, error: enhanceError } = await supabase.functions.invoke('enhance-drawing', {
          body: {
            imageData: dataUrl,
            prompt: '',
            userDescription: gratitudeParam,
            drawingId: data.drawingId,
          }
        });

        if (!enhanceError && enhanceData?.enhancedImageUrl && liff.isInClient()) {
          // Send enhanced image to LINE
          try {
            await liff.sendMessages([
              {
                type: "image",
                originalContentUrl: enhanceData.enhancedImageUrl,
                previewImageUrl: enhanceData.enhancedImageUrl,
              },
            ]);
            toast.success("Enhanced image sent to LINE chat!");
          } catch (sendError) {
            toast.success("Drawing enhanced! Check your gallery.");
          }
        } else {
          toast.success("Drawing saved and enhancing! Check back soon.");
        }
      } else {
        toast.success("Drawing saved!");
      }
      
      // Close LIFF window
      setTimeout(() => {
        if (liff.isInClient()) {
          liff.closeWindow();
        }
      }, 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error saving drawing:", error);
      toast.error(`Failed to save: ${errorMsg}`);
    } finally {
      setIsSaving(false);
      setIsEnhancing(false);
    }
  };

  const handleSendToChat = async () => {
    if (!canvasRef.current || !userId) {
      toast.error("Cannot send - missing canvas or user ID");
      return;
    }

    setIsSaving(true);
    try {
      const dataUrl = canvasRef.current.getDataURL();
      
      if (!liff.isInClient()) {
        toast.error("Can only send when opened in LINE");
        setIsSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('save-liff-drawing', {
        body: {
          imageData: dataUrl,
          userId: userId,
          gratitudePrompt: gratitudeParam || null,
        }
      });

      if (error || !data?.success || !data?.publicUrl) {
        throw new Error(error?.message || data?.error || 'Failed to upload image');
      }
      
      // Send public URL to LINE chat
      await liff.sendMessages([
        {
          type: "image",
          originalContentUrl: data.publicUrl,
          previewImageUrl: data.publicUrl,
        },
      ]);
      
      toast.success("Drawing sent to chat!");
      liff.closeWindow();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error sending to chat:", error);
      toast.error(`Failed to send: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLiffReady || !userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{loadingStage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toolbar */}
      <div className="bg-card border-b border-border p-2 flex gap-2 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTool === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("draw")}
          >
            Draw
          </Button>
          <Button
            variant={activeTool === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("select")}
          >
            Select
          </Button>
          <Button
            variant={activeTool === "rectangle" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("rectangle")}
          >
            Rectangle
          </Button>
          <Button
            variant={activeTool === "circle" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("circle")}
          >
            Circle
          </Button>
        </div>
        
        <input
          type="color"
          value={activeColor}
          onChange={(e) => setActiveColor(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer"
        />
      </div>

      {/* Gratitude text reminder (if in gratitude mode) */}
      {isGratitudeMode && gratitudeParam && (
        <div className="bg-muted p-2 text-sm text-center border-b border-border">
          <span className="font-medium">Your gratitude:</span> {gratitudeParam}
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-hidden p-4">
        <Suspense fallback={<CanvasLoader />}>
          <MobileCanvas
            ref={canvasRef}
            activeTool={activeTool}
            activeColor={activeColor}
          />
        </Suspense>
      </div>

      {/* Action buttons */}
      <div className="bg-card border-t border-border p-4 flex gap-2">
        <Button
          onClick={() => canvasRef.current?.clear()}
          variant="outline"
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || isEnhancing}
          className="flex-1"
        >
          {isSaving || isEnhancing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEnhancing ? "Enhancing..." : "Saving..."}
            </>
          ) : (
            <>
              {isGratitudeMode ? <Sparkles className="w-4 h-4 mr-2" /> : null}
              {isGratitudeMode ? "Save & Enhance" : "Save"}
            </>
          )}
        </Button>
        {!isGratitudeMode && liff.isInClient() && (
          <Button
            onClick={handleSendToChat}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
          </Button>
        )}
      </div>
    </div>
  );
}
