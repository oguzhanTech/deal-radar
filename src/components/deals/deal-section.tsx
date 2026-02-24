"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DealCard } from "./deal-card";
import { DealCardSkeleton } from "./deal-card-skeleton";
import type { Deal } from "@/lib/types/database";

interface DealSectionProps {
  title: string;
  emoji?: string;
  deals: Deal[];
  loading?: boolean;
  seeAllHref?: string;
}

export function DealSection({ title, emoji, deals, loading, seeAllHref }: DealSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 8);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [deals, loading]);

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
            className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
          >
            See all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="relative">
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
            <p className="text-sm text-muted-foreground py-8">No deals found</p>
          )}
        </div>

        {/* Right-edge gradient fade to hint scrollability */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        )}
      </div>
    </section>
  );
}
