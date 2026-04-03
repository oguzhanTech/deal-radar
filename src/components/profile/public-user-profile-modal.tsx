"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, Package, Star, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BADGE_INFO, LEVEL_THRESHOLDS } from "@/lib/constants";
import type { BadgeId, Deal, Profile } from "@/lib/types/database";
import { dealPath } from "@/lib/deal-url";

const OPEN_EVENT = "open-public-profile-modal";

interface PublicProfileSummary {
  profile: Pick<
    Profile,
    "user_id" | "display_name" | "profile_image_url" | "trust_score" | "points" | "level" | "badges" | "created_at" | "role"
  >;
  approvedDealsCount: number;
  recentApprovedDeals: Deal[];
}

export function openPublicProfileModal(userId: string) {
  if (!userId || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { userId } }));
}

function getLevelLabel(level: number): string {
  return LEVEL_THRESHOLDS.find((l) => l.level === level)?.label ?? "Sessiz Takipçi";
}

export function PublicUserProfileModalHost() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PublicProfileSummary | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ userId?: string }>;
      const target = custom.detail?.userId ?? null;
      if (!target) return;
      setUserId(target);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, handler as EventListener);
    return () => window.removeEventListener(OPEN_EVENT, handler as EventListener);
  }, []);

  useEffect(() => {
    if (!open || !userId) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/users/${userId}/summary`, { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Profil yüklenemedi.");
        }
        return (await res.json()) as PublicProfileSummary;
      })
      .then((data) => {
        if (!active) return;
        setSummary(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setSummary(null);
        setError(err instanceof Error ? err.message : "Profil yüklenemedi.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, userId]);

  const badges = useMemo(() => summary?.profile.badges ?? [], [summary]);
  const displayName = summary?.profile.display_name ?? "İsimsiz";
  const initial = displayName.charAt(0)?.toUpperCase() || "U";
  const level = summary?.profile.level ?? 1;
  const trust = summary?.profile.trust_score ?? 0;
  const points = summary?.profile.points ?? 0;
  const approvedDealsCount = summary?.approvedDealsCount ?? 0;
  const recentDeals = summary?.recentApprovedDeals ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setLoading(false);
        }
      }}
    >
      <DialogContent className="max-w-[min(100vw-1.25rem,36rem)] rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="text-base">Profil</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 pt-3 max-h-[80vh] overflow-y-auto space-y-4">
          {loading && (
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && summary && (
            <>
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-4 text-white shadow-card">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 shrink-0 border-2 border-white/35 shadow-sm ring-2 ring-white/10">
                    <AvatarImage
                      src={summary.profile.profile_image_url ?? undefined}
                      alt={displayName}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-full bg-white/25 text-lg font-bold text-white">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-base font-bold truncate">{displayName}</p>
                    <p className="text-[11px] text-white/80">{getLevelLabel(level)}</p>
                  </div>
                  <Badge className="ml-auto bg-white/15 text-white border-white/25 text-[10px]">
                    {summary.profile.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card rounded-xl p-3 text-center border border-border/50">
                  <Star className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-sm font-bold">{trust}</p>
                  <p className="text-[10px] text-muted-foreground">Güven</p>
                </div>
                <div className="bg-card rounded-xl p-3 text-center border border-border/50">
                  <Award className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
                  <p className="text-sm font-bold">{points}</p>
                  <p className="text-[10px] text-muted-foreground">Puan</p>
                </div>
                <div className="bg-card rounded-xl p-3 text-center border border-border/50">
                  <Package className="h-4 w-4 text-violet-500 mx-auto mb-1" />
                  <p className="text-sm font-bold">{approvedDealsCount}</p>
                  <p className="text-[10px] text-muted-foreground">Onaylı Fırsat</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-bold">Rozetler</p>
                </div>
                {badges.length === 0 ? (
                  <div className="rounded-xl border border-border/50 bg-card p-3 text-xs text-muted-foreground">
                    Henüz rozet kazanılmadı.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {badges.map((id) => {
                      const info = BADGE_INFO[id as BadgeId];
                      if (!info) return null;
                      return (
                        <div key={id} className="rounded-xl border border-border/50 bg-card p-2.5 flex items-center gap-2">
                          <span className="text-lg">{info.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold truncate">{info.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{info.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-bold mb-2">Açtığı fırsatlar</p>
                {recentDeals.length === 0 ? (
                  <div className="rounded-xl border border-border/50 bg-card p-3 text-xs text-muted-foreground">
                    Onaylı fırsat bulunamadı.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentDeals.map((deal) => (
                      <Link
                        key={deal.id}
                        href={dealPath(deal)}
                        className="block rounded-xl border border-border/50 bg-card p-3 hover:bg-muted/40 transition"
                        onClick={() => setOpen(false)}
                      >
                        <p className="text-sm font-semibold line-clamp-1">{deal.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {deal.category || deal.provider}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

