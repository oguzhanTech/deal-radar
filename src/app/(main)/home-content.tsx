"use client";

import Link from "next/link";
import { DealSection } from "@/components/deals/deal-section";
import { Trophy, ChevronRight, PlusCircle } from "lucide-react";
import { RadarBuddy } from "@/components/mascot/radar-buddy";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";

interface HomeContentProps {
  endingSoon: Deal[];
  popular: Deal[];
  newest: Deal[];
  trending: Deal[];
}

export function HomeContent({ endingSoon, popular, newest, trending }: HomeContentProps) {
  const isEmpty = endingSoon.length === 0 && popular.length === 0 && newest.length === 0 && trending.length === 0;

  return (
    <div className="space-y-6 py-5">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <RadarBuddy size="lg" mood="thinking" className="mb-4" />
          <h2 className="text-lg font-bold mb-1">{t("home.emptyTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("home.emptyState")}</p>
          <Link
            href="/create"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
          >
            <PlusCircle className="h-4 w-4" />
            {t("nav.create")}
          </Link>
        </div>
      ) : (
        <>
          {trending.length > 0 && (
            <DealSection
              title={t("home.trending")}
              emoji="🔥"
              deals={trending}
              seeAllHref="/search?sort=trending"
            />
          )}

          {endingSoon.length > 0 && (
            <DealSection
              title={t("home.endingSoon")}
              emoji="⏰"
              deals={endingSoon}
              seeAllHref="/search?sort=popular"
            />
          )}

          {popular.length > 0 && (
            <DealSection
              title={t("home.popular")}
              emoji="💎"
              deals={popular}
              seeAllHref="/search?sort=popular"
            />
          )}

          {newest.length > 0 && (
            <DealSection
              title={t("home.newDeals")}
              emoji="✨"
              deals={newest}
              seeAllHref="/search?sort=new"
            />
          )}
        </>
      )}

      <div className="px-4">
        <Link
          href="/leaderboard"
          prefetch={true}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 shadow-card hover:shadow-card-hover transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{t("home.leaderboardTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("home.leaderboardDesc")}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
