"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useAuthGuard } from "@/components/auth/auth-guard";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_REMINDER_SETTINGS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface SaveRemindButtonProps {
  dealId: string;
  compact?: boolean;
  className?: string;
}

export function SaveRemindButton({ dealId, compact = false, className }: SaveRemindButtonProps) {
  const { user } = useAuth();
  const { requireAuth, AuthModal } = useAuthGuard();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user || dealId.startsWith("demo-")) return;
    const check = async () => {
      try {
        const { data } = await supabase
          .from("deal_saves")
          .select("deal_id")
          .eq("user_id", user.id)
          .eq("deal_id", dealId)
          .maybeSingle();
        setSaved(!!data);
      } catch {
        // Table might not exist yet
      }
    };
    check();
  }, [user, dealId, supabase]);

  const handleToggle = async () => {
    requireAuth(async () => {
      if (!user) return;
      setLoading(true);
      try {
        if (saved) {
          await supabase.from("deal_saves").delete().eq("user_id", user.id).eq("deal_id", dealId);
          setSaved(false);
          toast({ title: "Deal removed from your radar" });
        } else {
          await supabase.from("deal_saves").insert({
            user_id: user.id,
            deal_id: dealId,
            reminder_settings: DEFAULT_REMINDER_SETTINGS,
          });
          setSaved(true);
          toast({ title: "Saved! Reminders activated", description: "We'll notify you before it ends" });
        }
      } catch {
        toast({ title: "Something went wrong", variant: "destructive" });
      }
      setLoading(false);
    });
  };

  return (
    <>
      <AuthModal />
      {compact ? (
        <button
          onClick={handleToggle}
          disabled={loading}
          className={cn(
            "p-2 rounded-full transition cursor-pointer",
            saved ? "bg-primary/10 text-primary" : "bg-white/90 text-muted-foreground hover:text-primary",
            className
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <BellRing className="h-4 w-4 fill-primary" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </button>
      ) : (
        <Button
          onClick={handleToggle}
          disabled={loading}
          variant={saved ? "secondary" : "default"}
          className={cn("gap-2", className)}
          size="sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <BellRing className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Save & Remind Me
            </>
          )}
        </Button>
      )}
    </>
  );
}
