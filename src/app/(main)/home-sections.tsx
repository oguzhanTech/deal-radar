import { createAnonClient } from "@/lib/supabase/server";
import { DealSection } from "@/components/deals/deal-section";
import { EditorPickWidget } from "@/components/home/editor-pick-widget";
import { ActivityFeedWidget } from "@/components/home/activity-feed-widget";
import { t } from "@/lib/i18n";
import type { Deal, HeroAnnouncement } from "@/lib/types/database";
import type { HeroDeal, HeroSlide } from "@/components/home/home-hero-carousel";
import type { Activity } from "@/lib/types/database";

type HomeDeal = Deal & { profile?: { display_name: string | null } | null };
type EditorPickData = { deal: Deal; editorName: string | null } | null;

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

  const activities = (data ?? []) as unknown as Activity[];
  if (activities.length === 0) return activities;

  const userIds = [...new Set(activities.map((a) => a.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, profile_image_url")
    .in("user_id", userIds);

  const urlByUser = new Map(
    (profiles ?? []).map((p: { user_id: string; profile_image_url: string | null }) => [
      p.user_id,
      p.profile_image_url ?? null,
    ])
  );

  const dealIds = [...new Set(activities.map((a) => a.deal_id).filter(Boolean))];
  const { data: dealRows } =
    dealIds.length > 0
      ? await supabase.from("deals").select("id, slug").in("id", dealIds)
      : { data: [] as { id: string; slug: string }[] };
  const slugByDealId = new Map((dealRows ?? []).map((d) => [d.id, d.slug]));

  return activities.map((a) => ({
    ...a,
    payload: {
      ...a.payload,
      profile_image_url: urlByUser.get(a.user_id) ?? a.payload.profile_image_url ?? null,
      deal_slug: slugByDealId.get(a.deal_id) ?? a.payload.deal_slug ?? null,
    },
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
    .limit(10);
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
    .limit(10);
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
    .limit(10);
  return attachCreators(data ?? []);
}

interface HeroDealPools {
  endingSoon: HomeDeal[];
  popular: HomeDeal[];
  newest: HomeDeal[];
}

export async function getHeroDeals(pools?: HeroDealPools): Promise<HeroDeal[]> {
  const [endingSoon, popular, newest] = pools
    ? [pools.endingSoon, pools.popular, pools.newest]
    : await Promise.all([fetchEndingSoon(), fetchPopular(), fetchNewest()]);

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

export function buildHeroSlides(announcements: HeroAnnouncement[], heroDeals: HeroDeal[]): HeroSlide[] {
  const active = announcements
    .filter((a) => a.is_active && a.image_url?.trim())
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  const annSlides: HeroSlide[] = active.map((a) => ({
    kind: "announcement",
    id: a.id,
    title: a.title,
    body: a.body,
    image_url: a.image_url,
    link_url: a.link_url,
  }));
  const dealSlides: HeroSlide[] = heroDeals.map((deal) => ({ kind: "deal", deal }));
  // İstenen ürün davranışı: duyuru(lar) her zaman 2. slayttan itibaren yer alsın.
  if (annSlides.length === 0) return dealSlides;
  if (dealSlides.length === 0) return annSlides;
  return [dealSlides[0], ...annSlides, ...dealSlides.slice(1)];
}

export async function fetchHeroAnnouncements(): Promise<HeroAnnouncement[]> {
  const supabase = await createAnonClient();
  const { data, error } = await supabase
    .from("hero_announcements")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[fetchHeroAnnouncements]", error);
    return [];
  }
  return (data ?? []) as HeroAnnouncement[];
}

export async function hasActiveHeroAnnouncements(): Promise<boolean> {
  const supabase = await createAnonClient();
  const { data, error } = await supabase
    .from("hero_announcements")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[hasActiveHeroAnnouncements]", error);
    return false;
  }
  return !!data;
}

async function fetchNewest() {
  const supabase = await createAnonClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(10);
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

export async function HomeTrendingSection({ initialDeals }: HomeDealsSectionProps = {}) {
  const deals = initialDeals ?? (await fetchTrending());
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

interface HomeDealsSectionProps {
  initialDeals?: HomeDeal[];
}

export async function HomeEndingSoonSection({ initialDeals }: HomeDealsSectionProps = {}) {
  const deals = initialDeals ?? (await fetchEndingSoon());
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

export async function HomePopularSection({ initialDeals }: HomeDealsSectionProps = {}) {
  const deals = initialDeals ?? (await fetchPopular());
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

export async function HomeNewestSection({ initialDeals }: HomeDealsSectionProps = {}) {
  const deals = initialDeals ?? (await fetchNewest());
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

export async function HomeBiggestDropsSection({ initialDeals }: HomeDealsSectionProps = {}) {
  const deals = initialDeals ?? (await fetchBiggestDrops());
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

export async function HomeCouponSection({ initialDeals }: HomeDealsSectionProps = {}) {
  const deals = initialDeals ?? (await fetchCouponDeals());
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

export async function HomeInternationalSection({ initialDeals }: HomeDealsSectionProps = {}) {
  const deals = initialDeals ?? (await fetchInternationalDeals());
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

interface HomeActivitySectionProps {
  initialActivities?: Activity[];
}

export async function HomeActivitySection({ initialActivities }: HomeActivitySectionProps = {}) {
  const activities = initialActivities ?? (await fetchRecentActivities(5));
  if (activities.length === 0) return null;
  return <ActivityFeedWidget activities={activities} />;
}

async function fetchEditorPick(): Promise<EditorPickData> {
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

interface HomeEditorPickSectionProps {
  initialResult?: EditorPickData;
}

export async function HomeEditorPickSection({ initialResult }: HomeEditorPickSectionProps = {}) {
  const result = initialResult ?? (await fetchEditorPick());
  if (!result) return null;
  return <EditorPickWidget deal={result.deal} editorQuote={result.deal.editor_pick_quote ?? null} editorName={result.editorName} />;
}

export async function getHomePageData() {
  const [
    endingSoon,
    popular,
    newest,
    trending,
    biggestDrops,
    couponDeals,
    internationalDeals,
    activities,
    editorPick,
    heroAnnouncements,
  ] = await Promise.all([
    fetchEndingSoon(),
    fetchPopular(),
    fetchNewest(),
    fetchTrending(),
    fetchBiggestDrops(),
    fetchCouponDeals(),
    fetchInternationalDeals(),
    fetchRecentActivities(5),
    fetchEditorPick(),
    fetchHeroAnnouncements(),
  ]);

  const heroDeals = await getHeroDeals({ endingSoon, popular, newest });
  const heroSlides = buildHeroSlides(heroAnnouncements, heroDeals);

  return {
    heroDeals,
    heroAnnouncements,
    heroSlides,
    endingSoon,
    popular,
    newest,
    trending,
    biggestDrops,
    couponDeals,
    internationalDeals,
    activities,
    editorPick,
  };
}

/** Masaüstü sağ rail: havuzlardan karışık, editör seçimiyle çakışmayan en fazla 8 fırsat (ek DB yok). */
export function pickDesktopRailDeals(data: Awaited<ReturnType<typeof getHomePageData>>): Deal[] {
  const editorId = data.editorPick?.deal.id;
  const skip = new Set<string>();
  if (editorId) skip.add(editorId);

  const slices: Deal[] = [
    ...data.trending.slice(0, 2),
    ...data.newest.slice(0, 2),
    ...data.popular.slice(0, 2),
    ...data.endingSoon.slice(0, 2),
    ...data.biggestDrops.slice(0, 2),
  ];

  const seen = new Set<string>();
  const out: Deal[] = [];
  for (const d of slices) {
    if (skip.has(d.id)) continue;
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    out.push(d);
    if (out.length >= 8) break;
  }
  return out;
}
