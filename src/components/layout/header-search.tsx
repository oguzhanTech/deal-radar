"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";
import { dealPath } from "@/lib/deal-url";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const t = q.trim();
    if (t.length < MIN_CHARS) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/deals?q=${encodeURIComponent(t)}&sort=new&limit=8`,
          { signal: ac.signal }
        );
        const data = (await res.json()) as Deal[];
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [q]);

  const trimmed = q.trim();
  const showPanel = open && trimmed.length >= MIN_CHARS;

  return (
    <div
      ref={wrapRef}
      className={cn(
        "hidden lg:block relative flex-1 max-w-[min(100%,14rem)] xl:max-w-xs min-w-0 z-50"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15",
          "px-3 py-2 text-sm text-white/80 transition-colors",
          open && "ring-2 ring-white/25"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-white/70" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t("search.placeholder")}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none placeholder:text-white/50 text-white text-sm"
          aria-label={t("search.placeholder")}
          autoComplete="off"
        />
        {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/70" /> : null}
      </div>

      {showPanel ? (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-border bg-background text-foreground shadow-lg overflow-hidden max-h-[min(70vh,420px)] flex flex-col"
          role="listbox"
        >
          {loading && results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">{t("common.loading")}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">{t("search.empty")}</p>
          ) : (
            <ul className="overflow-y-auto divide-y divide-border">
              {results.map((deal) => (
                <li key={deal.id}>
                  <button
                    type="button"
                    className="w-full flex gap-2.5 px-3 py-2.5 text-left hover:bg-muted/80 transition-colors cursor-pointer"
                    onClick={() => {
                      setOpen(false);
                      router.push(dealPath(deal));
                    }}
                  >
                    <div className="relative h-12 w-12 shrink-0 rounded-lg bg-muted overflow-hidden">
                      {deal.image_url ? (
                        <Image
                          src={deal.image_url}
                          alt={deal.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold line-clamp-2 leading-snug">{deal.title}</p>
                      {deal.deal_price != null ? (
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">
                          {formatPrice(deal.deal_price, deal.currency)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{deal.provider}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border p-2 bg-muted/30">
            <Link
              href={trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search"}
              className="block text-center text-sm font-semibold text-primary py-2 rounded-lg hover:bg-primary/10 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              {t("search.allResults")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
