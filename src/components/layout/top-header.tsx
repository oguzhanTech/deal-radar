"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Home, PlusCircle, Radar, Search, Sparkles, Trophy, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth, useAuthDisplay } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { t } from "@/lib/i18n";
import { prefetchOnce } from "@/lib/prefetch-once";
import { cn, formatPrice } from "@/lib/utils";
import { APP_SHELL_CLASS } from "@/lib/layout-constants";
import { HeaderSearch } from "@/components/layout/header-search";
import { dealPath } from "@/lib/deal-url";
import Link from "next/link";

const DESKTOP_NAV = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/search", labelKey: "nav.search", icon: Search },
  { href: "/create", labelKey: "nav.create", icon: PlusCircle },
  { href: "/my", labelKey: "nav.myRadar", icon: Radar },
  { href: "/profile", labelKey: "nav.profile", icon: User },
] as const;

type CiniCategory = "electronics" | "home" | "fashion" | "market" | "surprise";
type CiniStep = 1 | 2 | 3;

interface MobileCiniDeal {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  provider: string;
  deal_price: number | null;
  original_price: number | null;
  currency: string;
  discount_percent: number | null;
  heat_score: number;
}

const MOBILE_CINI_OPTIONS: { id: CiniCategory; label: string; searchCategory?: string }[] = [
  { id: "electronics", label: "Elektronik", searchCategory: "Teknoloji" },
  { id: "home", label: "Ev & Yaşam", searchCategory: "Ev & Yaşam" },
  { id: "fashion", label: "Giyim", searchCategory: "Giyim & Moda" },
  { id: "market", label: "Market", searchCategory: "Market" },
  { id: "surprise", label: "Sürpriz bul" },
];

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function hasAnyToken(deal: MobileCiniDeal, tokens: string[]): boolean {
  const text = `${normalize(deal.category)} ${normalize(deal.title)} ${normalize(deal.provider)}`;
  return tokens.some((token) => text.includes(normalize(token)));
}

function categoryMatches(deal: MobileCiniDeal, category: CiniCategory): boolean {
  if (category === "surprise") return true;
  if (category === "electronics") {
    return hasAnyToken(deal, ["teknoloji", "elektronik", "telefon", "laptop", "bilgisayar"]);
  }
  if (category === "home") {
    return hasAnyToken(deal, ["ev", "yaşam", "mutfak", "mobilya", "dekorasyon"]);
  }
  if (category === "fashion") {
    return hasAnyToken(deal, ["giyim", "moda", "ayakkabı", "giyim & moda"]);
  }
  if (category === "market") {
    return hasAnyToken(deal, ["market", "gıda", "süpermarket"]);
  }
  return true;
}

function scoreDeal(deal: MobileCiniDeal, category: CiniCategory, budget: number): number {
  const price = deal.deal_price ?? deal.original_price ?? Number.POSITIVE_INFINITY;
  const fitsBudget = Number.isFinite(price) && price <= budget;
  const discount = deal.discount_percent ?? 0;
  const heat = deal.heat_score ?? 0;

  if (category === "surprise") {
    return discount * 8 + heat * 3 + (fitsBudget ? 120 : 0);
  }
  return (categoryMatches(deal, category) ? 250 : 0) + (fitsBudget ? 140 : 0) + discount * 6 + heat * 2;
}

