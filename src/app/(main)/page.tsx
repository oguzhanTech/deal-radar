import { Suspense } from "react";
import { createAnonClient } from "@/lib/supabase/server";
import { HomeEmptyState } from "./home-content";
import {
  HomeTrendingSection,
  HomeEndingSoonSection,
  HomePopularSection,
  HomeNewestSection,
} from "./home-sections";
import { HomeHero } from "./home-hero";
import { DealSectionSkeleton } from "@/components/deals/deal-card-skeleton";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createAnonClient();
  const { data: hasDeals } = await supabase
    .from("deals")
    .select("id")
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (!hasDeals) {
    return (
      <div className="space-y-4 py-4">
        <HomeEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <Suspense fallback={null}>
        <HomeHero />
      </Suspense>
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
    </div>
  );
}
