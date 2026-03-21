"use client";

type PrefetchRouter = {
  prefetch: (href: string) => void;
};

const PREFETCH_TTL_MS = 45_000;
const prefetchedAt = new Map<string, number>();

export function prefetchOnce(router: PrefetchRouter, href: string) {
  const now = Date.now();
  const last = prefetchedAt.get(href) ?? 0;
  if (now - last < PREFETCH_TTL_MS) return;
  prefetchedAt.set(href, now);
  router.prefetch(href);
}
