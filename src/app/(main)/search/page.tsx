"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RadarBuddy } from "@/components/mascot/radar-buddy";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DealCard } from "@/components/deals/deal-card";
import { DealCardSkeleton } from "@/components/deals/deal-card-skeleton";
import { DEAL_CATEGORIES } from "@/lib/constants";
import { useFeedCache } from "@/hooks/use-feed-cache";
import { useIsLgUp } from "@/hooks/use-is-lg";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type SortOption = "trending" | "popular" | "new" | "discount" | "endingSoon";

const gridClass =
  "grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-3";

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLg = useIsLgUp();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "new"
  );
  const [filterCategory, setFilterCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [filterCoupon, setFilterCoupon] = useState<boolean>(
    searchParams.get("hasCoupon") === "1"
  );
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const tr = query.trim();
      const urlQ = searchParams.get("q") ?? "";
      if (tr === urlQ) return;

      const p = new URLSearchParams(searchParams.toString());
      if (tr) p.set("q", tr);
      else p.delete("q");
      const qs = p.toString();
      const nextUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 400);
    return () => window.clearTimeout(id);
  }, [query, pathname, router, searchParams]);

  const cacheKey = `search:${query}:${sort}:${filterCategory ?? ""}:${filterCoupon ? "coupon" : ""}`;
  const cache = useFeedCache<Deal[]>(cacheKey, { ttlMs: 60_000, persist: "session" });
  const [deals, setDeals] = useState<Deal[]>(() => cache.get() ?? []);
  const [loading, setLoading] = useState(!cache.get());

  const fetchDeals = useCallback(async () => {
    const cached = cache.get();
    if (cached) {
      setDeals(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({ sort });
      if (query.trim()) params.set("q", query.trim());
      if (filterCategory) params.set("category", filterCategory);
      if (filterCoupon) params.set("hasCoupon", "1");
      const res = await fetch(`/api/deals?${params}`);
      const result = (await res.json()) as Deal[];
      cache.set(result ?? []);
      setDeals(result ?? []);
    } catch {
      setDeals([]);
    }
    setLoading(false);
  }, [query, sort, filterCategory, filterCoupon, cache]);

  useEffect(() => {
    const timer = setTimeout(fetchDeals, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchDeals, query]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "trending", label: t("search.sortTrending") },
    { value: "popular", label: t("search.sortPopular") },
    { value: "new", label: t("search.sortNew") },
    { value: "discount", label: t("search.sortDiscount") },
    { value: "endingSoon", label: t("search.sortEndingSoon") },
  ];

  const clearFilters = () => {
    setFilterCategory(null);
    setFilterCoupon(false);
  };

  const hasActiveFilters = !!filterCategory || filterCoupon;

  return (
    <div className="space-y-4 py-4">
      <div className="px-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSort(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition cursor-pointer ${
                  sort === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition cursor-pointer ${
              showFilters || hasActiveFilters
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("search.filterCategory")}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{t("search.filterCategory")}</p>
              <div className="flex flex-wrap gap-1.5">
                {DEAL_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilterCategory(filterCategory === c ? null : c)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-full transition cursor-pointer ${
                      filterCategory === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="text-xs text-primary font-medium cursor-pointer">
                  {t("search.clearFilters")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterCoupon((v) => !v)}
                className={`px-2 py-1 text-[11px] font-medium rounded-full border transition cursor-pointer ${
                  filterCoupon ? "bg-violet-600 text-white border-violet-600" : "bg-background text-foreground"
                }`}
              >
                🎟️ {t("search.filterCoupon")}
              </button>
            </div>
          </div>
        )}
      </div>

      {hasActiveFilters && !showFilters && (
        <div className="flex gap-1.5 px-4 flex-wrap">
          {filterCategory && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterCategory(null)}>
              {filterCategory} <X className="h-3 w-3" />
            </Badge>
          )}
          {filterCoupon && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setFilterCoupon(false)}
            >
              🎟️ {t("search.filterCoupon")} <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      <div className="px-4">
        {loading ? (
          <div className={cn(gridClass)}>
            {Array.from({ length: 8 }).map((_, i) => (
              <DealCardSkeleton key={i} compact={isLg} />
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-12">
            <RadarBuddy size="md" mood="thinking" message={t("search.empty")} className="mb-3" />
            <p className="text-sm text-muted-foreground mt-1">{t("search.emptyDesc")}</p>
          </div>
        ) : (
          <div className={gridClass}>
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                compact={isLg}
                hideCreator
                hideCountdownStatusLabel
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
