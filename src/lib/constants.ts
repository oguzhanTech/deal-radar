export const PROVIDERS = [
  "Netflix",
  "Steam",
  "PlayStation",
  "Amazon",
  "X (Twitter)",
  "Spotify",
  "Adobe",
  "NordVPN",
  "Microsoft",
  "Apple",
  "Google",
  "Trendyol",
  "Hepsiburada",
  "Diğer",
] as const;

export const CATEGORIES = [
  "Yayın",
  "Oyun",
  "Yazılım",
  "Bulut",
  "Müzik",
  "Sosyal",
  "Güvenlik",
  "Verimlilik",
  "Alışveriş",
  "Diğer",
] as const;

export const CURRENCIES = ["TRY", "USD", "EUR"] as const;

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

export const BADGE_INFO: Record<string, { label: string; emoji: string; description: string }> = {
  early_hunter: { label: "İlk Adım", emoji: "🎯", description: "İlk onaylanan fırsat" },
  trending_hunter: { label: "Trend Avcısı", emoji: "🔥", description: "Fırsatı trend oldu" },
  community_builder: { label: "Topluluk Destekçisi", emoji: "🏗️", description: "10+ onaylı fırsat" },
  trusted_submitter: { label: "Güvenilir Paylaşımcı", emoji: "⭐", description: "Seviye 3+ ve 3+ onaylı fırsat" },
};
