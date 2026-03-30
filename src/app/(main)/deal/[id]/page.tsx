import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DealDetailContent } from "./deal-detail-content";
import { DealJsonLd } from "@/components/seo/deal-json-ld";
import type { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: deal } = await supabase
      .from("deals")
      .select("title, description, discount_percent, category, provider, image_url, end_at")
      .eq("id", id)
      .single();
    if (!deal) return { title: "Fırsat bulunamadı" };

    const desc =
      deal.description?.trim() ||
      (deal.discount_percent != null
        ? `%${deal.discount_percent} indirim — ${deal.category || deal.provider}`
        : `${deal.category || deal.provider} — Topla fırsatı`);

    const expired = new Date(deal.end_at) < new Date();

    return {
      title: `${deal.title} — Topla`,
      description: desc,
      alternates: { canonical: `/deal/${id}` },
      openGraph: {
        type: "article",
        title: deal.title,
        description: deal.description || desc,
        images: deal.image_url ? [{ url: deal.image_url }] : undefined,
        url: `/deal/${id}`,
      },
      twitter: {
        card: "summary_large_image",
        title: deal.title,
        description: deal.description?.slice(0, 200) || desc.slice(0, 200),
        images: deal.image_url ? [deal.image_url] : undefined,
      },
      ...(expired ? { robots: { index: false, follow: true } } : {}),
    };
  } catch {
    return { title: "Fırsat — Topla" };
  }
}

export default async function DealPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    const [{ data: deal }, { data: commentsRaw }, { count: saveCount }, { data: voteData }, { data: trendingTop }] = await Promise.all([
      supabase.from("deals").select("*").eq("id", id).single(),
      supabase
        .from("deal_comments")
        .select("*")
        .eq("deal_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("deal_saves")
        .select("*", { count: "exact", head: true })
        .eq("deal_id", id),
      supabase
        .from("deal_votes")
        .select("vote")
        .eq("deal_id", id),
      supabase
        .from("deals")
        .select("id")
        .eq("status", "approved")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("heat_score", { ascending: false })
        .limit(5),
    ]);

    if (!deal) notFound();

    const voteCount = (voteData ?? []).reduce((sum, v) => sum + v.vote, 0);

    // deal_comments has no FK to profiles; fetch profiles by user_id and attach
    type CommentRow = {
      id: string;
      deal_id: string;
      user_id: string;
      parent_comment_id: string | null;
      content: string;
      created_at: string;
    };
    type CommentProfile = { display_name: string | null; trust_score: number; level?: number; profile_image_url?: string | null };
    let comments: (CommentRow & { profile: CommentProfile })[] = [];
    if (commentsRaw && commentsRaw.length > 0) {
      const userIds = [...new Set((commentsRaw as { user_id: string }[]).map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, trust_score, level, profile_image_url")
        .in("user_id", userIds);
      const profileByUserId =
        profiles?.reduce<Record<string, CommentProfile>>((acc, p) => {
          acc[p.user_id] = {
            display_name: p.display_name ?? null,
            trust_score: p.trust_score ?? 0,
            level: p.level ?? 1,
            profile_image_url: p.profile_image_url ?? null,
          };
          return acc;
        }, {}) ?? {};
      comments = (commentsRaw as CommentRow[]).map((c) => ({
        ...c,
        profile: profileByUserId[c.user_id] ?? { display_name: null, trust_score: 0, level: 1, profile_image_url: null },
      }));
    }

    const [{ data: creatorProfile }, { data: similarDeals }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", deal.created_by)
        .maybeSingle(),
      supabase
        .from("deals")
        .select("*")
        .eq("status", "approved")
        .eq("provider", deal.provider)
        .neq("id", deal.id)
        .gt("end_at", new Date().toISOString())
        .limit(5),
    ]);

    const creatorName = creatorProfile?.display_name ?? null;

    const trendingIds = new Set((trendingTop ?? []).map((d) => d.id));
    const dealWithTrend = { ...deal, is_trending: trendingIds.has(deal.id) };
    const similarWithTrend = (similarDeals ?? []).map((d) => ({
      ...d,
      is_trending: trendingIds.has(d.id),
    }));

    void supabase.rpc("increment_view_count", { target_deal_id: id });

    return (
      <>
        <DealJsonLd deal={dealWithTrend} />
        <DealDetailContent
          deal={dealWithTrend}
          creatorName={creatorName}
          comments={comments ?? []}
          voteCount={voteCount}
          saveCount={saveCount ?? 0}
          similarDeals={similarWithTrend}
        />
      </>
    );
  } catch {
    notFound();
  }
}
