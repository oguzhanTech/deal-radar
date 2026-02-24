"use client";

import { useState, useEffect, useMemo } from "react";
import { Bell, BellRing, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [showCheck, setShowCheck] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const isDemo = dealId.startsWith("demo-");

  useEffect(() => {
    if (!user || isDemo) return;
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
  }, [user, dealId, supabase, isDemo]);

  const handleToggle = async () => {
    if (isDemo) {
      toast({ title: "Demo deal", description: "Connect Supabase to save real deals", variant: "destructive" });
      return;
    }

    requireAuth(async () => {
      if (!user) return;
      setLoading(true);
      try {
        if (saved) {
          const { error } = await supabase.from("deal_saves").delete().eq("user_id", user.id).eq("deal_id", dealId);
          if (error) {
            toast({ title: "Failed to remove deal", description: error.message, variant: "destructive" });
            setLoading(false);
            return;
          }
          setSaved(false);
          toast({ title: "Deal removed from your radar" });
        } else {
          const { error } = await supabase.from("deal_saves").insert({
            user_id: user.id,
            deal_id: dealId,
            reminder_settings: DEFAULT_REMINDER_SETTINGS,
          });
          if (error) {
            toast({ title: "Failed to save deal", description: error.message, variant: "destructive" });
            setLoading(false);
            return;
          }
          setSaved(true);
          setShowCheck(true);
          setTimeout(() => setShowCheck(false), 1200);
          toast({ title: "Saved! Reminders activated", description: "We'll notify you before it ends" });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        toast({ title: message, variant: "destructive" });
      }
      setLoading(false);
    });
  };

  return (
    <>
      <AuthModal />
      {compact ? (
        <motion.button
          onClick={handleToggle}
          disabled={loading}
          whileTap={{ scale: 0.8 }}
          animate={saved ? { scale: [1, 1.3, 1] } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={cn(
            "p-2 rounded-xl transition cursor-pointer shadow-sm",
            saved ? "bg-primary text-white" : "bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-primary",
            className
          )}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="h-4 w-4 animate-spin" />
              </motion.div>
            ) : showCheck ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Check className="h-4 w-4" />
              </motion.div>
            ) : saved ? (
              <motion.div key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <BellRing className="h-4 w-4 fill-current" />
              </motion.div>
            ) : (
              <motion.div key="unsaved" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Bell className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      ) : (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleToggle}
            disabled={loading}
            variant={saved ? "secondary" : "default"}
            className={cn(
              "gap-2 rounded-xl transition-all",
              saved && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15",
              className
            )}
            size="sm"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </motion.div>
              ) : showCheck ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Saved!
                </motion.div>
              ) : saved ? (
                <motion.div key="saved" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  Saved
                </motion.div>
              ) : (
                <motion.div key="unsaved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Save & Remind
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      )}
    </>
  );
}
