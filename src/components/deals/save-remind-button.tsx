"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, BellRing, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useAuthGuard } from "@/components/auth/auth-guard";
import { getSaveStatus, toggleSaveDeal } from "@/app/actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

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
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const justToggledRef = useRef(false);

  useEffect(() => {
    if (skipInitialFetch) return;
    if (!user?.id) return;
    if (justToggledRef.current) return;
    getSaveStatus(dealId).then((r) => setSaved(r.saved));
  }, [skipInitialFetch, user?.id, dealId]);

  const handleToggle = async () => {
    requireAuth(async () => {
      if (!user) return;
      const previousSaved = saved;
      setSaved(!saved);
      setLoading(true);
      try {
        const result = await toggleSaveDeal(dealId);
        if (result.error) {
          setSaved(previousSaved);
          toast({ title: previousSaved ? t("save.removeFailed") : t("save.failed"), description: result.error, variant: "destructive" });
          return;
        }
        justToggledRef.current = true;
        setSaved(result.saved ?? false);
        if (result.saved) {
          setShowCheck(true);
          setTimeout(() => {
            setShowCheck(false);
            justToggledRef.current = false;
          }, 1200);
          toast({ title: t("save.savedToast"), description: t("save.savedDesc") });
        } else {
          justToggledRef.current = false;
          toast({ title: t("save.removed") });
        }
      } catch (err) {
        setSaved(previousSaved);
        const message = err instanceof Error ? err.message : t("create.error.failed");
        toast({ title: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <>
      <AuthModal />
      {compact ? (
        <motion.button
          onClick={handleToggle}
          disabled={loading}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={cn(
            "p-2 rounded-xl transition cursor-pointer shadow-sm bg-white/90 backdrop-blur-sm",
            saved ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-primary",
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
            disabled={loading}
            variant={saved ? "secondary" : "default"}
            className={cn("gap-2 rounded-xl transition-all", className)}
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
