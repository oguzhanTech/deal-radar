import { Suspense } from "react";
import { createReadOnlyClient } from "@/lib/supabase/server";
import { HomeEmptyState, HomeLeaderboardLink } from "./home-content";
import {
  HomeTrendingSection,
  HomeEndingSoonSection,
  HomePopularSection,
  HomeNewestSection,
} from "./home-sections";
import { DealSectionSkeleton } from "@/components/deals/deal-card-skeleton";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createReadOnlyClient();
  const { data: hasDeals } = await supabase
    .from("deals")
    .select("id")
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (!hasDeals) {
    return (
      <div className="space-y-6 py-5">
        <HomeEmptyState />
        <HomeLeaderboardLink />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-5">
      <Suspense fallback={<DealSectionSkeleton />}>
        <HomeTrendingSection />
      </Suspense>
      <Suspense fallback={<DealSectionSkeleton />}>
        <HomeEndingSoonSection />
      </Suspense>
      <Suspense fallback={<DealSectionSkeleton />}>
        <HomePopularSection />
      </Suspense>
      <Suspense fallback={<DealSectionSkeleton />}>
        <HomeNewestSection />
      </Suspense>
      <HomeLeaderboardLink />
    </div>
  );
}
