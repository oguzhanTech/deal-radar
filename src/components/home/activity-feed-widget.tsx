"use client";

import { useMemo, useState, TouchEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { openPublicProfileModal } from "@/components/profile/public-user-profile-modal";
import { t } from "@/lib/i18n";
import type { Activity } from "@/lib/types/database";

interface ActivityFeedWidgetProps {
  activities: Activity[];
}

function buildActivityText(a: Activity) {
  const name = a.payload?.display_name ?? t("admin.users.unnamed");
  const title = a.payload?.deal_title ?? t("deal.viewDeal");

  if (a.type === "deal_created") {
    return {
      actorName: name,
      restText: `${t("activity.shared")} ${title}`,
      href: `/deal/${a.deal_id}`,
      cta: t("activity.ctaDeal"),
    };
  }

  if (a.type === "vote") {
    return {
      actorName: name,
      restText: `${t("activity.voted")} ${title}`,
      href: `/deal/${a.deal_id}`,
      cta: t("activity.ctaDeal"),
    };
  }

  if (a.type === "comment") {
    const snippet = a.payload?.comment_snippet?.trim();
    const quoted = snippet ? ` "${snippet}${snippet.length >= 120 ? "…" : ""}"` : "";
    return {
      actorName: name,
      restText: `${t("activity.commented")}${quoted}`,
      href: `/deal/${a.deal_id}?tab=comments`,
      cta: t("activity.ctaComment"),
    };
  }

  // save
  return {
    actorName: name,
    restText: `${t("activity.saved")} ${title}`,
    href: `/deal/${a.deal_id}`,
    cta: t("activity.ctaDeal"),
  };
}

function actorInitial(name: string) {
  const s = name.trim();
  if (!s) return "?";
  return s[0]!.toUpperCase();
}

export function ActivityFeedWidget({ activities }: ActivityFeedWidgetProps) {
  const list = useMemo(() => activities.slice(0, 5), [activities]);
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const current = list[index]!;
  const meta = buildActivityText(current);
  const profileUrl = current.payload?.profile_image_url?.trim() || null;

  const priceLine = useMemo(() => {
    const dealPrice = current.payload?.deal_price ?? null;
    const originalPrice = current.payload?.original_price ?? null;
    const currency = current.payload?.currency ?? null;
    if (dealPrice == null || !currency) return null;
    if (originalPrice != null) {
      return `${formatPrice(dealPrice, currency)} (${formatPrice(originalPrice, currency)} ${t("activity.was")})`;
    }
    return formatPrice(dealPrice, currency);
  }, [current]);

  const goPrev = () => setIndex((i) => (i - 1 + list.length) % list.length);
  const goNext = () => setIndex((i) => (i + 1) % list.length);

  const onTouchStart = (e: TouchEvent) => setTouchStartX(e.touches[0]?.clientX ?? null);
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStartX;
    setTouchStartX(null);
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const dx = end - start;
    if (Math.abs(dx) < 40) return;
    if (dx > 0) goPrev();
    else goNext();
  };

  if (list.length === 0) return null;

  return (
    <section className="space-y-2 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          {t("activity.title")}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goPrev}
            className="h-9 w-9 rounded-xl bg-muted/60 hover:bg-muted transition flex items-center justify-center"
            aria-label={t("activity.prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="h-9 w-9 rounded-xl bg-muted/60 hover:bg-muted transition flex items-center justify-center"
            aria-label={t("activity.next")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="p-4 flex items-start gap-3"
          >
            <div className="shrink-0">
              <Avatar className="h-11 w-11 border-0 shadow-none ring-0">
                <AvatarImage
                  src={profileUrl ?? undefined}
                  alt=""
                  className="rounded-full object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold">
                  {actorInitial(meta.actorName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug line-clamp-2">
                <button
                  type="button"
                  className="hover:text-primary transition cursor-pointer"
                  onClick={() => openPublicProfileModal(current.user_id)}
                >
                  &quot;{meta.actorName}&quot;
                </button>{" "}
                {meta.restText}
              </p>
              {priceLine && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{priceLine}</p>
              )}
              <div className="mt-3">
                <Link
                  href={meta.href}
                  className={cn(
                    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition",
                    "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  {meta.cta}
                </Link>
              </div>
            </div>
            <div className="shrink-0 text-[10px] text-muted-foreground font-semibold tabular-nums">
              {index + 1}/{list.length}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

