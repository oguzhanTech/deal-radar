"use client";

import { useState, useEffect } from "react";
import { getTimeRemaining } from "@/lib/utils";

export function useCountdown(endAt: string) {
  const [time, setTime] = useState(() => getTimeRemaining(endAt));

  useEffect(() => {
    if (time.total <= 0) return;

    const interval = setInterval(() => {
      const remaining = getTimeRemaining(endAt);
      setTime(remaining);
      if (remaining.total <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endAt, time.total]);

  const isExpired = time.total <= 0;
  const isUrgent = time.total > 0 && time.total <= 6 * 60 * 60 * 1000; // < 6 hours
  const isVeryUrgent = time.total > 0 && time.total <= 60 * 60 * 1000; // < 1 hour

  return { ...time, isExpired, isUrgent, isVeryUrgent };
}
