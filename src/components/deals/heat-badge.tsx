"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEAT_TRENDING_THRESHOLD } from "@/lib/constants";

interface HeatBadgeProps {
  score: number;
  className?: string;
}

export function HeatBadge({ score, className }: HeatBadgeProps) {
  const isTrending = score >= HEAT_TRENDING_THRESHOLD;

  if (score <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-bold rounded-full px-2 py-0.5 transition-all",
        isTrending
          ? "bg-orange-100 text-orange-600 shadow-sm shadow-orange-200/60"
          : "text-muted-foreground",
        className
      )}
    >
      <Flame className={cn("h-3 w-3", isTrending && "fill-orange-500 text-orange-500 drop-shadow-sm")} />
      {isTrending ? "Trending" : Math.round(score)}
    </span>
  );
}
