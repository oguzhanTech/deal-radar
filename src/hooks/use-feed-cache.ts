"use client";

import { useMemo, useCallback } from "react";

const CACHE_TTL = 60_000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function useFeedCache<T>(key: string) {
  const get = useCallback((): T | null => {
    const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      memoryCache.delete(key);
      return null;
    }
    return entry.data;
  }, [key]);

  const set = useCallback((data: T) => {
    memoryCache.set(key, { data, timestamp: Date.now() });
  }, [key]);

  return useMemo(() => ({ get, set }), [get, set]);
}
