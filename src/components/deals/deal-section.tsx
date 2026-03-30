"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { DealCard } from "./deal-card";
import { DealCardSkeleton } from "./deal-card-skeleton";
import { useIsLgUp } from "@/hooks/use-is-lg";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/types/database";

const HOME_MAX_ITEMS_MOBILE = 5;
const HOME_MAX_ITEMS_DESKTOP = 8;

interface DealSectionProps {
  title: string;
  emoji?: string;
  deals: Deal[];
  loading?: boolean;
  seeAllHref?: string;
  /** true = alt alta küçük widget, false = eski yatay kaydırma (kullanılmıyor) */
  vertical?: boolean;
}

export function DealSection({
  title,
  emoji,
  deals,
  loading,
  seeAllHref,
  vertical = true,
}: DealSectionProps) {
  const router = useRouter();
  const isLg = useIsLgUp();
  const maxItems = isLg ? HOME_MAX_ITEMS_DESKTOP : HOME_MAX_ITEMS_MOBILE;
  const displayDeals = vertical ? deals.slice(0, maxItems) : deals;
  const skeletonCount = Math.min(maxItems, 8);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-base font-extrabold flex items-center gap-1.5">
          {emoji && <span className="text-sm">{emoji}</span>}
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            prefetch
            onMouseEnter={() => router.prefetch(seeAllHref!)}
            onTouchStart={() => router.prefetch(seeAllHref!)}
            className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
          >
            {t("common.seeAll")}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className={cn("px-4 space-y-2", vertical && "lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-2 lg:space-y-0 xl:grid-cols-2")}>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <DealCardSkeleton key={i} compact={vertical} />
            ))
          : displayDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} compact={vertical} />
            ))}
        {!loading && displayDeals.length === 0 && (
          <p className="text-sm text-muted-foreground py-6">{t("search.empty")}</p>
        )}
      </div>
    </section>
  );
}
