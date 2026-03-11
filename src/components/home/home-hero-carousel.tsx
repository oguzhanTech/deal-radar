"use client";

import { useMemo, useState, useCallback, TouchEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";

export interface HeroDeal extends Deal {
  section: "endingSoon" | "popular" | "newest" | "trending";
  creatorName?: string | null;
}

interface HomeHeroCarouselProps {
  deals: HeroDeal[];
}

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
  // newest
  const messages = [
    "Topla'ya yeni düştü, ilk sen değerlendir.",
    "Taze taze gelen bir fırsat, keşfetmeye değer.",
    "Yeni eklendi, erken yakalayan kazanır.",
    "Bugünün taze fırsatlarından biri.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function HomeHeroCarousel({ deals }: HomeHeroCarouselProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const slides = useMemo(
    () =>
      deals.filter(
        (d) =>
          d.status === "approved" &&
          d.end_at &&
          new Date(d.end_at) > new Date() &&
          !!d.image_url
      ),
    [deals]
  );

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
  const isLongTitle = active.title ? active.title.length > 55 : false;
  const hasPrices = active.deal_price != null && active.original_price != null;
  const discount =
    hasPrices && active.original_price! > 0
      ? Math.round(((active.original_price! - active.deal_price!) / active.original_price!) * 100)
      : active.discount_percent ?? null;

  const sectionLabel = getSectionLabel(active.section);
  const message = getHeroMessage(active.section);

  if (!length) return null;

  return (
    <section
      className="px-4 pt-1 md:pt-1.5"
      aria-label="Öne çıkan fırsatlar"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative overflow-hidden rounded-3xl bg-black text-white shadow-xl h-[190px] md:h-[215px]">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={active.id}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.7 }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => router.push(`/deal/${active.id}`)}
          >
            <div className="absolute inset-0">
              {active.image_url && (
                <Image
                  src={active.image_url}
                  alt={active.title}
                  fill
                  className="object-cover scale-110"
                  sizes="100vw"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
            </div>

            <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 h-full">
              <div className="flex-1 min-w-0 space-y-3 md:space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                {active.section === "endingSoon" ? (
                  <Clock className="h-3 w-3" />
                ) : active.section === "popular" || active.section === "trending" ? (
                  <Flame className="h-3 w-3" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
              </span>
              <span className="uppercase tracking-wide">{sectionLabel}</span>
              {active.category && <span className="text-white/70">• {active.category}</span>}
            </div>

            <h1
              className={cn(
                "font-extrabold leading-tight line-clamp-1 md:line-clamp-2",
                isLongTitle ? "text-sm md:text-lg lg:text-xl" : "text-lg md:text-2xl lg:text-3xl"
              )}
            >
              {active.title}
            </h1>

            <p className="text-xs md:text-sm text-white/75 max-w-xl line-clamp-2 md:line-clamp-3">
              {message}
            </p>

            <div className="flex items-end gap-4 flex-wrap">
              {hasPrices ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm md:text-base line-through text-white/60">
                      {active.original_price} {active.currency === "TRY" ? "TL" : active.currency}
                    </span>
                    <span className="text-2xl md:text-3xl font-extrabold">
                      {active.deal_price} {active.currency === "TRY" ? "TL" : active.currency}
                    </span>
                  </div>
                  {discount && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold shadow-sm">
                      <span>-%{discount}</span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-sm md:text-base text-white/80">{t("deal.viewDeal")}</span>
              )}

              {active.creatorName && (
                <span className="text-xs md:text-sm text-white/70">
                  Paylaşan: <span className="font-semibold">{active.creatorName}</span>
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
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

