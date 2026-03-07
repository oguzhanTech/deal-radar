"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Bell, BellOff } from "lucide-react";
import { RadarBuddy } from "@/components/mascot/radar-buddy";
import { DealCountdown } from "@/components/deals/deal-countdown";
import { HeatBadge } from "@/components/deals/heat-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useAuthDisplay } from "@/components/auth/auth-provider";
import { LoginModal } from "@/components/auth/login-modal";
import { removeSavedDeal } from "@/app/actions";
import { useFeedCache, invalidateFeedCache } from "@/hooks/use-feed-cache";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import type { Deal, DealSave } from "@/lib/types/database";
import Link from "next/link";
import Image from "next/image";

interface SavedDeal extends DealSave {
  deal: Deal;
}

export default function MyRadarPage() {
  const { user, loading: authLoading } = useAuth();
  const { showAsLoggedIn } = useAuthDisplay();
  const { toast } = useToast();
  const cache = useFeedCache<SavedDeal[]>(`my-saves:${user?.id ?? "anon"}`);
  const [saves, setSaves] = useState<SavedDeal[]>(() => cache.get() ?? []);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const fetchSaves = useCallback(async () => {
    if (!user) return;
    const cached = cache.get();
    if (cached) {
      setSaves(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/my/saves", { credentials: "same-origin", cache: "no-store" });
      const result = (await res.json()) as SavedDeal[];
      const list = Array.isArray(result) ? result : [];
      cache.set(list);
      setSaves(list);
    } catch {
      setSaves([]);
    }
    setLoading(false);
  }, [user, cache]);

  useEffect(() => {
    if (authLoading) return;
    if (!showAsLoggedIn) {
      setSaves([]);
      setLoading(false);
      return;
    }
    if (!user) {
      setLoading(true);
      return;
    }
    invalidateFeedCache(`my-saves:${user.id}`);
    fetchSaves();
  }, [user, authLoading, showAsLoggedIn, fetchSaves]);

  const handleRemove = async (dealId: string) => {
    if (!user) return;
    const { error } = await removeSavedDeal(dealId);
    if (error) {
      toast({ title: error, variant: "destructive" });
      return;
    }
    setSaves((prev) => {
      const next = prev.filter((s) => s.deal_id !== dealId);
      cache.set(next);
      return next;
    });
    toast({ title: t("myRadar.removed") });
  };

  if (!authLoading && !showAsLoggedIn) {
    return (
      <>
        <LoginModal open={showLogin} onOpenChange={setShowLogin} />
        <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <RadarBuddy size="lg" mood="happy" className="mb-5" />
          <h2 className="text-2xl font-bold mb-2">{t("myRadar.title")}</h2>
          <p className="text-muted-foreground mb-8 text-sm">{t("myRadar.signInDesc")}</p>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer"
          >
            {t("common.signIn")}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="py-5">
      <div className="px-4 mb-4">
        <h2 className="text-xl font-extrabold">{t("myRadar.title")}</h2>
        <p className="text-xs text-muted-foreground font-medium">{saves.length} {t("myRadar.savedDeals")}</p>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center bg-card rounded-2xl p-3 shadow-card">
              <Skeleton className="w-20 h-14 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : saves.length === 0 ? (
        <div className="text-center px-4 py-16">
          <RadarBuddy size="lg" mood="thinking" message={t("myRadar.empty")} className="mb-4" />
          <p className="font-semibold">{t("myRadar.emptyAction")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("myRadar.emptyDesc")}</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          <div>
            {saves.map((save) => {
              const d = save.deal;
              const hasReminders = Object.values(save.reminder_settings || {}).some(Boolean);

              return (
                <div key={save.deal_id} className="mb-2">
                  <div className="flex gap-3 items-center rounded-2xl p-3 bg-card shadow-card">
                    <Link href={`/deal/${d.id}`} className="shrink-0">
                      <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-muted">
                        {d.image_url && (
                          <Image src={d.image_url} alt={d.title} fill className="object-cover" sizes="80px" />
                        )}
                      </div>
                    </Link>

                    <Link href={`/deal/${d.id}`} className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate">{d.title}</h3>
                      <DealCountdown endAt={d.end_at} compact className="text-xs mt-0.5" />
                      <div className="flex items-center gap-2 mt-1">
                        <HeatBadge score={d.heat_score} />
                        {hasReminders ? (
                          <Badge variant="secondary" className="text-[10px] py-0 gap-0.5 font-semibold">
                            <Bell className="h-2.5 w-2.5" /> {t("myRadar.reminderOn")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 gap-0.5 text-muted-foreground">
                            <BellOff className="h-2.5 w-2.5" /> {t("myRadar.reminderOff")}
                          </Badge>
                        )}
                      </div>
                    </Link>

                    <button
                      onClick={() => handleRemove(d.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition cursor-pointer rounded-xl hover:bg-destructive/5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
