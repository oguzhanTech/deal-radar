import { Suspense } from "react";
import { HomeEmptyState } from "./home-content";
import {
  getHomePageDataCached,
  hasActiveHeroAnnouncementsCached,
  hasApprovedFutureDealCached,
  pickDesktopRailDeals,
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
import { HomeDesktopSidebar } from "@/components/home/home-desktop-sidebar";
import { HomeDesktopRail } from "@/components/home/home-desktop-rail";
import { HomeInfiniteBottomFeed } from "@/components/home/home-infinite-bottom-feed";
import { cn } from "@/lib/utils";

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

  const homeData = await getHomePageDataCached();
  const mixedRailDeals = pickDesktopRailDeals(homeData);

  const orderedSections = shuffle([...HOME_SECTIONS]);
  const sectionsWithoutLast = orderedSections.slice(0, -1);
  const lastSection = orderedSections[orderedSections.length - 1];
  const LastSectionComponent = lastSection.Section;

  const firstTwo = sectionsWithoutLast.slice(0, 2);
  const rest = sectionsWithoutLast.slice(2);
  const excludeIds = Array.from(
    new Set([
      ...homeData.heroDeals.map((d) => d.id),
      ...homeData.endingSoon.map((d) => d.id),
      ...homeData.popular.map((d) => d.id),
      ...homeData.newest.map((d) => d.id),
      ...homeData.trending.map((d) => d.id),
      ...homeData.biggestDrops.map((d) => d.id),
      ...homeData.couponDeals.map((d) => d.id),
      ...homeData.internationalDeals.map((d) => d.id),
      homeData.editorPick?.deal.id,
    ].filter(Boolean) as string[])
  );

  const showDesktopRail = !!homeData.editorPick || mixedRailDeals.length > 0;

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8 lg:items-start">
      <aside className="hidden lg:block lg:col-span-2 min-w-0 lg:pt-5 lg:border-r lg:border-border/40 lg:pr-5 xl:pr-6">
        <HomeDesktopSidebar />
      </aside>
      <div
        className={cn(
          "space-y-4 py-3 lg:py-5 min-w-0",
          showDesktopRail ? "lg:col-span-7" : "lg:col-span-10"
        )}
      >
      <HomeHero heroSlides={homeData.heroSlides} />
      {firstTwo.map(({ id, Section }) => (
        <Suspense key={id} fallback={<DealSectionSkeleton />}>
          <Section
            initialDeals={
              id === "newest"
                ? homeData.newest
                : id === "endingSoon"
                  ? homeData.endingSoon
                  : id === "trending"
                    ? homeData.trending
                    : id === "popular"
                      ? homeData.popular
                      : id === "biggestDrops"
                        ? homeData.biggestDrops
                        : id === "coupons"
                          ? homeData.couponDeals
                          : homeData.internationalDeals
            }
          />
        </Suspense>
      ))}
      <Suspense fallback={null}>
        <HomeActivitySection initialActivities={homeData.activities} />
      </Suspense>
      {rest.map(({ id, Section }) => (
        <Suspense key={id} fallback={<DealSectionSkeleton />}>
          <Section
            initialDeals={
              id === "newest"
                ? homeData.newest
                : id === "endingSoon"
                  ? homeData.endingSoon
                  : id === "trending"
                    ? homeData.trending
                    : id === "popular"
                      ? homeData.popular
                      : id === "biggestDrops"
                        ? homeData.biggestDrops
                        : id === "coupons"
                          ? homeData.couponDeals
                          : homeData.internationalDeals
            }
          />
        </Suspense>
      ))}
      <Suspense fallback={null}>
        <div className="lg:hidden">
          <HomeEditorPickSection initialResult={homeData.editorPick} />
        </div>
      </Suspense>
      <Suspense key={lastSection.id} fallback={<DealSectionSkeleton />}>
        <LastSectionComponent
          initialDeals={
            lastSection.id === "newest"
              ? homeData.newest
              : lastSection.id === "endingSoon"
                ? homeData.endingSoon
                : lastSection.id === "trending"
                  ? homeData.trending
                  : lastSection.id === "popular"
                    ? homeData.popular
                    : lastSection.id === "biggestDrops"
                      ? homeData.biggestDrops
                      : lastSection.id === "coupons"
                        ? homeData.couponDeals
                        : homeData.internationalDeals
          }
        />
      </Suspense>
      <HomeInfiniteBottomFeed excludeIds={excludeIds} />
      </div>
      {showDesktopRail ? (
        <aside className="hidden lg:block lg:col-span-3 min-w-0 max-w-full overflow-x-hidden lg:pt-5 lg:border-l lg:border-border/40 lg:pl-5 xl:pl-6">
          <HomeDesktopRail editorPick={homeData.editorPick} mixedDeals={mixedRailDeals} />
        </aside>
      ) : null}
    </div>
  );
}
