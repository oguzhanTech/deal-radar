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
  "Other",
] as const;

export const CATEGORIES = [
  "Streaming",
  "Gaming",
  "Software",
  "Cloud",
  "Music",
  "Social",
  "Security",
  "Productivity",
  "Other",
] as const;

export const COUNTRIES = [
  { code: "GLOBAL", name: "Global" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "TR", name: "Turkey" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "TRY", "JPY", "BRL", "INR", "CAD", "AUD"] as const;

export const DEFAULT_REMINDER_SETTINGS = {
  "3d": true,
  "1d": true,
  "6h": true,
  "1h": true,
};

export const HEAT_TRENDING_THRESHOLD = 50;
export const TRUSTED_SUBMITTER_THRESHOLD = 20;

export const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, max: 49, label: "Newcomer" },
  { level: 2, min: 50, max: 149, label: "Explorer" },
  { level: 3, min: 150, max: 399, label: "Hunter" },
  { level: 4, min: 400, max: 999, label: "Expert" },
  { level: 5, min: 1000, max: Infinity, label: "Legend" },
] as const;

export const BADGE_INFO: Record<string, { label: string; emoji: string; description: string }> = {
  early_hunter: { label: "Early Hunter", emoji: "🎯", description: "First approved deal" },
  trending_hunter: { label: "Trending Hunter", emoji: "🔥", description: "Deal reached trending" },
  community_builder: { label: "Community Builder", emoji: "🏗️", description: "10+ approved deals" },
  trusted_submitter: { label: "Trusted Submitter", emoji: "⭐", description: "Level 3+ with 3+ approved deals" },
};
