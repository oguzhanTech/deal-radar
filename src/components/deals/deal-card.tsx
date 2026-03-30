"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ExternalLink, Ticket, User2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DealCountdown } from "./deal-countdown";
import { HeatBadge } from "./heat-badge";
import { SaveRemindButton } from "./save-remind-button";
import { hasStrikethroughOriginal } from "@/lib/deal-price";
import { cn, formatPrice } from "@/lib/utils";
import { useCountdown } from "@/hooks/use-countdown";
import { HEAT_TRENDING_THRESHOLD } from "@/lib/constants";
import { openPublicProfileModal } from "@/components/profile/public-user-profile-modal";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";

interface DealCardProps {
  deal: Deal;
  horizontal?: boolean;
  /** Anasayfa kategorilerinde küçük widget (alt alta liste) */
  compact?: boolean;
  /** Creator satırını gizle (örn. Keşfet sayfasında başlığa daha fazla yer) */
  hideCreator?: boolean;
  /** Alt infinite feed için hafif görsel ayrım */
  surface?: "default" | "feed";
  /** Dar gridlerde (örn. Keşfet) aciliyet etiketini gizleyip taşmayı önler */
  hideCountdownStatusLabel?: boolean;
  /** Ana sayfa sağ sütun: dikey, kare görsel; taşmayı önler */
  compactLayout?: "default" | "rail";
}

