"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { DealCard } from "./deal-card";
import { DealCardSkeleton } from "./deal-card-skeleton";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";

interface DealSectionProps {
  title: string;
  emoji?: string;
  deals: Deal[];
  loading?: boolean;
  seeAllHref?: string;
}

export function DealSection({ title, emoji, deals, loading, seeAllHref }: DealSectionProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 8;
    setCanScrollLeft(el.scrollLeft > threshold);
    setCanScrollRight(el.scrollWidth > el.clientWidth + el.scrollLeft + threshold);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [deals, loading, updateScrollState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "right" ? step : -step, behavior: "smooth" });
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-extrabold flex items-center gap-1.5">
          {emoji && <span className="text-base">{emoji}</span>}
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            prefetch
            onMouseEnter={() => router.prefetch(seeAllHref)}
            onTouchStart={() => router.prefetch(seeAllHref)}
            className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
          >
            {t("common.seeAll")}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="relative group/section">
        {/* Masaüstü: sol ok */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label={t("common.previous")}
            className="absolute left-0 top-0 bottom-1 z-10 hidden md:flex items-center justify-center w-10 bg-gradient-to-r from-background/95 to-transparent hover:from-background text-foreground rounded-r-lg transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {/* Masaüstü: sağ ok */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label={t("common.next")}
            className="absolute right-0 top-0 bottom-1 z-10 hidden md:flex items-center justify-center w-10 bg-gradient-to-l from-background/95 to-transparent hover:from-background text-foreground rounded-l-lg transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-4 snap-x snap-mandatory scrollbar-hide pb-1"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x", willChange: "scroll-position" }}
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <DealCardSkeleton key={i} horizontal />
              ))
            : deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} horizontal />
              ))}
          {!loading && deals.length === 0 && (
            <p className="text-sm text-muted-foreground py-8">{t("search.empty")}</p>
          )}
        </div>

        {/* Mobil: sağda gradient (sadece görsel) */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
        )}
      </div>
    </section>
  );
}
