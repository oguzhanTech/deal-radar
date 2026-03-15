"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ExternalLink, User2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DealCountdown } from "./deal-countdown";
import { HeatBadge } from "./heat-badge";
import { SaveRemindButton } from "./save-remind-button";
import { formatPrice } from "@/lib/utils";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { HEAT_TRENDING_THRESHOLD } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";

interface DealCardProps {
  deal: Deal;
  horizontal?: boolean;
  /** Anasayfa kategorilerinde küçük widget (alt alta liste) */
  compact?: boolean;
  /** Creator satırını gizle (örn. Keşfet sayfasında başlığa daha fazla yer) */
  hideCreator?: boolean;
}

export function DealCard({ deal, horizontal = false, compact = false, hideCreator = false }: DealCardProps) {
  const router = useRouter();
  const { isUrgent, isVeryUrgent } = useCountdown(deal.end_at);
  const isTrending = deal.heat_score >= HEAT_TRENDING_THRESHOLD;

  const prefetchDetail = () => router.prefetch(`/deal/${deal.id}`);

  const creatorName =
    (deal as any).profile?.display_name || t("admin.users.unnamed");

  if (compact) {
    return (
      <div
        onMouseEnter={prefetchDetail}
        onTouchStart={prefetchDetail}
        className="w-full hover:opacity-95 active:scale-[0.99] transition-transform"
      >
        <Link href={`/deal/${deal.id}`} prefetch={true} className="block">
          <div
            className={cn(
              "rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/40 flex gap-3 p-2.5",
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
                  sizes="256px"
                  quality={90}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/40 text-xs">
                  {deal.category || deal.provider}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
              <h3 className="font-semibold text-[13px] leading-tight line-clamp-1">{deal.title}</h3>
              {!hideCreator && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <User2 className="h-3 w-3 text-muted-foreground/80" />
                  <span className="truncate">{creatorName}</span>
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {deal.deal_price != null && deal.original_price != null ? (
                  <>
                    <span className="text-[11px] text-muted-foreground line-through">
                      {formatPrice(deal.original_price, deal.currency)}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatPrice(deal.deal_price, deal.currency)}
                    </span>
                    {deal.discount_percent && (
                      <Badge className="text-[10px] bg-primary/15 text-primary border-0 px-1.5 py-0 font-semibold">
                        %{deal.discount_percent}
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">{t("deal.viewDeal")}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end justify-center gap-1 shrink-0" onClick={(e) => e.preventDefault()} data-no-skeleton>
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
              <DealCountdown endAt={deal.end_at} compact className="text-[10px]" />
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={prefetchDetail}
      onTouchStart={prefetchDetail}
      className={cn(
        "hover:-translate-y-[3px] active:scale-[0.97] transition-transform duration-200",
        horizontal ? "flex-shrink-0 w-[280px] snap-start" : "w-full"
      )}
    >
      <Link href={`/deal/${deal.id}`} prefetch={true} className="block">
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
              {deal.discount_percent && (
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
                  <span className="max-w-[120px] truncate">{creatorName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <DealCountdown endAt={deal.end_at} compact />
              <HeatBadge score={deal.heat_score} />
            </div>

            <div className="min-h-[20px] flex items-center gap-2">
              {deal.deal_price != null && deal.original_price != null ? (
                <>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(deal.original_price, deal.currency)}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    {formatPrice(deal.deal_price, deal.currency)}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{t("deal.viewDeal")}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
