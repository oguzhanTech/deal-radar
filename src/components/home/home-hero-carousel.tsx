"use client";

import { useMemo, useState, useCallback, TouchEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Flame, Clock, Sparkles, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";
import { dealPath } from "@/lib/deal-url";

export interface HeroDeal extends Deal {
  section: "endingSoon" | "popular" | "newest" | "trending";
  creatorName?: string | null;
}

export type HeroSlide =
  | { kind: "deal"; deal: HeroDeal }
  | {
      kind: "announcement";
      id: string;
      title: string;
      body: string | null;
      image_url: string;
      link_url: string | null;
    };

interface HomeHeroCarouselProps {
  slides: HeroSlide[];
}

/** Mobil ~100vw eksi yatay padding (px-4); masaüstü içerik genişliği */
const HERO_IMAGE_SIZES =
  "(max-width: 1024px) calc(100vw - 2rem), min(896px, 58vw)";

function getSectionLabel(section: HeroDeal["section"]) {
  switch (section) {
    case "endingSoon":
      return t("home.endingSoon");
    case "popular":
      return t("home.popular");
    case "newest":
      return t("home.newDeals");
    case "trending":
      return t("home.trending");
    default:
      return "";
  }
}

function getHeroMessage(section: HeroDeal["section"]) {
  if (section === "endingSoon") {
    const messages = [
      "Bu fırsat yakında bitiyor, kaçırma.",
      "Son saatler, radarına ekleyip unutma.",
      "Az sonra sona eriyor, hemen göz at.",
      "Bitmeden yakala, sonra üzülme.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  if (section === "popular" || section === "trending") {
    const messages = [
      "Topluluk şu an bu fırsat için çok heyecanlı.",
      "Avcıların gözdesi, elden ele dolaşıyor.",
      "Trend listesinde hızla yükseliyor.",
      "Birçok kişi bu fırsatı radarına aldı bile.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  const messages = [
    "Topla'ya yeni düştü, ilk sen değerlendir.",
    "Taze taze gelen bir fırsat, keşfetmeye değer.",
    "Yeni eklendi, erken yakalayan kazanır.",
    "Bugünün taze fırsatlarından biri.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function slideKey(s: HeroSlide): string {
  return s.kind === "deal" ? `deal-${s.deal.id}` : `announcement-${s.id}`;
}

function navigateFromLink(router: ReturnType<typeof useRouter>, linkUrl: string | null) {
  const u = linkUrl?.trim();
  if (!u) return;
  if (u.startsWith("/")) {
    router.push(u);
    return;
  }
  if (u.startsWith("https://") || u.startsWith("http://")) {
    window.open(u, "_blank", "noopener,noreferrer");
  }
}

export function HomeHeroCarousel({ slides: rawSlides }: HomeHeroCarouselProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const slides = useMemo(() => {
    return rawSlides.filter((s) => {
      if (s.kind === "announcement") return !!s.image_url?.trim();
      const d = s.deal;
      return (
        d.status === "approved" &&
        d.end_at &&
        new Date(d.end_at) > new Date() &&
        !!d.image_url
      );
    });
  }, [rawSlides]);

  const length = slides.length;

  const goTo = useCallback(
    (next: number) => {
      if (!length) return;
      const safe = ((next % length) + length) % length;
      setIndex(safe);
    },
    [length]
  );

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      if (delta < 0) next();
      else prev();
    }
    setTouchStartX(null);
  };

  const active = slides[index];

  const dealMessage = useMemo(() => {
    if (!active || active.kind !== "deal") return "";
    return getHeroMessage(active.deal.section);
  }, [active]);

  if (!length || !active) return null;

  const isDeal = active.kind === "deal";
  const deal = isDeal ? active.deal : null;
  const ann = !isDeal ? active : null;

  const isLongTitle = isDeal
    ? deal!.title.length > 23
    : (ann!.title?.length ?? 0) > 23;

  const hasPrices =
    isDeal && deal!.deal_price != null && deal!.original_price != null;

  const discount =
    isDeal && hasPrices && deal!.original_price! > 0
      ? Math.round(((deal!.original_price! - deal!.deal_price!) / deal!.original_price!) * 100)
      : isDeal
        ? deal!.discount_percent ?? null
        : null;

  const sectionLabel = isDeal && deal ? getSectionLabel(deal.section) : "";
  const motionKey = slideKey(active);

  const onCardClick = () => {
    if (isDeal && deal) {
      router.push(dealPath(deal));
      return;
    }
    if (ann) navigateFromLink(router, ann.link_url);
  };

  const cardClickable = isDeal || !!(ann?.link_url?.trim());

  return (
    <section
      className="px-4 pt-1 md:pt-1.5"
      aria-label={t("home.heroCarouselAria")}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative overflow-hidden rounded-3xl bg-black text-white shadow-xl h-[190px] md:h-[215px]">
        <div
          key={motionKey}
          className={cn(
            "absolute inset-0 animate-in fade-in duration-300",
            cardClickable && "cursor-pointer"
          )}
          onClick={cardClickable ? onCardClick : undefined}
          role={cardClickable ? "link" : undefined}
          tabIndex={cardClickable ? 0 : undefined}
          onKeyDown={
            cardClickable
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCardClick();
                  }
                }
              : undefined
          }
        >
            <div className="absolute inset-0">
              {isDeal && deal?.image_url && (
                <Image
                  src={deal.image_url}
                  alt={deal.title}
                  fill
                  className="object-cover scale-110"
                  style={{ objectPosition: "center" }}
                  sizes={HERO_IMAGE_SIZES}
                  quality={78}
                  priority
                  fetchPriority="high"
                />
              )}
              {!isDeal && ann?.image_url && (
                <Image
                  src={ann.image_url}
                  alt={ann.title}
                  fill
                  className="object-cover scale-110"
                  style={{ objectPosition: "center" }}
                  sizes={HERO_IMAGE_SIZES}
                  quality={78}
                  priority
                  fetchPriority="high"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
            </div>

            <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 h-full">
              <div className="flex-1 min-w-0 space-y-3 md:space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                    {isDeal && deal ? (
                      deal.section === "endingSoon" ? (
                        <Clock className="h-3 w-3" />
                      ) : deal.section === "popular" || deal.section === "trending" ? (
                        <Flame className="h-3 w-3" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )
                    ) : (
                      <Megaphone className="h-3 w-3" />
                    )}
                  </span>
                  <span className="uppercase tracking-wide">
                    {isDeal ? sectionLabel : t("home.heroAnnouncement")}
                  </span>
                  {isDeal && deal?.category && (
                    <span className="text-white/70">• {deal.category}</span>
                  )}
                </div>

                <h1
                  className={cn(
                    "font-extrabold leading-tight line-clamp-1 md:line-clamp-2",
                    isLongTitle ? "text-sm md:text-lg lg:text-xl" : "text-lg md:text-2xl lg:text-3xl"
                  )}
                >
                  {isDeal && deal ? deal.title : ann!.title}
                </h1>

                <p className="text-xs md:text-sm text-white/75 max-w-xl line-clamp-2 md:line-clamp-3">
                  {isDeal && deal ? dealMessage : ann?.body ?? "\u00a0"}
                </p>

                <div className="flex items-end gap-4 flex-wrap">
                  {isDeal && deal ? (
                    <>
                      {hasPrices ? (
                        <>
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm md:text-base line-through text-white/60">
                              {deal.original_price} {deal.currency === "TRY" ? "TL" : deal.currency}
                            </span>
                            <span className="text-2xl md:text-3xl font-extrabold">
                              {deal.deal_price} {deal.currency === "TRY" ? "TL" : deal.currency}
                            </span>
                          </div>
                          {discount ? (
                            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold shadow-sm">
                              <span>-%{discount}</span>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-sm md:text-base text-white/80">{t("deal.viewDeal")}</span>
                      )}

                      {deal.creatorName && (
                        <span className="text-xs md:text-sm text-white/70">
                          Paylaşan: <span className="font-semibold">{deal.creatorName}</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm md:text-base text-white/80">
                      {ann?.link_url?.trim() ? t("home.heroAnnouncementCta") : "\u00a0"}
                    </span>
                  )}
                </div>
              </div>

              <div className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-3 text-[11px] md:text-xs text-white/80">
                <span className="opacity-75">
                  {index + 1}/{length}
                </span>
                <div className="flex items-center gap-2 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white/90 backdrop-blur hover:bg-black/60 transition",
                      length <= 1 && "opacity-50 cursor-default"
                    )}
                    aria-label={t("common.previous")}
                    disabled={length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white/90 backdrop-blur hover:bg-black/60 transition",
                      length <= 1 && "opacity-50 cursor-default"
                    )}
                    aria-label={t("common.next")}
                    disabled={length <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
}