export function DealCard({
  deal,
  horizontal = false,
  compact = false,
  hideCreator = false,
  surface = "default",
  hideCountdownStatusLabel = false,
  compactLayout = "default",
}: DealCardProps) {
  const router = useRouter();
  const { isUrgent, isVeryUrgent } = useCountdown(deal.end_at);
  const isTrending = deal.is_trending ?? (deal.heat_score >= HEAT_TRENDING_THRESHOLD);

  const prefetchDetail = () => router.prefetch(`/deal/${deal.id}`);

  /** İki fiyat var ve farklıysa çizili+yeşil; eşit veya yalnızca deal fiyatıysa tek yeşil. */
  const showDualPrices = hasStrikethroughOriginal(deal.original_price, deal.deal_price);
  const showSingleGreenPrice = deal.deal_price != null && !showDualPrices;
  const showDiscountBadge = !!deal.discount_percent && showDualPrices;

  const creatorName =
    (deal as any).profile?.display_name || t("admin.users.unnamed");
  const creatorId = deal.created_by;

  const goToDeal = () => {
    router.push(`/deal/${deal.id}`);
  };

  if (compact && compactLayout === "rail") {
    return (
      <div
        onMouseEnter={prefetchDetail}
        onTouchStart={prefetchDetail}
        className="w-full min-w-0 max-w-full hover:opacity-95 active:scale-[0.99] transition-transform cursor-pointer"
        onClick={goToDeal}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToDeal();
          }
        }}
      >
        <div
          className={cn(
            "rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/40 flex flex-col gap-2 p-2 max-w-full min-w-0",
            surface === "feed" && "bg-muted/20 border-l-2 border-l-primary/30",
            isVeryUrgent && "critical-glow",
            isUrgent && !isVeryUrgent && "urgent-glow"
          )}
        >
          <div className="relative mx-auto aspect-square w-full max-w-[5.5rem] shrink-0 rounded-lg bg-muted overflow-hidden">
            {deal.image_url ? (
              <Image
                src={deal.image_url}
                alt={deal.title}
                fill
                className="object-cover"
                sizes="88px"
                quality={90}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/40 text-[10px] text-center px-1">
                {deal.category || deal.provider}
              </div>
            )}
          </div>
          <div className="min-w-0 w-full space-y-1">
            <h3 className="font-semibold text-[13px] leading-snug line-clamp-2 break-words">
              {deal.title}
            </h3>
            {!hideCreator && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 min-w-0">
                <User2 className="h-3 w-3 shrink-0 text-muted-foreground/80" />
                <button
                  type="button"
                  className="truncate min-w-0 hover:text-foreground transition cursor-pointer text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (creatorId) openPublicProfileModal(creatorId);
                  }}
                >
                  {creatorName}
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
              {showDualPrices ? (
                <>
                  <span className="text-[10px] text-muted-foreground line-through">
                    {formatPrice(deal.original_price!, deal.currency)}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {formatPrice(deal.deal_price!, deal.currency)}
                  </span>
                  {showDiscountBadge && (
                    <Badge className="text-[9px] bg-primary/15 text-primary border-0 px-1 py-0 font-semibold">
                      %{deal.discount_percent}
                    </Badge>
                  )}
                </>
              ) : showSingleGreenPrice ? (
                <>
                  <span className="text-xs font-bold text-emerald-600">
                    {formatPrice(deal.deal_price!, deal.currency)}
                  </span>
                  {showDiscountBadge && (
                    <Badge className="text-[9px] bg-primary/15 text-primary border-0 px-1 py-0 font-semibold">
                      %{deal.discount_percent}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground">{t("deal.viewDeal")}</span>
              )}
              {deal.coupon_code && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 px-1 py-[1px] text-[8px] font-semibold shrink-0"
                  title={t("coupon.title")}
                >
                  <Ticket className="h-2 w-2" />
                  {t("coupon.badgeShort")}
                </span>
              )}
            </div>
          </div>
          <div
            className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 min-w-0 w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            data-no-skeleton
          >
            <div className="min-w-0 flex-1 overflow-hidden">
              <DealCountdown
                endAt={deal.end_at}
                compact
                showStatusLabel={false}
                className="text-[9px] leading-tight"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {deal.external_url && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(deal.external_url!, "_blank", "noopener,noreferrer");
                  }}
                  className="p-1.5 rounded-lg transition cursor-pointer shadow-sm bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-primary"
                  title={t("deal.getDeal")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
              <SaveRemindButton dealId={deal.id} compact />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        onMouseEnter={prefetchDetail}
        onTouchStart={prefetchDetail}
        className="w-full min-w-0 max-w-full hover:opacity-95 active:scale-[0.99] transition-transform cursor-pointer"
        onClick={goToDeal}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToDeal();
          }
        }}
      >
          <div
            className={cn(
              "rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/40 flex gap-3 p-2.5 min-w-0 max-w-full",
              surface === "feed" && "bg-muted/20 border-l-2 border-l-primary/30",
              isVeryUrgent && "critical-glow",
              isUrgent && !isVeryUrgent && "urgent-glow"
            )}
          >
            <div className="relative w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden">
              {deal.image_url ? (
                <Image
                  src={deal.image_url}
                  alt={deal.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                  quality={90}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/40 text-xs">
                  {deal.category || deal.provider}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
              <h3 className="font-semibold text-[13px] leading-tight line-clamp-1">
                {deal.title}
              </h3>
              {!hideCreator && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <User2 className="h-3 w-3 text-muted-foreground/80" />
                  <button
                    type="button"
                    className="truncate hover:text-foreground transition cursor-pointer text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (creatorId) openPublicProfileModal(creatorId);
                    }}
                  >
                    {creatorName}
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1 justify-between">
                <div className="flex items-center gap-2">
                  {showDualPrices ? (
                    <>
                      <span className="text-[11px] text-muted-foreground line-through">
                        {formatPrice(deal.original_price!, deal.currency)}
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatPrice(deal.deal_price!, deal.currency)}
                      </span>
                      {showDiscountBadge && (
                        <Badge className="text-[10px] bg-primary/15 text-primary border-0 px-1.5 py-0 font-semibold">
                          %{deal.discount_percent}
                        </Badge>
                      )}
                    </>
                  ) : showSingleGreenPrice ? (
                    <>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatPrice(deal.deal_price!, deal.currency)}
                      </span>
                      {showDiscountBadge && (
                        <Badge className="text-[10px] bg-primary/15 text-primary border-0 px-1.5 py-0 font-semibold">
                          %{deal.discount_percent}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("deal.viewDeal")}</span>
                  )}
                </div>
                {deal.coupon_code && (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-[1px] text-[9px] font-semibold shrink-0"
                    title={t("coupon.title")}
                  >
                    <Ticket className="h-2.5 w-2.5" />
                    {t("coupon.badgeShort")}
                  </span>
                )}
              </div>
            </div>
            <div
              className="flex flex-col items-end justify-center gap-1 shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              data-no-skeleton
            >
              <div className="flex items-center gap-1.5">
                {deal.external_url && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(deal.external_url!, "_blank", "noopener,noreferrer");
                    }}
                    className="p-2 rounded-xl transition cursor-pointer shadow-sm bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-primary"
                    title={t("deal.viewDeal")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
                <SaveRemindButton dealId={deal.id} compact />
              </div>
              <DealCountdown
                endAt={deal.end_at}
                compact
                showStatusLabel={!hideCountdownStatusLabel}
                className="text-[10px]"
              />
            </div>
          </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={prefetchDetail}
      onTouchStart={prefetchDetail}
      className={cn(
        "hover:-translate-y-[3px] active:scale-[0.97] transition-transform duration-200 cursor-pointer",
        horizontal ? "flex-shrink-0 w-[280px] snap-start" : "w-full"
      )}
      onClick={goToDeal}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDeal();
        }
      }}
    >
        <div
          className={cn(
            "rounded-2xl bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/40",
            isVeryUrgent && "critical-glow",
            isUrgent && !isVeryUrgent && "urgent-glow",
            isTrending && "ring-1 ring-orange-200/60"
          )}
        >
          {isTrending && (
            <div className="h-[3px] bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
          )}
          <div className="relative aspect-square bg-muted overflow-hidden">
            {deal.image_url ? (
              <Image
                src={deal.image_url}
                alt={deal.title}
                fill
                className="object-cover"
                sizes={horizontal ? "280px" : "(max-width: 768px) 100vw, 480px"}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm font-medium">
                {t("deal.noImage")}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

            <div className="absolute top-2.5 left-2.5">
              <Badge className="text-[10px] bg-black/50 text-white border-0 backdrop-blur-md px-2.5 py-0.5 font-semibold">
                {deal.category || deal.provider}
              </Badge>
            </div>

            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
              {showDiscountBadge && (
                <Badge className="text-xs bg-emerald-500 text-white border-0 font-bold px-2.5 py-0.5 shadow-sm">
                  -%{deal.discount_percent}
                </Badge>
              )}
            </div>

            <div
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5"
              onClick={(e) => e.preventDefault()}
              data-no-skeleton
            >
              {deal.external_url && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(deal.external_url!, "_blank", "noopener,noreferrer");
                  }}
                  className="p-2 rounded-xl transition cursor-pointer shadow-sm bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-primary"
                  title={t("deal.viewDeal")}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
              <SaveRemindButton dealId={deal.id} compact />
            </div>
          </div>

          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-[15px] leading-tight line-clamp-1 flex-1 min-w-0">
                {deal.title}
              </h3>
              {!hideCreator && (
                <div className="flex items-center gap-1 text-[12px] text-muted-foreground shrink-0 pl-1">
                  <User2 className="h-3.5 w-3.5 text-muted-foreground/80" />
                  <button
                    type="button"
                    className="max-w-[120px] truncate hover:text-foreground transition cursor-pointer text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (creatorId) openPublicProfileModal(creatorId);
                    }}
                  >
                    {creatorName}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <DealCountdown endAt={deal.end_at} compact showStatusLabel={!hideCountdownStatusLabel} />
              <HeatBadge score={deal.heat_score} forceTrending={isTrending} />
            </div>

            <div className="min-h-[20px] flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                {showDualPrices ? (
                  <>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(deal.original_price!, deal.currency)}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      {formatPrice(deal.deal_price!, deal.currency)}
                    </span>
                  </>
                ) : showSingleGreenPrice ? (
                  <span className="text-sm font-extrabold text-emerald-600">
                    {formatPrice(deal.deal_price!, deal.currency)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{t("deal.viewDeal")}</span>
                )}
              </div>
              {deal.coupon_code && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-[1px] text-[9px] font-semibold shrink-0"
                  title={t("coupon.title")}
                >
                  <Ticket className="h-3 w-3" />
                  {t("coupon.badgeShort")}
                </span>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