export function TopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { showAsLoggedIn, initial, profile } = useAuthDisplay();
  const [showCiniMini, setShowCiniMini] = useState(false);
  const [ciniStep, setCiniStep] = useState<CiniStep>(1);
  const [ciniCategory, setCiniCategory] = useState<CiniCategory | null>(null);
  const [ciniBudget, setCiniBudget] = useState(1500);
  const [ciniResults, setCiniResults] = useState<MobileCiniDeal[]>([]);
  const [ciniLoading, setCiniLoading] = useState(false);
  const [ciniPool, setCiniPool] = useState<MobileCiniDeal[]>([]);
  const [ciniPoolLoading, setCiniPoolLoading] = useState(false);
  const ciniRef = useRef<HTMLDivElement | null>(null);

  const avatarLetter = profile?.display_name?.charAt(0)?.toUpperCase() || initial;

  useEffect(() => {
    if (!showCiniMini) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!ciniRef.current?.contains(target)) {
        setShowCiniMini(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [showCiniMini]);

  const ciniMaxBudget = useMemo(() => {
    const maxPrice = ciniPool.reduce((max, deal) => {
      const price = deal.deal_price ?? deal.original_price ?? 0;
      return Math.max(max, Math.ceil(price));
    }, 0);
    return Math.max(2000, maxPrice);
  }, [ciniPool]);

  useEffect(() => {
    if (ciniBudget > ciniMaxBudget) {
      setCiniBudget(ciniMaxBudget);
    }
  }, [ciniBudget, ciniMaxBudget]);

  const fetchCiniPool = async (): Promise<MobileCiniDeal[]> => {
    if (ciniPool.length > 0) return ciniPool;
    setCiniPoolLoading(true);
    try {
      const res = await fetch("/api/deals?sort=popular", { cache: "no-store" });
      const data = (await res.json()) as MobileCiniDeal[];
      const pool = Array.isArray(data) ? data : [];
      setCiniPool(pool);
      return pool;
    } catch {
      setCiniPool([]);
      return [];
    } finally {
      setCiniPoolLoading(false);
    }
  };

  const submitCini = async () => {
    if (!ciniCategory) return;
    setCiniLoading(true);
    try {
      const pool = ciniPool.length > 0 ? ciniPool : await fetchCiniPool();
      const categoryCandidates =
        ciniCategory === "surprise" ? pool : pool.filter((deal) => categoryMatches(deal, ciniCategory));

      // MVP beklentisine göre bütçe "hard filter": bütçeyi aşanları hiç göstermeyelim.
      const withinBudget = categoryCandidates.filter((deal) => {
        const price = deal.deal_price ?? deal.original_price;
        return price != null && price <= ciniBudget;
      });

      const ranked = [...withinBudget]
        .sort((a, b) => scoreDeal(b, ciniCategory, ciniBudget) - scoreDeal(a, ciniCategory, ciniBudget))
        .slice(0, 6);
      setCiniResults(ranked);
      setCiniStep(3);
    } catch {
      setCiniResults([]);
      setCiniStep(3);
    } finally {
      setCiniLoading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      <div
        className={cn(
          APP_SHELL_CLASS,
          "flex items-center justify-between h-16 px-4 sm:px-5 lg:px-6 gap-1.5 sm:gap-2 lg:gap-4"
        )}
      >
        <div className="flex items-center gap-3 lg:gap-8 min-w-0 flex-1">
          <Link
            href="/"
            prefetch
            onMouseEnter={() => prefetchOnce(router, "/")}
            onTouchStart={() => prefetchOnce(router, "/")}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm">
              <Radar className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-lg leading-tight tracking-tight truncate">{t("app.name")}</span>
              <span className="text-[9px] font-medium text-white/60 leading-none -mt-0.5 hidden sm:block truncate">
                {t("app.tagline")}
              </span>
            </div>
          </Link>

          <nav
            className="hidden lg:flex items-center gap-1 min-w-0 flex-1 justify-center max-w-3xl"
            aria-label="Ana navigasyon"
          >
            {DESKTOP_NAV.map(({ href, labelKey, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  onMouseEnter={() => prefetchOnce(router, href)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                    active ? "bg-white/20 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  <span>{t(labelKey)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <HeaderSearch />

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
          <div ref={ciniRef} className="relative lg:hidden">
            <button
              type="button"
              data-no-skeleton
              onClick={() => {
                setShowCiniMini((prev) => {
                  const next = !prev;
                  if (next) {
                    setCiniStep(1);
                    setCiniCategory(null);
                    setCiniResults([]);
                    setCiniBudget(Math.min(1500, ciniMaxBudget));
                    void fetchCiniPool();
                  }
                  return next;
                });
              }}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-colors cursor-pointer"
              title="Fırsat Cini"
              aria-label="Fırsat Cini"
            >
              <Sparkles className="h-5 w-5" />
            </button>

            {showCiniMini ? (
              <div className="fixed top-[4.25rem] left-2 right-2 sm:left-auto sm:right-4 sm:w-[280px] rounded-2xl border border-white/25 bg-white text-foreground shadow-xl p-3 z-50">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-indigo-900">
                    {ciniStep === 1
                      ? "Bugün ne arıyorsun?"
                      : ciniStep === 2
                        ? "Bütçen ne kadar?"
                        : "Senin için fırsatlar hazır 🎯"}
                  </p>
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700">
                    {ciniStep === 3 ? "3/3" : `${ciniStep}/2`}
                  </span>
                </div>

                {ciniStep === 1 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {MOBILE_CINI_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="rounded-xl border border-indigo-200 bg-white px-2.5 py-2 text-xs font-medium text-indigo-800 hover:border-indigo-300 hover:bg-indigo-50 transition cursor-pointer"
                        onClick={() => {
                          setCiniCategory(item.id);
                          setCiniStep(2);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : ciniStep === 2 ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-indigo-50 px-3 py-2 text-center text-sm font-semibold text-indigo-800">
                      {ciniBudget.toLocaleString("tr-TR")} ₺
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={ciniMaxBudget}
                      step={100}
                      value={ciniBudget}
                      onChange={(e) => setCiniBudget(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>0 ₺</span>
                      <span>{ciniMaxBudget.toLocaleString("tr-TR")} ₺</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCiniStep(1)}
                        className="flex-1 rounded-xl border border-border px-3 py-2 text-xs font-medium cursor-pointer"
                      >
                        Geri
                      </button>
                      <button
                        type="button"
                        onClick={submitCini}
                        disabled={!ciniCategory || ciniLoading || ciniPoolLoading}
                        className={cn(
                          "flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white transition",
                          ciniCategory && !ciniLoading && !ciniPoolLoading
                            ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                            : "bg-indigo-300 cursor-not-allowed"
                        )}
                      >
                        {ciniLoading || ciniPoolLoading ? "Hazırlanıyor..." : "Fırsatları göster"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ciniResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Bu seçimde uygun fırsat bulamadım. Farklı kategori veya bütçe deneyebilirsin.
                      </p>
                    ) : (
                      <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                        {ciniResults.map((deal) => {
                          const price = deal.deal_price ?? deal.original_price;
                          return (
                            <Link
                              key={deal.id}
                              href={dealPath({ slug: deal.slug })}
                              data-no-skeleton
                              onClick={() => {
                                setShowCiniMini(false);
                                setCiniStep(1);
                              }}
                              className="block rounded-xl border border-border/60 bg-background px-3 py-2 transition hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer"
                            >
                              <p className="line-clamp-1 text-xs font-medium text-foreground">{deal.title}</p>
                              <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                                <span className="line-clamp-1 text-muted-foreground">
                                  {deal.category ?? deal.provider}
                                </span>
                                {price != null ? (
                                  <span className="font-semibold text-indigo-700">
                                    {formatPrice(price, deal.currency ?? "TL")}
                                  </span>
                                ) : (
                                  <span className="font-medium text-muted-foreground">Fiyat yakında</span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCiniStep(1);
                        setCiniCategory(null);
                        setCiniResults([]);
                        setCiniBudget(Math.min(1500, ciniMaxBudget));
                      }}
                      className="w-full rounded-xl border border-border px-3 py-2 text-xs font-medium cursor-pointer"
                    >
                      Yeniden seçim yap
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <Link
            href="/leaderboard"
            prefetch
            onMouseEnter={() => prefetchOnce(router, "/leaderboard")}
            onTouchStart={() => prefetchOnce(router, "/leaderboard")}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-colors"
            title={t("home.leaderboardTitle")}
            aria-label={t("home.leaderboardTitle")}
          >
            <Trophy className="h-5 w-5" />
          </Link>
          {user && <NotificationBell />}
          {showAsLoggedIn ? (
            <Link
              href="/profile"
              prefetch
              onMouseEnter={() => prefetchOnce(router, "/profile")}
              onTouchStart={() => prefetchOnce(router, "/profile")}
            >
              <Avatar className="h-9 w-9 border-2 border-white/25 ring-2 ring-white/10">
                {profile?.profile_image_url && (
                  <AvatarImage
                    src={profile.profile_image_url}
                    alt={profile.display_name ?? "Avatar"}
                    sizes="36px"
                  />
                )}
                <AvatarFallback className="bg-white/15 text-white text-xs font-bold">{avatarLetter}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              href="/login"
              prefetch
              onMouseEnter={() => prefetchOnce(router, "/login")}
              onTouchStart={() => prefetchOnce(router, "/login")}
              className="text-sm font-semibold bg-white/15 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl hover:bg-white/25 transition-all active:scale-95 whitespace-nowrap"
            >
              {t("common.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
