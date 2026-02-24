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
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        isTrending ? "text-orange-500" : "text-muted-foreground",
        className
      )}
    >
      <Flame className={cn("h-3.5 w-3.5", isTrending && "fill-orange-500")} />
      {isTrending ? "Trending" : Math.round(score)}
    </span>
  );
}
