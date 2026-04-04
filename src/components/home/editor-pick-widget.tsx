"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExternalLink, Star, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SaveRemindButton } from "@/components/deals/save-remind-button";
import { formatPrice } from "@/lib/utils";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";
import { dealPath } from "@/lib/deal-url";

interface EditorPickWidgetProps {
  deal: Deal;
  editorQuote?: string | null;
  editorName?: string | null;
  /** Masaüstü sağ sütun gibi dar alanlarda yatay padding kaldırmak için */
  sectionClassName?: string;
  /** Dar sütun: dikey, küçük görsel */
  density?: "default" | "rail";
}

export function EditorPickWidget({
  deal,
  editorQuote,
  editorName,
  sectionClassName,
  density = "default",
}: EditorPickWidgetProps) {
  const router = useRouter();
  const { isUrgent, isVeryUrgent } = useCountdown(deal.end_at);
  const prefetchDetail = () => router.prefetch(dealPath(deal));
  const isRail = density === "rail";

  const actions = (
    <div
      className={cn(
        "flex shrink-0 gap-1.5",
        isRail ? "flex-row items-center justify-end w-full" : "flex-col items-end justify-center gap-1"
      )}
      onClick={(e) => e.preventDefault()}
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
            className={cn(
              "rounded-xl transition cursor-pointer shadow-sm bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-primary",
              isRail ? "p-1.5" : "p-2"
            )}
            title={t("deal.getDeal")}
          >
            <ExternalLink className={cn(isRail ? "h-3.5 w-3.5" : "h-4 w-4")} />
          </button>
        )}
        <SaveRemindButton dealId={deal.id} compact />
      </div>
    </div>
  );

  return (
    <section className={cn("space-y-2 px-4", sectionClassName)}>
      <h2
        className={cn(
          "font-extrabold flex items-center gap-1.5",
          isRail ? "text-sm" : "text-base"
        )}
      >
        <Star
          className={cn("text-amber-500 fill-amber-500 shrink-0", isRail ? "h-3 w-3" : "h-3.5 w-3.5")}
        />
        {t("home.editorPick")}
      </h2>
      <div
        onMouseEnter={prefetchDetail}
        onTouchStart={prefetchDetail}
        className="w-full hover:opacity-95 active:scale-[0.99] transition-transform min-w-0"
      >
        <Link href={dealPath(deal)} prefetch className="block min-w-0">
          <div
            className={cn(
              "rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/40 border-l-4 border-l-amber-500",
              isRail ? "flex flex-col gap-2 p-2 min-w-0" : "flex gap-3 p-2.5",
              isVeryUrgent && "critical-glow",
              isUrgent && !isVeryUrgent && "urgent-glow"
            )}
          >
            <div
              className={cn(
                "relative rounded-lg bg-muted shrink-0 overflow-hidden",
                isRail ? "w-full aspect-[5/3] max-h-[7rem]" : "w-28 h-28"
              )}
            >
              {deal.image_url ? (
                <Image
                  src={deal.image_url}
                  alt={deal.title}
                  fill
                  className="object-cover"
                  sizes={isRail ? "(min-width: 1024px) 240px, 112px" : "112px"}
                  quality={82}
                  loading="lazy"
                  fetchPriority={isRail ? "auto" : "low"}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/40 text-xs">
                  {deal.category || deal.provider}
                </div>
              )}
            </div>
            <div
              className={cn(
                "flex flex-col justify-center gap-0.5 min-w-0",
                !isRail && "flex-1"
              )}
            >
              <div className="flex items-start gap-1.5">
                <h3
                  className={cn(
                    "font-semibold leading-tight line-clamp-2 flex-1 min-w-0",
                    isRail ? "text-sm" : "text-base"
                  )}
                >
                  {deal.title}
                </h3>
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
              <div className={cn("flex items-center gap-1.5 flex-wrap", isRail ? "mt-0.5" : "mt-1")}>
                {deal.deal_price != null && deal.original_price != null ? (
                  <>
                    <span
                      className={cn(
                        "text-muted-foreground line-through",
                        isRail ? "text-[10px]" : "text-[11px] md:text-xs"
                      )}
                    >
                      {formatPrice(deal.original_price, deal.currency)}
                    </span>
                    <span
                      className={cn(
                        "font-extrabold text-emerald-600",
                        isRail ? "text-sm" : "text-sm md:text-lg"
                      )}
                    >
                      {formatPrice(deal.deal_price, deal.currency)}
                    </span>
                    {deal.discount_percent && (
                      <Badge
                        className={cn(
                          "bg-primary/15 text-primary border-0 px-1.5 py-0 font-semibold",
                          isRail ? "text-[9px]" : "text-[10px] md:text-[11px]"
                        )}
                      >
                        %{deal.discount_percent}
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className={cn("text-muted-foreground", isRail ? "text-xs" : "text-xs md:text-sm")}>
                    {t("deal.viewDeal")}
                  </span>
                )}
              </div>
              {(editorQuote || editorName) && (
                <p
                  className={cn(
                    "text-muted-foreground italic",
                    isRail ? "text-[10px] line-clamp-2 mt-0.5" : "text-xs mt-1"
                  )}
                >
                  {editorQuote && <span>&quot;{editorQuote}&quot;</span>}
                  {editorQuote && editorName && " — "}
                  {editorName && <span>{editorName}</span>}
                </p>
              )}
            </div>
            {actions}
          </div>
        </Link>
      </div>
    </section>
  );
}
