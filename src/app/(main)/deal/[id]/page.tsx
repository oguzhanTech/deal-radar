import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DealDetailContent } from "./deal-detail-content";
import type { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: deal } = await supabase.from("deals").select("*").eq("id", id).single();
    if (!deal) return { title: "Fırsat bulunamadı" };
    return {
      title: `${deal.title} — Topla`,
      description: deal.description || `%${deal.discount_percent} indirim — ${deal.provider}`,
      openGraph: {
        title: deal.title,
        description: deal.description || undefined,
        images: deal.image_url ? [deal.image_url] : undefined,
      },
    };
  } catch {
    return { title: "Fırsat — Topla" };
  }
}

export default async function DealPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    const [{ data: deal }, { data: comments }, { count: saveCount }, { data: voteData }] = await Promise.all([
      supabase.from("deals").select("*").eq("id", id).single(),
      supabase
        .from("deal_comments")
        .select("*, profile:profiles(display_name, trust_score)")
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
    ]);

    if (!deal) notFound();

    const voteCount = (voteData ?? []).reduce((sum, v) => sum + v.vote, 0);

    const { data: similarDeals } = await supabase
      .from("deals")
      .select("*")
      .eq("status", "approved")
      .eq("provider", deal.provider)
      .neq("id", deal.id)
      .gt("end_at", new Date().toISOString())
      .limit(5);

    try { await supabase.rpc("increment_view_count", { target_deal_id: id }); } catch {}

    return (
      <DealDetailContent
        deal={deal}
        comments={comments ?? []}
        voteCount={voteCount}
        saveCount={saveCount ?? 0}
        similarDeals={similarDeals ?? []}
      />
    );
  } catch {
    notFound();
  }
}
