"use client";

import { useRef, useCallback } from "react";

const CACHE_TTL = 60_000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function useFeedCache<T>(key: string) {
  const cacheRef = useRef(memoryCache);

  const get = useCallback((): T | null => {
    const entry = cacheRef.current.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cacheRef.current.delete(key);
      return null;
    }
    return entry.data;
  }, [key]);

  const set = useCallback((data: T) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }, [key]);

  return { get, set };
}
