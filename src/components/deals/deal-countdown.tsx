"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

interface DealCountdownProps {
  endAt: string;
  compact?: boolean;
  className?: string;
}

export function DealCountdown({ endAt, compact = false, className }: DealCountdownProps) {
  const { days, hours, minutes, seconds, isExpired, isUrgent, isVeryUrgent } = useCountdown(endAt);

  if (isExpired) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted rounded-full px-2.5 py-1", className)}>
        Expired
      </span>
    );
  }

  const timeString = compact
    ? days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m ${seconds}s`
    : `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const label = isVeryUrgent ? "Ending now" : isUrgent ? "Ending soon" : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold tabular-nums rounded-full px-3 py-1.5 shadow-sm",
        isVeryUrgent && "bg-red-100 text-red-700 animate-pulse shadow-red-200/50",
        isUrgent && !isVeryUrgent && "bg-orange-100 text-orange-700 shadow-orange-200/50",
        !isUrgent && "bg-stone-100 text-stone-700",
        className
      )}
    >
      {isUrgent ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {label && <span className="mr-0.5">{label} ·</span>}
      {timeString}
    </span>
  );
}
