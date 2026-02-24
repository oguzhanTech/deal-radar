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
