import { Suspense } from "react";
import dynamic from "next/dynamic";
import { HomeEmptyState } from "./home-content";
import {
  getHomePageCriticalDataCached,
  hasActiveHeroAnnouncementsCached,
  hasApprovedFutureDealCached,
  HomeTrendingSection,
  HomeEndingSoonSection,
  HomePopularSection,
  HomeNewestSection,
  HomeBiggestDropsSection,
  HomeCouponSection,
  HomeInternationalSection,
  HomeActivitySection,
  HomeEditorPickSection,
  HomeDesktopRailSection,
} from "./home-sections";
import { HomeHero } from "./home-hero";
import { DealSectionSkeleton } from "@/components/deals/deal-card-skeleton";
import { HomeDesktopSidebar } from "@/components/home/home-desktop-sidebar";
import { FirsatCiniWidget } from "@/components/home/firsat-cini-widget";
import { cn } from "@/lib/utils";

const HomeInfiniteBottomFeed = dynamic(
  () =>
    import("@/components/home/home-infinite-bottom-feed").then(
      (m) => m.HomeInfiniteBottomFeed
    ),
  { loading: () => null }
);

export const revalidate = 60;

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
  const [hasDeal, hasAnnouncements] = await Promise.all([
    hasApprovedFutureDealCached(),
    hasActiveHeroAnnouncementsCached(),
  ]);

  if (!hasDeal && !hasAnnouncements) {
    return (
      <div className="space-y-4 py-3">
        <HomeEmptyState />
      </div>
    );
  }

  const homeData = await getHomePageCriticalDataCached();
  const firstTwo = HOME_SECTIONS.slice(0, 1);
  const rest = HOME_SECTIONS.slice(1);
  const excludeIds = Array.from(
    new Set([
      ...homeData.heroDeals.map((d) => d.id),
      ...homeData.endingSoon.map((d) => d.id),
      ...homeData.popular.map((d) => d.id),
      ...homeData.newest.map((d) => d.id),
    ].filter(Boolean) as string[])
  );
  const firsatCiniDeals = [...homeData.newest, ...homeData.popular, ...homeData.endingSoon];

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8 lg:items-start">
      <aside className="hidden lg:block lg:col-span-2 min-w-0 lg:pt-5 lg:border-r lg:border-border/40 lg:pr-5 xl:pr-6">
        <HomeDesktopSidebar firsatCiniDeals={firsatCiniDeals} />
      </aside>
      <div
        className={cn(
          "space-y-4 py-3 lg:py-5 min-w-0",
          "lg:col-span-7"
        )}
      >
        <HomeHero heroSlides={homeData.heroSlides} />
        {firstTwo.map(({ id, Section }) => (
          <Suspense key={id} fallback={<DealSectionSkeleton />}>
            <Section
              initialDeals={
                id === "newest" ? homeData.newest : homeData.endingSoon
              }
            />
          </Suspense>
        ))}
        <Suspense fallback={<DealSectionSkeleton />}>
          <HomeActivitySection />
        </Suspense>
        <div id="firsat-cini" className="lg:hidden">
          <FirsatCiniWidget deals={firsatCiniDeals} />
        </div>
        {rest.map(({ id, Section }) => (
          <Suspense key={id} fallback={<DealSectionSkeleton />}>
            <Section />
          </Suspense>
        ))}
        <Suspense fallback={<DealSectionSkeleton />}>
          <div className="lg:hidden">
            <HomeEditorPickSection />
          </div>
        </Suspense>
        <HomeInfiniteBottomFeed excludeIds={excludeIds} />
      </div>
      <aside className="hidden lg:block lg:col-span-3 min-w-0 max-w-full overflow-x-hidden lg:pt-5 lg:border-l lg:border-border/40 lg:pl-5 xl:pl-6">
        <Suspense fallback={null}>
          <HomeDesktopRailSection />
        </Suspense>
      </aside>
    </div>
  );
}
