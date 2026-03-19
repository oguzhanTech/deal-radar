"use client";

import { useState, useEffect, useCallback } from "react";
import { useFeedCache } from "@/hooks/use-feed-cache";
import { t } from "@/lib/i18n";
import { Trophy, PlusCircle, Crown, Medal, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { openPublicProfileModal } from "@/components/profile/public-user-profile-modal";

interface LeaderboardProfile {
  id: string;
  display_name: string | null;
  deal_count: number;
}

function getInitial(name: string | null) {
  return (name || "?").charAt(0).toUpperCase();
}

const RANK_STYLES = [
  "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-300/30",
  "bg-gradient-to-r from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-300/20",
  "bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg shadow-orange-400/20",
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5" />;
  if (rank === 2) return <Medal className="h-5 w-5" />;
  if (rank === 3) return <Award className="h-5 w-5" />;
  return <span className="text-sm font-bold">{rank}</span>;
}

interface LeaderboardData {
  profiles: LeaderboardProfile[];
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const cache = useFeedCache<LeaderboardData>("leaderboard-deals");
  const [data, setData] = useState<LeaderboardData | null>(() => cache.get());
  const [loading, setLoading] = useState(!data);

  const fetchData = useCallback(async () => {
    const cached = cache.get();
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/leaderboard");
      const profiles = (await res.json()) as LeaderboardProfile[];
      const result: LeaderboardData = { profiles: Array.isArray(profiles) ? profiles : [] };
      cache.set(result);
      setData(result);
    } catch {
      setData({ profiles: [] });
    }
    setLoading(false);
  }, [cache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const profiles = data?.profiles ?? [];

  return (
    <div className="py-5 px-4 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{t("leaderboard.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("leaderboard.subtitle")}</p>
        </div>
      </div>

      {loading && !data ? (
        <LeaderboardSkeleton />
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">{t("leaderboard.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all cursor-pointer ${
                  isTop3
                    ? `${RANK_STYLES[rank - 1]} hover:brightness-105`
                    : "bg-card border border-border/40 shadow-card hover:bg-muted/40"
                }`}
                role="button"
                tabIndex={0}
                onClick={() => openPublicProfileModal(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPublicProfileModal(p.id);
                  }
                }}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isTop3 ? "bg-white/20" : "bg-muted"
                  }`}
                >
                  <RankIcon rank={rank} />
                </div>

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isTop3
                      ? "bg-white/25 text-white"
                      : "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600"
                  }`}
                >
                  {getInitial(p.display_name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isTop3 ? "text-white" : ""}`}>
                    {p.display_name || t("profile.anonymous")}
                  </p>
                  <p className={`text-xs ${isTop3 ? "text-white/70" : "text-muted-foreground"}`}>
                    {p.deal_count} {t("leaderboard.deals")}
                  </p>
                </div>

                <div className={`flex items-center gap-1 flex-shrink-0 ${isTop3 ? "" : "text-amber-600"}`}>
                  <PlusCircle className={`h-3.5 w-3.5 ${isTop3 ? "text-white/80" : ""}`} />
                  <span className={`text-sm font-extrabold ${isTop3 ? "text-white" : ""}`}>
                    {p.deal_count.toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
