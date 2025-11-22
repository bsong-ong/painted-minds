import { useEffect, useState, useRef } from "react";
import liff from "@line/liff";
import { MobileCanvas } from "@/components/MobileCanvas";
import type { MobileCanvasRef } from "@/components/MobileCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, Lightbulb } from "lucide-react";
import { LIFF_CONFIG } from "@/config/liff";

export default function LiffGratitude() {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"draw" | "select" | "rectangle" | "circle">("draw");
  const [activeColor, setActiveColor] = useState("#000000");
  const [gratitudeText, setGratitudeText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [step, setStep] = useState<"prompt" | "draw">("prompt");
  const canvasRef = useRef<MobileCanvasRef>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        if (!LIFF_CONFIG.liffId) {
          toast.error("LIFF ID is not configured");
          return;
        }

        await liff.init({ liffId: LIFF_CONFIG.liffId });
        
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        setIsLiffReady(true);
        
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;

        const functionUrl = `https://kmhnnkwcxroxyfkbhqia.supabase.co/functions/v1/line-get-user-id`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttaG5ua3djeHJveHlma2JocWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Njk5OTMsImV4cCI6MjA3NTA0NTk5M30.VlcxLNhoyj_aoFzg9a3ma-5a01zfPr32wfcvm0UF5Xo',
          },
          body: JSON.stringify({ lineUserId }),
        });

        const data = await response.json();

        if (!response.ok || !data.userId) {
          toast.error("LINE account not linked. Please link your account in the app settings.");
          return;
        }

        setUserId(data.userId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to initialize: ${errorMessage}`);
      }
    };

    initLiff();
  }, []);

  const handleNext = () => {
    if (!gratitudeText.trim()) {
      toast.error("Please enter what you're grateful for");
      return;
    }
    setStep("draw");
  };

  const handleSaveAndEnhance = async () => {
    if (!canvasRef.current || !userId) {
      toast.error("Cannot save - missing canvas or user ID");
      return;
    }

    setIsSaving(true);
    try {
      const dataUrl = canvasRef.current.getDataURL();

      // Save the drawing
      const functionUrl = `https://kmhnnkwcxroxyfkbhqia.supabase.co/functions/v1/save-liff-drawing`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: dataUrl,
          userId: userId,
          gratitudePrompt: gratitudeText,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to save drawing');
      }

      const drawingId = data.drawingId;
      toast.success("Drawing saved! Enhancing...");

      // Enhance the drawing
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
          userDescription: gratitudeText,
          drawingId: drawingId,
        }),
      });

      const enhanceData = await enhanceResponse.json();

      if (!enhanceResponse.ok) {
        toast.error('Enhancement in progress, but you may need to check your journal later');
        if (liff.isInClient()) {
          setTimeout(() => liff.closeWindow(), 2000);
        }
        return;
      }

      // Send enhanced image to LINE
      if (liff.isInClient() && enhanceData.enhancedImageUrl) {
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
          console.error("Failed to send to LINE:", sendError);
          toast.success("Drawing enhanced! Check your gallery.");
        }
      } else {
        toast.success("Drawing enhanced! Check your gallery.");
      }
      
      // Close LIFF window after a short delay
      setTimeout(() => {
        if (liff.isInClient()) {
          liff.closeWindow();
        }
      }, 2000);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error:", error);
      toast.error(`Failed: ${errorMsg}`);
    } finally {
      setIsSaving(false);
      setIsEnhancing(false);
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
        <div className="text-center">
          <p className="text-foreground mb-4">Please link your LINE account first</p>
          <Button onClick={() => liff.closeWindow()}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {step === "prompt" ? (
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                What are you grateful for today?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gratitude">Share your gratitude:</Label>
                <Input
                  id="gratitude"
                  placeholder="I'm grateful for..."
                  value={gratitudeText}
                  onChange={(e) => setGratitudeText(e.target.value)}
                  className="text-base"
                />
              </div>
              <Button onClick={handleNext} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Next: Draw
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col h-screen">
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
            </div>
            
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>

          {/* Gratitude text reminder */}
          <div className="bg-muted p-2 text-sm text-center border-b border-border">
            <span className="font-medium">Your gratitude:</span> {gratitudeText}
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
            <MobileCanvas
              ref={canvasRef}
              activeTool={activeTool}
              activeColor={activeColor}
            />
          </div>

          {/* Action buttons */}
          <div className="bg-card border-t border-border p-4 space-y-2">
            <Button
              onClick={() => setStep("prompt")}
              variant="outline"
              className="w-full"
            >
              Back
            </Button>
            <Button
              onClick={handleSaveAndEnhance}
              disabled={isSaving || isEnhancing}
              className="w-full"
            >
              {isSaving || isEnhancing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSaving ? "Saving..." : "Enhancing..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Save & Enhance
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
