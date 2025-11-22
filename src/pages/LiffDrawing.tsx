import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
import { MobileCanvas } from "@/components/MobileCanvas";
import type { MobileCanvasRef } from "@/components/MobileCanvas";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { LIFF_CONFIG } from "@/config/liff";

export default function LiffDrawing() {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"draw" | "select" | "rectangle" | "circle">("draw");
  const [activeColor, setActiveColor] = useState("#000000");
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<MobileCanvasRef>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initLiff = async () => {
      try {
        // Check if LIFF_ID is set
        if (!LIFF_CONFIG.liffId) {
          console.error("LIFF_ID is not set");
          toast.error("LIFF ID is not configured. Please add your LIFF ID to src/config/liff.ts");
          return;
        }

        console.log("Initializing LIFF with ID:", LIFF_CONFIG.liffId);
        await liff.init({ liffId: LIFF_CONFIG.liffId });
        
        if (!liff.isLoggedIn()) {
          console.log("User not logged in, redirecting to login");
          liff.login();
          return;
        }

        console.log("LIFF initialized successfully");
        setIsLiffReady(true);
        
        // Get LINE user profile
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        console.log("LINE User ID:", lineUserId);

        // Find the app user linked to this LINE account
        const { data: lineAccount, error: queryError } = await supabase
          .from("line_accounts")
          .select("user_id")
          .eq("line_user_id", lineUserId)
          .single();

        if (queryError) {
          console.error("Database query error:", queryError);
        }

        if (lineAccount) {
          console.log("Found linked account:", lineAccount.user_id);
          setUserId(lineAccount.user_id);
        } else {
          console.log("No linked account found");
          toast.error("LINE account not linked. Please link your account in the app settings.");
        }
      } catch (error) {
        console.error("LIFF initialization failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to initialize LINE app: ${errorMessage}`);
      }
    };

    initLiff();
  }, []);

  const handleSave = async () => {
    if (!canvasRef.current || !userId) return;

    setIsSaving(true);
    try {
      const dataUrl = canvasRef.current.getDataURL();
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `liff-drawing-${Date.now()}.png`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("drawings")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("drawings")
        .getPublicUrl(filePath);

      // Save to database
      const { error: insertError } = await supabase
        .from("drawings")
        .insert({
          user_id: userId,
          image_url: publicUrl,
          storage_path: filePath,
          title: "LINE Drawing",
          is_gratitude_entry: false,
          is_public: false,
        });

      if (insertError) throw insertError;

      toast.success("Drawing saved!");
      
      // Close LIFF window
      if (liff.isInClient()) {
        liff.closeWindow();
      }
    } catch (error) {
      console.error("Error saving drawing:", error);
      toast.error("Failed to save drawing");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToChat = async () => {
    if (!canvasRef.current) return;

    setIsSaving(true);
    try {
      const dataUrl = canvasRef.current.getDataURL();
      
      if (liff.isInClient()) {
        // Send image to LINE chat
        await liff.sendMessages([
          {
            type: "image",
            originalContentUrl: dataUrl,
            previewImageUrl: dataUrl,
          },
        ]);
        
        toast.success("Drawing sent to chat!");
        liff.closeWindow();
      }
    } catch (error) {
      console.error("Error sending to chat:", error);
      toast.error("Failed to send drawing");
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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-foreground mb-4">Please link your LINE account first</p>
          <Button onClick={() => liff.closeWindow()}>Close</Button>
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

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <MobileCanvas
          ref={canvasRef}
          activeTool={activeTool}
          activeColor={activeColor}
        />
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
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
        </Button>
        {liff.isInClient() && (
          <Button
            onClick={handleSendToChat}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Send</>}
          </Button>
        )}
      </div>
    </div>
  );
}
