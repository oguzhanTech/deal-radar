import type { SupabaseClient } from "@supabase/supabase-js";

/** Başlıktan SEO slug (Türkçe karakterler sadeleştirilir) */
export function slugifyDealTitle(title: string): string {
  const map: [string, string][] = [
    ["ğ", "g"],
    ["ü", "u"],
    ["ş", "s"],
    ["ı", "i"],
    ["i", "i"],
    ["ö", "o"],
    ["ç", "c"],
    ["Ğ", "g"],
    ["Ü", "u"],
    ["Ş", "s"],
    ["İ", "i"],
    ["Ö", "o"],
    ["Ç", "c"],
  ];
  let s = title.trim().toLowerCase();
  for (const [a, b] of map) {
    s = s.split(a).join(b);
  }
  s = s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  if (!s) s = "firsat";
  return s.slice(0, 80);
}

/**
 * Veritabanında olmayan ilk slug'ı döndür: base, base-2, base-3, ...
 */
export async function ensureUniqueDealSlug(
  supabase: SupabaseClient,
  title: string,
  excludeDealId?: string
): Promise<string> {
  const base = slugifyDealTitle(title);
  for (let i = 0; i < 500; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await supabase.from("deals").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    if (excludeDealId && data.id === excludeDealId) return candidate;
  }
  throw new Error("Slug üretilemedi.");
}
