"use client";

import { DealSection } from "@/components/deals/deal-section";
import { Badge } from "@/components/ui/badge";
import type { Deal } from "@/lib/types/database";

interface HomeContentProps {
  endingSoon: Deal[];
  popular: Deal[];
  newest: Deal[];
  isDemo?: boolean;
}

export function HomeContent({ endingSoon, popular, newest, isDemo }: HomeContentProps) {
  return (
    <div className="space-y-6 py-4">
      {isDemo && (
        <div className="mx-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-primary font-medium text-center">
            Showing demo data. Set up your Supabase tables and seed data to see real deals.
          </p>
        </div>
      )}

      <DealSection
        title="Ending Soon"
        deals={endingSoon}
        seeAllHref="/search?sort=ending"
      />

      <DealSection
        title="Popular"
        deals={popular}
        seeAllHref="/search?sort=popular"
      />

      <DealSection
        title="New Deals"
        deals={newest}
        seeAllHref="/search?sort=new"
      />
    </div>
  );
}
