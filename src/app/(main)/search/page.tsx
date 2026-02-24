"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { RadarBuddy } from "@/components/mascot/radar-buddy";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DealCard } from "@/components/deals/deal-card";
import { DealCardSkeleton } from "@/components/deals/deal-card-skeleton";
import { createClient } from "@/lib/supabase/client";
import { PROVIDERS, COUNTRIES } from "@/lib/constants";
import { DEMO_DEALS } from "@/lib/demo-data";
import type { Deal } from "@/lib/types/database";
import { useSearchParams } from "next/navigation";

type SortOption = "ending" | "popular" | "new";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-4 py-8 space-y-3">{Array.from({ length: 4 }).map((_, i) => <DealCardSkeleton key={i} />)}</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "ending"
  );
  const [filterCountry, setFilterCountry] = useState<string | null>(null);
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase
        .from("deals")
        .select("*")
        .eq("status", "approved")
        .gt("end_at", new Date().toISOString());

      if (query.trim()) {
        q = q.or(`title.ilike.%${query}%,provider.ilike.%${query}%`);
      }
      if (filterCountry) q = q.eq("country", filterCountry);
      if (filterProvider) q = q.eq("provider", filterProvider);

      if (sort === "ending") q = q.order("end_at", { ascending: true });
      else if (sort === "popular") q = q.order("heat_score", { ascending: false });
      else q = q.order("created_at", { ascending: false });

      q = q.limit(50);

      const { data, error } = await q;
      if (error || !data || data.length === 0) {
        // Fall back to demo data with client-side filtering
        let filtered = DEMO_DEALS.filter((d) => new Date(d.end_at) > new Date());
        if (query.trim()) {
          const lq = query.toLowerCase();
          filtered = filtered.filter(
            (d) => d.title.toLowerCase().includes(lq) || d.provider.toLowerCase().includes(lq)
          );
        }
        if (filterCountry) filtered = filtered.filter((d) => d.country === filterCountry);
        if (filterProvider) filtered = filtered.filter((d) => d.provider === filterProvider);
        if (sort === "ending") filtered.sort((a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime());
        else if (sort === "popular") filtered.sort((a, b) => b.heat_score - a.heat_score);
        else filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setDeals(filtered);
      } else {
        setDeals(data);
      }
    } catch {
      // Supabase unavailable, use demo data
      setDeals(DEMO_DEALS);
    }
    setLoading(false);
  }, [query, sort, filterCountry, filterProvider, supabase]);

  useEffect(() => {
    const timer = setTimeout(fetchDeals, 300);
    return () => clearTimeout(timer);
  }, [fetchDeals]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "ending", label: "Ending Soon" },
    { value: "popular", label: "Popular" },
    { value: "new", label: "Newest" },
  ];

  const clearFilters = () => {
    setFilterCountry(null);
    setFilterProvider(null);
  };

  const hasActiveFilters = filterCountry || filterProvider;

  return (
    <div className="space-y-4 py-4">
      {/* Search */}
      <div className="px-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort + Filter toggle */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
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
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition cursor-pointer ${
              showFilters || hasActiveFilters ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Country</p>
              <div className="flex flex-wrap gap-1.5">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setFilterCountry(filterCountry === c.code ? null : c.code)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-full transition cursor-pointer ${
                      filterCountry === c.code
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border text-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Provider</p>
              <div className="flex flex-wrap gap-1.5">
                {PROVIDERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterProvider(filterProvider === p ? null : p)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-full transition cursor-pointer ${
                      filterProvider === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary font-medium cursor-pointer">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && !showFilters && (
        <div className="flex gap-1.5 px-4 flex-wrap">
          {filterCountry && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterCountry(null)}>
              {filterCountry} <X className="h-3 w-3" />
            </Badge>
          )}
          {filterProvider && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterProvider(null)}>
              {filterProvider} <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      <div className="px-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <DealCardSkeleton key={i} />)
        ) : deals.length === 0 ? (
          <div className="text-center py-12">
            <RadarBuddy size="md" mood="thinking" message="No deals found" className="mb-3" />
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}
