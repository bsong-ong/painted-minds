import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import liff from "@line/liff";
import { MobileCanvas } from "@/components/MobileCanvas";
import type { MobileCanvasRef } from "@/components/MobileCanvas";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { LIFF_CONFIG } from "@/config/liff";

export default function LiffDrawing() {
  const [searchParams] = useSearchParams();
  const gratitudeParam = searchParams.get('gratitude');
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"draw" | "select" | "rectangle" | "circle">("draw");
  const [activeColor, setActiveColor] = useState("#000000");
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const canvasRef = useRef<MobileCanvasRef>(null);
  const navigate = useNavigate();
  const isGratitudeMode = !!gratitudeParam;

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    const initLiff = async () => {
      try {
        addDebug("Starting LIFF initialization");
        // Check if LIFF_ID is set
        if (!LIFF_CONFIG.liffId) {
          addDebug("ERROR: LIFF_ID is not set");
          toast.error("LIFF ID is not configured. Please add your LIFF ID to src/config/liff.ts");
          return;
        }

        addDebug(`LIFF ID configured: ${LIFF_CONFIG.liffId}`);
        await liff.init({ liffId: LIFF_CONFIG.liffId });
        addDebug("LIFF initialized");
        
        if (!liff.isLoggedIn()) {
          addDebug("User not logged in, redirecting to login");
          liff.login();
          return;
        }

        addDebug("User logged in to LIFF");
        setIsLiffReady(true);
        
        // Get LINE user profile
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        addDebug(`LINE User ID: ${lineUserId}`);

        // Find the app user linked to this LINE account via edge function
        addDebug(`Calling edge function with ID: ${lineUserId}`);
        
        // Make direct fetch call to edge function
        const functionUrl = `https://kmhnnkwcxroxyfkbhqia.supabase.co/functions/v1/line-get-user-id`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttaG5ua3djeHJveHlma2JocWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Njk5OTMsImV4cCI6MjA3NTA0NTk5M30.VlcxLNhoyj_aoFzg9a3ma-5a01zfPr32wfcvm0UF5Xo',
          },
          body: JSON.stringify({ lineUserId }),
        });

        addDebug(`Response status: ${response.status}`);
        const data = await response.json();
        addDebug(`Response data: ${JSON.stringify(data)}`);

        if (!response.ok || !data.userId) {
          addDebug(`Failed to get user ID`);
          toast.error("LINE account not linked. Please link your account in the app settings.");
          return;
        }

        addDebug(`Success! User ID: ${data.userId}`);
        setUserId(data.userId);
      } catch (error) {
        addDebug(`EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to initialize LINE app: ${errorMessage}`);
      }
    };

    initLiff();
  }, []);

  const handleSave = async () => {
    if (!canvasRef.current || !userId) {
      addDebug("Save: Missing canvas or userId");
      toast.error("Cannot save - missing canvas or user ID");
      return;
    }

    addDebug("Starting save...");
    setIsSaving(true);
    try {
      addDebug("Getting canvas data URL...");
      const dataUrl = canvasRef.current.getDataURL();
      addDebug(`Data URL length: ${dataUrl.length}`);

      addDebug("Calling save edge function...");
      const functionUrl = `https://kmhnnkwcxroxyfkbhqia.supabase.co/functions/v1/save-liff-drawing`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: dataUrl,
          userId: userId,
          gratitudePrompt: gratitudeParam || null,
        }),
      });

      addDebug(`Response status: ${response.status}`);
      const data = await response.json();
      addDebug(`Response: ${JSON.stringify(data)}`);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to save drawing');
      }

      // If in gratitude mode, enhance the drawing
      if (isGratitudeMode && data.drawingId) {
        addDebug("Gratitude mode: enhancing drawing...");
        setIsEnhancing(true);
        
        const enhanceUrl = `https://kmhnnkwcxroxyfkbhqia.supabase.co/functions/v1/enhance-drawing`;
        const enhanceResponse = await fetch(enhanceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: dataUrl,
            prompt: '',
            userDescription: gratitudeParam,
            drawingId: data.drawingId,
          }),
        });

        const enhanceData = await enhanceResponse.json();
        addDebug(`Enhancement response: ${JSON.stringify(enhanceData)}`);

        if (enhanceResponse.ok && enhanceData.enhancedImageUrl && liff.isInClient()) {
          // Send enhanced image to LINE
          try {
            await liff.sendMessages([
              {
                type: "image",
                originalContentUrl: enhanceData.enhancedImageUrl,
                previewImageUrl: enhanceData.enhancedImageUrl,
              },
            ]);
            addDebug("Enhanced image sent to LINE");
            toast.success("Enhanced image sent to LINE chat!");
          } catch (sendError) {
            addDebug(`Failed to send to LINE: ${sendError}`);
            toast.success("Drawing enhanced! Check your gallery.");
          }
        } else {
          toast.success("Drawing saved and enhancing! Check back soon.");
        }
      } else {
        toast.success("Drawing saved!");
      }

      addDebug("Save complete!");
      
      // Close LIFF window
      setTimeout(() => {
        if (liff.isInClient()) {
          liff.closeWindow();
        }
      }, 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addDebug(`Save failed: ${errorMsg}`);
      console.error("Error saving drawing:", error);
      toast.error(`Failed to save: ${errorMsg}`);
    } finally {
      setIsSaving(false);
      setIsEnhancing(false);
    }
  };

  const handleSendToChat = async () => {
    if (!canvasRef.current || !userId) {
      addDebug("Send: Missing canvas or userId");
      toast.error("Cannot send - missing canvas or user ID");
      return;
    }

    addDebug("Starting send to chat...");
    setIsSaving(true);
    try {
      addDebug("Getting canvas data URL...");
      const dataUrl = canvasRef.current.getDataURL();
      addDebug(`Data URL length: ${dataUrl.length}`);
      
      if (!liff.isInClient()) {
        addDebug("Not in LINE client");
        toast.error("Can only send when opened in LINE");
        setIsSaving(false);
        return;
      }

      addDebug("Uploading image first...");
      const functionUrl = `https://kmhnnkwcxroxyfkbhqia.supabase.co/functions/v1/save-liff-drawing`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: dataUrl,
          userId: userId,
          gratitudePrompt: gratitudeParam || null,
        }),
      });

      addDebug(`Response status: ${response.status}`);
      const data = await response.json();
      addDebug(`Upload response: ${JSON.stringify(data)}`);

      if (!response.ok || !data?.success || !data?.publicUrl) {
        throw new Error(data?.error || 'Failed to upload image');
      }

      addDebug(`Sending URL to LINE: ${data.publicUrl}`);
      
      // Send public URL to LINE chat
      await liff.sendMessages([
        {
          type: "image",
          originalContentUrl: data.publicUrl,
          previewImageUrl: data.publicUrl,
        },
      ]);
      
      addDebug("Sent successfully!");
      toast.success("Drawing sent to chat!");
      liff.closeWindow();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addDebug(`Send failed: ${errorMsg}`);
      console.error("Error sending to chat:", error);
      toast.error(`Failed to send: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLiffReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center mb-4">
          <p className="text-foreground mb-4">Please link your LINE account first</p>
          <Button onClick={() => liff.closeWindow()}>Close</Button>
        </div>
        <div className="w-full max-w-md bg-card p-4 rounded-lg border border-border overflow-auto max-h-96">
          <h3 className="text-sm font-semibold mb-2">Debug Log:</h3>
          <div className="text-xs font-mono space-y-1">
            {debugInfo.map((info, i) => (
              <div key={i} className="text-muted-foreground">{info}</div>
            ))}
          </div>
        </div>
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
      <div className="flex-1 overflow-hidden">
        <MobileCanvas
          ref={canvasRef}
          activeTool={activeTool}
          activeColor={activeColor}
        />
      </div>

      {/* Debug info (only show when debugging) */}
      {debugInfo.length > 5 && (
        <div className="bg-card border-t border-border p-2 max-h-32 overflow-auto">
          <div className="text-xs font-mono space-y-1">
            {debugInfo.slice(-10).map((info, i) => (
              <div key={i} className="text-muted-foreground">{info}</div>
            ))}
          </div>
        </div>
      )}

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
