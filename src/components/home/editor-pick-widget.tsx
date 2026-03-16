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

interface EditorPickWidgetProps {
  deal: Deal;
  editorQuote?: string | null;
  editorName?: string | null;
}

export function EditorPickWidget({ deal, editorQuote, editorName }: EditorPickWidgetProps) {
  const router = useRouter();
  const { isUrgent, isVeryUrgent } = useCountdown(deal.end_at);
  const prefetchDetail = () => router.prefetch(`/deal/${deal.id}`);

  return (
    <section className="space-y-2 px-4">
      <h2 className="text-base font-extrabold flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
        {t("home.editorPick")}
      </h2>
      <div
        onMouseEnter={prefetchDetail}
        onTouchStart={prefetchDetail}
        className="w-full hover:opacity-95 active:scale-[0.99] transition-transform"
      >
        <Link href={`/deal/${deal.id}`} prefetch className="block">
          <div
            className={cn(
              "rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/40 border-l-4 border-l-amber-500 flex gap-3 p-2.5",
              isVeryUrgent && "critical-glow",
              isUrgent && !isVeryUrgent && "urgent-glow"
            )}
          >
            <div className="relative w-28 h-28 rounded-lg bg-muted shrink-0 overflow-hidden">
              {deal.image_url ? (
                <Image
                  src={deal.image_url}
                  alt={deal.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                  quality={90}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/40 text-xs">
                  {deal.category || deal.provider}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1 min-w-0">
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
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {deal.deal_price != null && deal.original_price != null ? (
                  <>
                    <span className="text-[11px] md:text-xs text-muted-foreground line-through">
                      {formatPrice(deal.original_price, deal.currency)}
                    </span>
                    <span className="text-sm md:text-lg font-extrabold text-emerald-600">
                      {formatPrice(deal.deal_price, deal.currency)}
                    </span>
                    {deal.discount_percent && (
                      <Badge className="text-[10px] md:text-[11px] bg-primary/15 text-primary border-0 px-1.5 py-0 font-semibold">
                        %{deal.discount_percent}
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-xs md:text-sm text-muted-foreground">{t("deal.viewDeal")}</span>
                )}
              </div>
              {(editorQuote || editorName) && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {editorQuote && <span>&quot;{editorQuote}&quot;</span>}
                  {editorQuote && editorName && " — "}
                  {editorName && <span>{editorName}</span>}
                </p>
              )}
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
                    title={t("deal.getDeal")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
                <SaveRemindButton dealId={deal.id} compact />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
