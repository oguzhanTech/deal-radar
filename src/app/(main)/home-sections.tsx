import { createAnonClient } from "@/lib/supabase/server";
import { DealSection } from "@/components/deals/deal-section";
import { EditorPickWidget } from "@/components/home/editor-pick-widget";
import { ActivityFeedWidget } from "@/components/home/activity-feed-widget";
import { t } from "@/lib/i18n";
import type { Deal } from "@/lib/types/database";
import type { HeroDeal } from "@/components/home/home-hero-carousel";
import type { Activity } from "@/lib/types/database";

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

async function fetchRecentActivities(limit = 5): Promise<Activity[]> {
  const supabase = await createAnonClient();
  const { data } = await supabase
    .from("activities")
    .select("id,type,user_id,deal_id,comment_id,payload,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as Activity[];
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
  const deals = await attachCreators(data ?? []);
  return deals.map((deal) => ({ ...deal, is_trending: true }));
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
  const usedIds = new Set<string>();

  if (endingSoon.length) {
    const i = Math.floor(Math.random() * endingSoon.length);
    const deal = endingSoon[i] as Deal;
    picks.push({ ...deal, section: "endingSoon" });
    usedIds.add(deal.id);
  }

  if (popular.length) {
    const candidates = popular.filter((d) => !usedIds.has(d.id));
    if (candidates.length) {
      const i = Math.floor(Math.random() * candidates.length);
      const deal = candidates[i] as Deal;
      picks.push({ ...deal, section: "popular" });
      usedIds.add(deal.id);
    }
  }

  if (newest.length) {
    const candidates = newest.filter((d) => !usedIds.has(d.id));
    if (candidates.length) {
      const i = Math.floor(Math.random() * candidates.length);
      const deal = candidates[i] as Deal;
      picks.push({ ...deal, section: "newest" });
      usedIds.add(deal.id);
    }
  }

  // Kalan slotları benzersiz deal'larla 5'e tamamla
  if (picks.length < 5) {
    const extras: { deal: Deal; section: HeroDeal["section"] }[] = [];

    for (const d of endingSoon) {
      if (!usedIds.has(d.id)) extras.push({ deal: d as Deal, section: "endingSoon" });
    }
    for (const d of popular) {
      if (!usedIds.has(d.id)) extras.push({ deal: d as Deal, section: "popular" });
    }
    for (const d of newest) {
      if (!usedIds.has(d.id)) extras.push({ deal: d as Deal, section: "newest" });
    }

    // Basit shuffle
    for (let i = extras.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [extras[i], extras[j]] = [extras[j], extras[i]];
    }

    for (const { deal, section } of extras) {
      if (picks.length >= 5) break;
      if (usedIds.has(deal.id)) continue;
      picks.push({ ...deal, section });
      usedIds.add(deal.id);
    }
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

async function fetchBiggestDrops(): Promise<HomeDeal[]> {
  const supabase = await createAnonClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .limit(20);
  const list = (data ?? []) as Deal[];
  const sorted = [...list].sort((a, b) => (b.discount_percent ?? -1) - (a.discount_percent ?? -1));
  return attachCreators(sorted.slice(0, 5));
}

async function fetchCouponDeals(): Promise<HomeDeal[]> {
  const supabase = await createAnonClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .gt("end_at", now)
    .not("coupon_code", "is", null)
    .or(`coupon_expiry.is.null,coupon_expiry.gt.${now}`)
    .limit(12);

  const list = (data ?? []) as Deal[];
  // Basit shuffle
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return attachCreators(list.slice(0, 3));
}

async function fetchInternationalDeals(): Promise<HomeDeal[]> {
  const supabase = await createAnonClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .eq("category", "Yurtdışı fırsatları")
    .gt("end_at", new Date().toISOString())
    .limit(20);
  const list = (data ?? []) as Deal[];
  // Basit shuffle
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return attachCreators(list.slice(0, 5));
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
      seeAllHref="/search?sort=endingSoon"
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

export async function HomeBiggestDropsSection() {
  const deals = await fetchBiggestDrops();
  if (deals.length === 0) return null;
  return (
    <DealSection
      title={t("home.biggestDrops")}
      emoji="📉"
      deals={deals as unknown as Deal[]}
      seeAllHref="/search?sort=discount"
    />
  );
}

export async function HomeCouponSection() {
  const deals = await fetchCouponDeals();
  if (deals.length === 0) return null;
  return (
    <DealSection
      title={t("home.couponDeals")}
      emoji="🎟️"
      deals={deals as unknown as Deal[]}
      seeAllHref="/search?hasCoupon=1"
    />
  );
}

export async function HomeInternationalSection() {
  const deals = await fetchInternationalDeals();
  if (deals.length === 0) return null;
  return (
    <DealSection
      title={t("home.internationalDeals")}
      emoji="✈️"
      deals={deals as unknown as Deal[]}
      seeAllHref={`/search?category=${encodeURIComponent("Yurtdışı fırsatları")}`}
    />
  );
}

export async function HomeActivitySection() {
  const activities = await fetchRecentActivities(5);
  if (activities.length === 0) return null;
  return <ActivityFeedWidget activities={activities} />;
}

async function fetchEditorPick(): Promise<{ deal: Deal; editorName: string | null } | null> {
  const supabase = await createAnonClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("is_editor_pick", true)
    .eq("status", "approved")
    .gt("end_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (!deal) return null;
  const d = deal as Deal & { editor_pick_set_by?: string | null };
  let editorName: string | null = null;
  if (d.editor_pick_set_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", d.editor_pick_set_by)
      .single();
    editorName = profile?.display_name ?? null;
  }
  return { deal: d, editorName };
}

export async function HomeEditorPickSection() {
  const result = await fetchEditorPick();
  if (!result) return null;
  return <EditorPickWidget deal={result.deal} editorQuote={result.deal.editor_pick_quote ?? null} editorName={result.editorName} />;
}
