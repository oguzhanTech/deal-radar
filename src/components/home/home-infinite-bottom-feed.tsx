"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DealCard } from "@/components/deals/deal-card";
import { DealCardSkeleton } from "@/components/deals/deal-card-skeleton";
import type { Deal } from "@/lib/types/database";

interface HomeInfiniteBottomFeedProps {
  excludeIds?: string[];
}

interface FeedResponse {
  items: Deal[];
  hasMore: boolean;
  nextOffset: number;
}

const PAGE_SIZE = 12;

export function HomeInfiniteBottomFeed({ excludeIds = [] }: HomeInfiniteBottomFeedProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [items, setItems] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activationRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const seenIdsRef = useRef(new Set<string>());

  const excludeKey = useMemo(() => excludeIds.join(","), [excludeIds]);

  const loadPage = useCallback(async () => {
    if (!isEnabled || loading || !hasMore) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        feed: "home",
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (excludeKey) params.set("excludeIds", excludeKey);

      const res = await fetch(`/api/deals?${params.toString()}`);
      const json = (await res.json()) as FeedResponse | Deal[];

      let nextItems: Deal[] = [];
      let nextHasMore = false;
      let nextOffset = offset;

      if (Array.isArray(json)) {
        nextItems = json;
        nextHasMore = json.length === PAGE_SIZE;
        nextOffset = offset + json.length;
      } else {
        nextItems = Array.isArray(json.items) ? json.items : [];
        nextHasMore = !!json.hasMore;
        nextOffset = Number.isFinite(json.nextOffset) ? json.nextOffset : offset + nextItems.length;
      }

      const deduped = nextItems.filter((deal) => {
        if (!deal?.id || seenIdsRef.current.has(deal.id)) return false;
        seenIdsRef.current.add(deal.id);
        return true;
      });

      setItems((prev) => [...prev, ...deduped]);
      setOffset(nextOffset);
      setHasMore(nextHasMore);
    } catch {
      setError("Daha fazla fÄ±rsat yÃ¼klenemedi.");
    } finally {
      setLoading(false);
    }
  }, [excludeKey, hasMore, isEnabled, loading, offset]);

  useEffect(() => {
    if (!activationRef.current || isEnabled) return;
    const node = activationRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsEnabled(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "0px 0px 280px 0px", threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled || items.length > 0) return;
    void loadPage();
  }, [isEnabled, items.length, loadPage]);

  useEffect(() => {
    if (!isEnabled || !loadMoreRef.current || loading || !hasMore) return;
    const node = loadMoreRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadPage();
      },
      { root: null, rootMargin: "0px 0px 320px 0px", threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isEnabled, loadPage, loading]);

  return (
    <section className="px-4 pt-2 pb-4">
      {!isEnabled ? <div ref={activationRef} className="h-6" /> : null}

      {isEnabled && (items.length > 0 || loading || error) ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-sm font-semibold text-foreground">Senin için daha fazla fırsat</p>
          </div>

          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-2">
            {items.map((deal) => (
              <DealCard key={deal.id} deal={deal} compact surface="feed" />
            ))}
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <DealCardSkeleton key={`feed-skeleton-${index}`} compact surface="feed" />
                ))
              : null}
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs text-destructive mb-2">{error}</p>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => void loadPage()}
              >
                Tekrar dene
              </button>
            </div>
          ) : null}

          {hasMore ? <div ref={loadMoreRef} className="h-8" /> : null}
        </div>
      ) : null}
    </section>
  );
}

