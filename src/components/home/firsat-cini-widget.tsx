"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RadarBuddy } from "@/components/mascot/radar-buddy";
import { dealPath } from "@/lib/deal-url";
import type { Deal } from "@/lib/types/database";
import { cn, formatPrice } from "@/lib/utils";

type WizardStep = 1 | 2;
type Preference = "electronics" | "home" | "fashion" | "market" | "surprise";

interface CategoryOption {
  id: Preference;
  label: string;
  matcher: (deal: Deal) => boolean;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: "electronics",
    label: "Elektronik",
    matcher: (deal) => hasAnyToken(deal, ["teknoloji", "elektronik", "telefon", "laptop", "bilgisayar"]),
  },
  {
    id: "home",
    label: "Ev & Yaşam",
    matcher: (deal) => hasAnyToken(deal, ["ev", "yaşam", "mutfak", "mobilya", "dekorasyon"]),
  },
  {
    id: "fashion",
    label: "Giyim",
    matcher: (deal) => hasAnyToken(deal, ["giyim", "moda", "ayakkabı", "giyim & moda"]),
  },
  {
    id: "market",
    label: "Market",
    matcher: (deal) => hasAnyToken(deal, ["market", "gıda", "süpermarket"]),
  },
  {
    id: "surprise",
    label: "Sürpriz bul",
    matcher: () => true,
  },
];

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function hasAnyToken(deal: Deal, tokens: string[]): boolean {
  const text = `${normalize(deal.category)} ${normalize(deal.title)} ${normalize(deal.provider)}`;
  return tokens.some((token) => text.includes(normalize(token)));
}

function scoreDeal(deal: Deal, preference: Preference, budget: number): number {
  const price = deal.deal_price ?? deal.original_price ?? Number.POSITIVE_INFINITY;
  const fitsBudget = Number.isFinite(price) && price <= budget;
  const discountScore = deal.discount_percent ?? 0;
  const heatScore = deal.heat_score ?? 0;

  if (preference === "surprise") {
    return discountScore * 8 + heatScore * 3 + (fitsBudget ? 120 : 0);
  }

  const category = CATEGORY_OPTIONS.find((option) => option.id === preference);
  const categoryMatch = category?.matcher(deal) ?? false;
  return (categoryMatch ? 250 : 0) + (fitsBudget ? 140 : 0) + discountScore * 6 + heatScore * 2;
}

function dedupeDeals(deals: Deal[]): Deal[] {
  const seen = new Set<string>();
  return deals.filter((deal) => {
    if (seen.has(deal.id)) return false;
    seen.add(deal.id);
    return true;
  });
}

interface FirsatCiniWidgetProps {
  deals: Deal[];
  compact?: boolean;
  className?: string;
}

export function FirsatCiniWidget({ deals, compact = false, className }: FirsatCiniWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [selection, setSelection] = useState<Preference | null>(null);
  const [budget, setBudget] = useState(1200);
  const [results, setResults] = useState<Deal[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const candidateDeals = useMemo(() => dedupeDeals(deals), [deals]);
  const maxBudget = useMemo(() => {
    const maxPrice = candidateDeals.reduce((max, deal) => {
      const price = deal.deal_price ?? deal.original_price ?? 0;
      return Math.max(max, Math.ceil(price));
    }, 0);
    return Math.max(2000, maxPrice);
  }, [candidateDeals]);

  const applyRecommendation = () => {
    if (!selection) return;
    const ranked = [...candidateDeals]
      .sort((a, b) => scoreDeal(b, selection, budget) - scoreDeal(a, selection, budget))
      .slice(0, 6);
    setResults(ranked);
    setHasSearched(true);
    setExpanded(false);
    setStep(1);
  };

  const onSelectPreference = (preference: Preference) => {
    setSelection(preference);
    setStep(2);
  };

  const resetFlow = () => {
    setStep(1);
    setSelection(null);
    setBudget(Math.min(1200, maxBudget));
  };

  return (
    <section className={cn("px-4", compact && "px-0 w-full", className)}>
      <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50 to-violet-50 shadow-sm">
        <div className={cn("p-3", !compact && "sm:p-4")}>
          <div className={cn("flex items-center gap-3", compact && "items-start")}>
            <RadarBuddy size="sm" mood="excited" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-indigo-900">Fırsat Cini</p>
            </div>
          </div>

          <button
            type="button"
            className={cn(
              "mt-3 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 cursor-pointer",
              compact ? "w-full" : "sm:text-sm"
            )}
            onClick={() => {
              setExpanded((prev) => {
                const next = !prev;
                if (next) setStep(1);
                return next;
              });
            }}
          >
            Bir Fırsat Dile
          </button>
        </div>

        {expanded ? (
          <div className="border-t border-indigo-200/70 px-3 pb-3 pt-3 animate-in fade-in duration-150">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-indigo-900">
                {step === 1 ? "Bugün ne arıyorsun?" : "Bütçen ne kadar?"}
              </p>
              <span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700">
                {step}/2
              </span>
            </div>

            {step === 1 ? (
              <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-2")}>
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelectPreference(option.id)}
                    className="rounded-xl border border-indigo-200 bg-white px-2.5 py-2 text-xs font-medium text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-50 sm:text-sm cursor-pointer"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-indigo-100 px-3 py-2 text-center text-base font-semibold text-indigo-800">
                  {budget.toLocaleString("tr-TR")} ₺
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxBudget}
                  step={50}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>0 ₺</span>
                  <span>{maxBudget.toLocaleString("tr-TR")} ₺</span>
                </div>
                <div className={cn("flex gap-2", compact && "flex-col")}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-xs font-medium sm:text-sm cursor-pointer"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={applyRecommendation}
                    disabled={!selection}
                    className={cn(
                      "flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white transition sm:text-sm",
                      selection ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer" : "cursor-not-allowed bg-indigo-300"
                    )}
                  >
                    Fırsatları göster
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {hasSearched ? (
        <div
          className={cn(
            "mt-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm animate-in fade-in duration-200",
            !compact && "sm:p-4"
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Senin için fırsatlar hazır 🎯</p>
            <button
              type="button"
              onClick={() => {
                resetFlow();
                setExpanded(true);
              }}
              className="text-xs font-medium text-indigo-700 hover:text-indigo-800 cursor-pointer"
            >
              Yeniden seç
            </button>
          </div>

          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bu seçimde sonuç bulamadım. Kategori veya bütçeyi değiştirip tekrar deneyebilirsin.
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((deal) => {
                const price = deal.deal_price ?? deal.original_price;
                return (
                  <Link
                    key={deal.id}
                    href={dealPath({ slug: deal.slug })}
                    data-no-skeleton
                    className="block rounded-xl border border-border/60 bg-background px-3 py-2 transition hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer"
                  >
                    <p className="line-clamp-1 text-xs font-medium text-foreground">{deal.title}</p>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                      <span className="line-clamp-1 text-muted-foreground">
                        {deal.category ?? deal.provider}
                      </span>
                      {price != null ? (
                        <span className="font-semibold text-indigo-700">{formatPrice(price, deal.currency ?? "TL")}</span>
                      ) : (
                        <span className="font-medium text-muted-foreground">Fiyat yakında</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
