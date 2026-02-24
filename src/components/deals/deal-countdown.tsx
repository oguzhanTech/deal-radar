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
      <span className={cn("text-muted-foreground text-sm font-medium", className)}>
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

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
        isVeryUrgent && "text-red-500 animate-pulse",
        isUrgent && !isVeryUrgent && "text-orange-500",
        !isUrgent && "text-foreground",
        className
      )}
    >
      {isUrgent ? (
        <AlertTriangle className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      {timeString}
    </span>
  );
}
