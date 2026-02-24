"use client";

import Link from "next/link";
import { DealSection } from "@/components/deals/deal-section";
import { Trophy, ChevronRight } from "lucide-react";
import type { Deal } from "@/lib/types/database";

interface HomeContentProps {
  endingSoon: Deal[];
  popular: Deal[];
  newest: Deal[];
  trending: Deal[];
  isDemo?: boolean;
}

export function HomeContent({ endingSoon, popular, newest, trending, isDemo }: HomeContentProps) {
  return (
    <div className="space-y-6 py-5">
      {isDemo && (
        <div className="mx-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">
          <p className="text-xs text-indigo-600 font-semibold text-center">
            Showing demo data — set up Supabase to see real deals
          </p>
        </div>
      )}

      {trending.length > 0 && (
        <DealSection
          title="Trending Now"
          emoji="🔥"
          deals={trending}
          seeAllHref="/search?sort=popular"
        />
      )}

      <DealSection
        title="Ending Soon"
        emoji="⏰"
        deals={endingSoon}
        seeAllHref="/search?sort=ending"
      />

      <DealSection
        title="Popular"
        emoji="💎"
        deals={popular}
        seeAllHref="/search?sort=popular"
      />

      <DealSection
        title="New Deals"
        emoji="✨"
        deals={newest}
        seeAllHref="/search?sort=new"
      />

      {/* Leaderboard Banner */}
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
            <p className="text-sm font-bold text-foreground">Top Deal Hunters</p>
            <p className="text-xs text-muted-foreground">See who&apos;s finding the best deals</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
