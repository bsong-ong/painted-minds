import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MessageCircle, Unlink, Link as LinkIcon } from "lucide-react";

export const LineAccountLink = () => {
  const { user } = useAuth();
  const [isLinked, setIsLinked] = useState(false);
  const [linkToken, setLinkToken] = useState("");
  const [lineData, setLineData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLinkStatus();
  }, [user]);

  const checkLinkStatus = async () => {
    if (!user) return;

    try {
    const { data, error } = await supabase
      .from("line_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

      if (data) {
        setIsLinked(true);
        setLineData(data);
      } else {
        setIsLinked(false);
        setLineData(null);
      }
    } catch (error) {
      console.error("Error checking LINE link status:", error);
    }
  };

  const handleLink = async () => {
    if (!linkToken.trim()) {
      toast.error("Please enter a link token");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("line-link-account", {
        body: { linkToken: linkToken.trim() },
      });

      if (error) throw error;

      toast.success("LINE account linked successfully!");
      setLinkToken("");
      await checkLinkStatus();
    } catch (error: any) {
      console.error("Error linking LINE account:", error);
      toast.error(error.message || "Failed to link LINE account");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!user || !lineData) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("line_accounts")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("LINE account unlinked");
      await checkLinkStatus();
    } catch (error: any) {
      console.error("Error unlinking LINE account:", error);
      toast.error("Failed to unlink LINE account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          LINE Messenger
        </CardTitle>
        <CardDescription>
          Connect your LINE account to receive notifications and interact with Painted Minds via LINE
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Linked LINE Account</p>
              <p className="font-mono text-sm">{lineData?.line_user_id}</p>
              {lineData?.display_name && (
                <p className="text-sm mt-1">{lineData.display_name}</p>
              )}
            </div>
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={loading}
              className="w-full"
            >
              <Unlink className="w-4 h-4 mr-2" />
              Unlink LINE Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                To link your LINE account:
              </p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Add the Painted Minds bot as a friend on LINE</li>
                <li>Send any message to the bot (e.g., "hello")</li>
                <li>Copy the link token the bot sends you</li>
                <li>Paste the token below and click Link Account</li>
              </ol>
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter link token from LINE"
                value={linkToken}
                onChange={(e) => setLinkToken(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={handleLink}
                disabled={loading || !linkToken.trim()}
                className="w-full"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Link LINE Account
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};