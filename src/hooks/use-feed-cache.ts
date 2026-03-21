"use client";

import { useMemo, useCallback } from "react";

const CACHE_TTL = 60_000;
const STORAGE_PREFIX = "feed-cache:";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface FeedCacheOptions {
  ttlMs?: number;
  persist?: "memory" | "session";
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

/** Radarım listesinin bir sonraki açılışta yeniden fetch edilmesi için save/unsave sonrası çağrılır */
export function invalidateFeedCache(key: string): void {
  memoryCache.delete(key);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {
      // ignore
    }
  }
}

export function clearFeedCacheByPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
  if (typeof window !== "undefined") {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const storageKey = sessionStorage.key(i);
        if (!storageKey) continue;
        if (storageKey.startsWith(STORAGE_PREFIX) && storageKey.slice(STORAGE_PREFIX.length).startsWith(prefix)) {
          sessionStorage.removeItem(storageKey);
        }
      }
    } catch {
      // ignore
    }
  }
}

export function useFeedCache<T>(key: string, options?: FeedCacheOptions) {
  const ttlMs = options?.ttlMs ?? CACHE_TTL;
  const persist = options?.persist ?? "session";

  const get = useCallback((): T | null => {
    const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (entry) {
      if (Date.now() - entry.timestamp > ttlMs) {
        memoryCache.delete(key);
      } else {
        return entry.data;
      }
    }

    if (persist !== "session" || typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEntry<T>;
      if (!parsed?.timestamp || Date.now() - parsed.timestamp > ttlMs) {
        sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        return null;
      }
      memoryCache.set(key, parsed);
      return parsed.data;
    } catch {
      return null;
    }
  }, [key, ttlMs, persist]);

  const set = useCallback((data: T) => {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);
    if (persist === "session" && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
      } catch {
        // ignore
      }
    }
  }, [key, persist]);

  return useMemo(() => ({ get, set }), [get, set]);
}
