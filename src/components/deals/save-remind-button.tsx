"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useAuthGuard } from "@/components/auth/auth-guard";
import { useSavedDealIds } from "@/components/saved-deals/saved-deal-ids-context";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { invalidateFeedCache } from "@/hooks/use-feed-cache";

interface SaveRemindButtonProps {
  dealId: string;
  compact?: boolean;
  /** Liste/anasayfa kartlarında mount'ta getSaveStatus çağrılmasın (POST sayısını azaltır) */
  skipInitialFetch?: boolean;
  className?: string;
}

export function SaveRemindButton({ dealId, compact = false, skipInitialFetch = false, className }: SaveRemindButtonProps) {
  const { user } = useAuth();
  const { requireAuth, AuthModal } = useAuthGuard();
  const savedIds = useSavedDealIds();
  const { toast } = useToast();
  const [localSaved, setLocalSaved] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const justToggledRef = useRef(false);
  const togglingRef = useRef(false);
  const supabase = useMemo(() => createClient(), []);

  const useContext = savedIds.savedDealIds !== null;
  const saved = useContext ? savedIds.isSaved(dealId) : localSaved;

  useEffect(() => {
    if (useContext || skipInitialFetch || !user?.id || justToggledRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("deal_saves")
          .select("deal_id")
          .eq("user_id", user.id)
          .eq("deal_id", dealId)
          .maybeSingle();
        if (error || cancelled) return;
        if (!cancelled) setLocalSaved(!!data);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [useContext, skipInitialFetch, user?.id, dealId, supabase]);

  const handleToggle = () => {
    if (togglingRef.current) return;
    if (!user) {
      requireAuth(() => {});
      return;
    }

    togglingRef.current = true;
    const previousSaved = saved;
    invalidateFeedCache(`my-saves:${user.id}`);
    if (useContext) {
      if (previousSaved) savedIds.removeSaved(dealId);
      else savedIds.addSaved(dealId);
    } else {
      setLocalSaved(!previousSaved);
    }
    justToggledRef.current = true;
    if (!previousSaved) setShowCheck(true);

    (async () => {
      try {
        if (previousSaved) {
          const { error } = await supabase
            .from("deal_saves")
            .delete()
            .eq("user_id", user.id)
            .eq("deal_id", dealId);
          if (error) throw error;
          toast({ title: t("save.removed") });
        } else {
          const { error } = await supabase
            .from("deal_saves")
            .insert({ user_id: user.id, deal_id: dealId });
          if (error) throw error;
          toast({ title: t("save.savedToast"), description: t("save.savedDesc") });
        }
      } catch (err) {
        if (useContext) {
          if (previousSaved) savedIds.addSaved(dealId);
          else savedIds.removeSaved(dealId);
        } else {
          setLocalSaved(previousSaved);
        }
        toast({
          title: previousSaved ? t("save.removeFailed") : t("save.failed"),
          description: err instanceof Error ? err.message : t("create.error.failed"),
          variant: "destructive",
        });
      } finally {
        togglingRef.current = false;
        if (!previousSaved) {
          setTimeout(() => {
            setShowCheck(false);
            justToggledRef.current = false;
          }, 1200);
        } else {
          justToggledRef.current = false;
        }
      }
    })();
  };

  return (
    <>
      <AuthModal />
      {compact ? (
        <motion.button
          onClick={handleToggle}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={cn(
            "p-2 rounded-xl transition cursor-pointer shadow-sm bg-white/90 backdrop-blur-sm",
            saved ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-primary",
            className
          )}
        >
          <AnimatePresence mode="wait">
            {showCheck ? (
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
              <motion.div key="saved" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                <BellRing className="h-4 w-4 fill-current shrink-0" />
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
            variant={saved ? "secondary" : "default"}
            className={cn("gap-2 rounded-xl transition-all", className)}
            size="sm"
          >
            <AnimatePresence mode="wait">
              {showCheck ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {t("save.saved")}
                </motion.div>
              ) : saved ? (
                <motion.div key="saved" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-amber-500" />
                  {t("save.saved")}
                </motion.div>
              ) : (
                <motion.div key="unsaved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {t("save.saveRemind")}
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      )}
    </>
  );
}
