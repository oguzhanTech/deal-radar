import { createAnonClient } from "@/lib/supabase/server";
import { DealSection } from "@/components/deals/deal-section";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";
import type { HeroDeal } from "@/components/home/home-hero-carousel";

type HomeDeal = Deal & { profile?: { display_name: string | null } | null };

async function attachCreators(deals: Deal[]): Promise<HomeDeal[]> {
  if (!deals.length) return [];
  const supabase = await createAnonClient();
  const userIds = Array.from(new Set(deals.map((d) => d.created_by)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);

  const map =
    profiles?.reduce<Record<string, string | null>>((acc, p) => {
      acc[p.user_id] = p.display_name ?? null;
      return acc;
    }, {}) ?? {};

  return deals.map((d) => ({
    ...d,
    profile: { display_name: map[d.created_by] ?? null },
  }));
}

async function fetchTrending() {
  const supabase = await createAnonClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .gte("heat_score", 20)
    .order("heat_score", { ascending: false })
    .limit(5);
  return attachCreators(data ?? []);
}

async function fetchEndingSoon() {
  const supabase = await createAnonClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .order("end_at", { ascending: true })
    .limit(5);
  return attachCreators(data ?? []);
}

async function fetchPopular() {
  const supabase = await createAnonClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .order("heat_score", { ascending: false })
    .limit(5);
  return attachCreators(data ?? []);
}

export async function getHeroDeals(): Promise<HeroDeal[]> {
  const [endingSoon, popular, newest] = await Promise.all([
    fetchEndingSoon(),
    fetchPopular(),
    fetchNewest(),
  ]);

  const picks: HeroDeal[] = [];

  if (endingSoon.length) {
    const i = Math.floor(Math.random() * endingSoon.length);
    picks.push({ ...(endingSoon[i] as Deal), section: "endingSoon" });
  }

  if (popular.length) {
    const i = Math.floor(Math.random() * popular.length);
    picks.push({ ...(popular[i] as Deal), section: "popular" });
  }

  if (newest.length) {
    const i = Math.floor(Math.random() * newest.length);
    picks.push({ ...(newest[i] as Deal), section: "newest" });
  }

  return picks;
}

async function fetchNewest() {
  const supabase = await createAnonClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5);
  return attachCreators(data ?? []);
}

export async function HomeTrendingSection() {
  const deals = await fetchTrending();
  if (deals.length === 0) return null;
  return (
    <DealSection
      title={t("home.trending")}
      emoji="🔥"
      deals={deals as unknown as Deal[]}
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
      deals={deals as unknown as Deal[]}
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
      emoji="🔥"
      deals={deals as unknown as Deal[]}
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
      deals={deals as unknown as Deal[]}
      seeAllHref="/search?sort=new"
    />
  );
}
