import { Suspense } from "react";
import { createAnonClient } from "@/lib/supabase/server";
import { HomeEmptyState } from "./home-content";
import {
  HomeTrendingSection,
  HomeEndingSoonSection,
  HomePopularSection,
  HomeNewestSection,
  HomeBiggestDropsSection,
  HomeCouponSection,
  HomeInternationalSection,
  HomeActivitySection,
  HomeEditorPickSection,
} from "./home-sections";
import { HomeHero } from "./home-hero";
import { DealSectionSkeleton } from "@/components/deals/deal-card-skeleton";

export const revalidate = 60;

/** Fisher–Yates shuffle; her sayfa yüklemesinde bölüm sırası rastgele olur */
function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const HOME_SECTIONS = [
  { id: "newest", Section: HomeNewestSection },
  { id: "endingSoon", Section: HomeEndingSoonSection },
  { id: "trending", Section: HomeTrendingSection },
  { id: "popular", Section: HomePopularSection },
  { id: "biggestDrops", Section: HomeBiggestDropsSection },
  { id: "coupons", Section: HomeCouponSection },
  { id: "international", Section: HomeInternationalSection },
] as const;

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
      <div className="space-y-4 py-3">
        <HomeEmptyState />
      </div>
    );
  }

  const orderedSections = shuffle([...HOME_SECTIONS]);
  const sectionsWithoutLast = orderedSections.slice(0, -1);
  const lastSection = orderedSections[orderedSections.length - 1];
  const LastSectionComponent = lastSection.Section;

  const firstTwo = sectionsWithoutLast.slice(0, 2);
  const rest = sectionsWithoutLast.slice(2);

  return (
    <div className="space-y-4 py-3">
      <Suspense fallback={null}>
        <HomeHero />
      </Suspense>
      {firstTwo.map(({ id, Section }) => (
        <Suspense key={id} fallback={<DealSectionSkeleton />}>
          <Section />
        </Suspense>
      ))}
      <Suspense fallback={null}>
        <HomeActivitySection />
      </Suspense>
      {rest.map(({ id, Section }) => (
        <Suspense key={id} fallback={<DealSectionSkeleton />}>
          <Section />
        </Suspense>
      ))}
      <Suspense fallback={null}>
        <HomeEditorPickSection />
      </Suspense>
      <Suspense key={lastSection.id} fallback={<DealSectionSkeleton />}>
        <LastSectionComponent />
      </Suspense>
    </div>
  );
}
