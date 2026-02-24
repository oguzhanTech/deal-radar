"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { DealCountdown } from "./deal-countdown";
import { HeatBadge } from "./heat-badge";
import { SaveRemindButton } from "./save-remind-button";
import { getCountryFlag, formatPrice } from "@/lib/utils";
import type { Deal } from "@/lib/types/database";

interface DealCardProps {
  deal: Deal;
  horizontal?: boolean;
}

export function DealCard({ deal, horizontal = false }: DealCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={
        horizontal
          ? "flex-shrink-0 w-[280px] snap-start"
          : "w-full"
      }
    >
      <Link href={`/deal/${deal.id}`} className="block">
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Image */}
          <div className="relative aspect-[16/9] bg-muted">
            {deal.image_url ? (
              <Image
                src={deal.image_url}
                alt={deal.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 280px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No image
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              <Badge className="text-[10px] bg-black/60 text-white border-0 backdrop-blur-sm">
                {deal.provider}
              </Badge>
            </div>

            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
              <Badge variant="secondary" className="text-[10px] bg-white/90 text-foreground border-0">
                {getCountryFlag(deal.country)} {deal.country}
              </Badge>
              {deal.discount_percent && (
                <Badge className="text-[10px] bg-green-500 text-white border-0 font-bold">
                  -{deal.discount_percent}%
                </Badge>
              )}
            </div>

            {/* Save button overlay */}
            <div className="absolute bottom-2 right-2" onClick={(e) => e.preventDefault()}>
              <SaveRemindButton dealId={deal.id} compact />
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-1.5">
            <h3 className="font-semibold text-sm line-clamp-1">{deal.title}</h3>

            <div className="flex items-center justify-between">
              <DealCountdown endAt={deal.end_at} compact />
              <HeatBadge score={deal.heat_score} />
            </div>

            {deal.deal_price != null && deal.original_price != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(deal.original_price, deal.currency)}
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatPrice(deal.deal_price, deal.currency)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
