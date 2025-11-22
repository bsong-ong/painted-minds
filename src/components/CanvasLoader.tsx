import { Loader2 } from "lucide-react";

export const CanvasLoader = () => {
  return (
    <div className="w-full bg-card rounded-lg border flex items-center justify-center" style={{ minHeight: '350px' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading drawing tools...</p>
      </div>
    </div>
  );
};
