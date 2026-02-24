"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DealCard } from "./deal-card";
import { DealCardSkeleton } from "./deal-card-skeleton";
import type { Deal } from "@/lib/types/database";

interface DealSectionProps {
  title: string;
  deals: Deal[];
  loading?: boolean;
  seeAllHref?: string;
}

export function DealSection({ title, deals, loading, seeAllHref }: DealSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-sm text-primary font-medium flex items-center gap-0.5"
          >
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 snap-x snap-mandatory scrollbar-hide">
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
    </section>
  );
}
