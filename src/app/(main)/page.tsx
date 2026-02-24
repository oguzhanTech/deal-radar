"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { HomeContent } from "./home-content";
import { getDemoEndingSoon, getDemoPopular, getDemoNewest, getDemoTrending } from "@/lib/demo-data";
import { DealSectionSkeleton } from "@/components/deals/deal-card-skeleton";
import { useFeedCache } from "@/hooks/use-feed-cache";
import type { Deal } from "@/lib/types/database";

interface FeedData {
  endingSoon: Deal[];
  popular: Deal[];
  newest: Deal[];
  trending: Deal[];
  isDemo: boolean;
}

function HomeSkeleton() {
  return (
    <div className="space-y-6 py-5">
      <DealSectionSkeleton />
      <DealSectionSkeleton />
      <DealSectionSkeleton />
    </div>
  );
}

export default function HomePage() {
  const supabase = useMemo(() => createClient(), []);
  const cache = useFeedCache<FeedData>("home-feed");
  const [feed, setFeed] = useState<FeedData | null>(() => cache.get());
  const [loading, setLoading] = useState(!feed);

  const fetchFeed = useCallback(async () => {
    try {
      const [endingSoon, popular, newest, trending] = await Promise.all([
        supabase
          .from("deals")
          .select("*")
          .eq("status", "approved")
          .gt("end_at", new Date().toISOString())
          .order("end_at", { ascending: true })
          .limit(10),
        supabase
          .from("deals")
          .select("*")
          .eq("status", "approved")
          .gt("end_at", new Date().toISOString())
          .order("heat_score", { ascending: false })
          .limit(10),
        supabase
          .from("deals")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("deals")
          .select("*")
          .eq("status", "approved")
          .gt("end_at", new Date().toISOString())
          .gte("heat_score", 20)
          .order("heat_score", { ascending: false })
          .limit(8),
      ]);

      const es = endingSoon.data ?? [];
      const pop = popular.data ?? [];
      const nw = newest.data ?? [];
      const tr = trending.data ?? [];
      const useDemo = es.length === 0 && pop.length === 0 && nw.length === 0;

      const data: FeedData = {
        endingSoon: useDemo ? getDemoEndingSoon() : es,
        popular: useDemo ? getDemoPopular() : pop,
        newest: useDemo ? getDemoNewest() : nw,
        trending: useDemo ? getDemoTrending() : tr,
        isDemo: useDemo,
      };

      cache.set(data);
      setFeed(data);
    } catch {
      const data: FeedData = {
        endingSoon: getDemoEndingSoon(),
        popular: getDemoPopular(),
        newest: getDemoNewest(),
        trending: getDemoTrending(),
        isDemo: true,
      };
      setFeed(data);
    }
    setLoading(false);
  }, [supabase, cache]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  if (loading && !feed) return <HomeSkeleton />;

  if (!feed) return <HomeSkeleton />;

  return (
    <HomeContent
      endingSoon={feed.endingSoon}
      popular={feed.popular}
      newest={feed.newest}
      trending={feed.trending}
      isDemo={feed.isDemo}
    />
  );
}
