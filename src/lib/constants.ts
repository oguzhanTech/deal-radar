import type { BadgeId } from "@/lib/types/database";
/** Fırsat oluştururken ve filtrelerde kullanılan kategoriler. */
export const DEAL_CATEGORIES = [
  "Teknoloji",
  "Market",
  "Giyim & Moda",
  "Ev & Yaşam",
  "Oyun",
  "Dijital Üyelikler",
  "Seyahat",
  "Kozmetik & Kişisel Bakım",
  "Spor & Outdoor",
  "Anne & Bebek",
  "Evcil Hayvan",
  "Hobi & Eğlence",
  "Banka kampanyaları",
  "Yurtdışı fırsatları",
] as const;

export const CURRENCIES = ["TL", "USD", "EUR"] as const;

export const DEFAULT_REMINDER_SETTINGS = {
  "3d": true,
  "1d": true,
  "6h": true,
  "1h": true,
};

export const HEAT_TRENDING_THRESHOLD = 50;
export const TRUSTED_SUBMITTER_THRESHOLD = 20;

export const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, max: 49, label: "Sessiz Takipçi" },
  { level: 2, min: 50, max: 149, label: "Yeni Toplayan" },
  { level: 3, min: 150, max: 399, label: "Fırsat Koklayıcısı" },
  { level: 4, min: 400, max: 699, label: "Radarı Açık" },
  { level: 5, min: 700, max: 999, label: "Kaçırmaz" },
  { level: 6, min: 1000, max: Infinity, label: "Efsane" },
] as const;

export const BADGE_INFO: Record<BadgeId, { label: string; emoji: string; description: string }> = {
  early_hunter: { label: "İlk Adım", emoji: "🎯", description: "İlk onaylanan fırsat" },
  trending_hunter: { label: "Trend Avcısı", emoji: "🔥", description: "Fırsatı trend oldu" },
  community_builder: { label: "Topluluk Destekçisi", emoji: "🏗️", description: "10+ onaylı fırsat" },
  trusted_submitter: { label: "Güvenilir Paylaşımcı", emoji: "⭐", description: "Seviye 3+ ve 3+ onaylı fırsat" },
  first_commenter: { label: "İlk Yorum", emoji: "💬", description: "İlk yorum yapıldı" },
  conversation_starter: { label: "Sohbet Başlatan", emoji: "🗣️", description: "10+ yorum yapıldı" },
  first_share: { label: "İlk Paylaşım", emoji: "📢", description: "İlk onaylı fırsat paylaşıldı" },
  active_submitter: { label: "Aktif Paylaşımcı", emoji: "🚀", description: "5+ onaylı fırsat paylaşıldı" },
  community_master: { label: "Topluluk Ustası", emoji: "👑", description: "20+ onaylı fırsat ve 25+ yorum" },
};
