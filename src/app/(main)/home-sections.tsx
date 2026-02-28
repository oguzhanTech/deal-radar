import { createReadOnlyClient } from "@/lib/supabase/server";
import { DealSection } from "@/components/deals/deal-section";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";

async function fetchTrending() {
  const supabase = await createReadOnlyClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .gte("heat_score", 20)
    .order("heat_score", { ascending: false })
    .limit(8);
  return data ?? [];
}

async function fetchEndingSoon() {
  const supabase = await createReadOnlyClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .order("end_at", { ascending: true })
    .limit(10);
  return data ?? [];
}

async function fetchPopular() {
  const supabase = await createReadOnlyClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .order("heat_score", { ascending: false })
    .limit(10);
  return data ?? [];
}

async function fetchNewest() {
  const supabase = await createReadOnlyClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

export async function HomeTrendingSection() {
  const deals = await fetchTrending();
  if (deals.length === 0) return null;
  return (
    <DealSection
      title={t("home.trending")}
      emoji="🔥"
      deals={deals as Deal[]}
      seeAllHref="/search?sort=trending"
    />
  );
}

export async function HomeEndingSoonSection() {
  const deals = await fetchEndingSoon();
  if (deals.length === 0) return null;
  return (
    <DealSection
      title={t("home.endingSoon")}
      emoji="⏰"
      deals={deals as Deal[]}
      seeAllHref="/search?sort=popular"
    />
  );
}

export async function HomePopularSection() {
  const deals = await fetchPopular();
  if (deals.length === 0) return null;
  return (
    <DealSection
      title={t("home.popular")}
      emoji="💎"
      deals={deals as Deal[]}
      seeAllHref="/search?sort=popular"
    />
  );
}

export async function HomeNewestSection() {
  const deals = await fetchNewest();
  if (deals.length === 0) return null;
  return (
    <DealSection
      title={t("home.newDeals")}
      emoji="✨"
      deals={deals as Deal[]}
      seeAllHref="/search?sort=new"
    />
  );
}
