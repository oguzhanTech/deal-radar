"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { DealCountdown } from "./deal-countdown";
import { HeatBadge } from "./heat-badge";
import { SaveRemindButton } from "./save-remind-button";
import { getCountryFlag, formatPrice } from "@/lib/utils";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { HEAT_TRENDING_THRESHOLD } from "@/lib/constants";
import type { Deal } from "@/lib/types/database";

interface DealCardProps {
  deal: Deal;
  horizontal?: boolean;
}

export function DealCard({ deal, horizontal = false }: DealCardProps) {
  const { isUrgent, isVeryUrgent } = useCountdown(deal.end_at);
  const isTrending = deal.heat_score >= HEAT_TRENDING_THRESHOLD;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={horizontal ? "flex-shrink-0 w-[280px] snap-start" : "w-full"}
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
          {/* Image */}
          <div className="relative aspect-[16/9] bg-muted overflow-hidden">
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
                No image
              </div>
            )}

            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

            {/* Provider pill */}
            <div className="absolute top-2.5 left-2.5">
              <Badge className="text-[10px] bg-black/50 text-white border-0 backdrop-blur-md px-2.5 py-0.5 font-semibold">
                {deal.provider}
              </Badge>
            </div>

            {/* Country + Discount */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
              <Badge variant="secondary" className="text-[10px] bg-white/90 backdrop-blur-sm text-foreground border-0 font-medium px-2 py-0.5">
                {getCountryFlag(deal.country)} {deal.country}
              </Badge>
              {deal.discount_percent && (
                <Badge className="text-xs bg-emerald-500 text-white border-0 font-bold px-2.5 py-0.5 shadow-sm">
                  -{deal.discount_percent}%
                </Badge>
              )}
            </div>

            {/* Save button */}
            <div className="absolute bottom-2.5 right-2.5" onClick={(e) => e.preventDefault()}>
              <SaveRemindButton dealId={deal.id} compact />
            </div>
          </div>

          {/* Content */}
          <div className="p-3.5 space-y-2">
            <h3 className="font-bold text-[15px] leading-tight line-clamp-1">{deal.title}</h3>

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
                <span className="text-xs text-muted-foreground">View deal</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
