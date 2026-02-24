import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DealDetailContent } from "./deal-detail-content";
import { DEMO_DEALS } from "@/lib/demo-data";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  // Check demo data first
  const demoDeal = DEMO_DEALS.find((d) => d.id === id);
  if (demoDeal) {
    return {
      title: `${demoDeal.title} — DealRadar`,
      description: demoDeal.description || `${demoDeal.discount_percent}% off ${demoDeal.provider}`,
    };
  }

  try {
    const supabase = await createClient();
    const { data: deal } = await supabase.from("deals").select("*").eq("id", id).single();
    if (!deal) return { title: "Deal not found" };
    return {
      title: `${deal.title} — DealRadar`,
      description: deal.description || `${deal.discount_percent}% off ${deal.provider}`,
      openGraph: {
        title: deal.title,
        description: deal.description || undefined,
        images: deal.image_url ? [deal.image_url] : undefined,
      },
    };
  } catch {
    return { title: "Deal — DealRadar" };
  }
}

export default async function DealPage({ params }: PageProps) {
  const { id } = await params;

  // Check demo data first
  const demoDeal = DEMO_DEALS.find((d) => d.id === id);
  if (demoDeal) {
    const similarDemos = DEMO_DEALS.filter(
      (d) => d.id !== id && d.provider === demoDeal.provider
    ).slice(0, 3);

    return (
      <DealDetailContent
        deal={demoDeal}
        comments={[]}
        voteCount={Math.floor(demoDeal.heat_score / 3)}
        saveCount={Math.floor(demoDeal.heat_score / 2)}
        similarDeals={similarDemos}
      />
    );
  }

  try {
    const supabase = await createClient();

    const [{ data: deal }, { data: comments }, { count: saveCount }] = await Promise.all([
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
    ]);

    if (!deal) notFound();

    const { data: voteData } = await supabase
      .from("deal_votes")
      .select("vote")
      .eq("deal_id", id);

    const voteCount = (voteData ?? []).reduce((sum, v) => sum + v.vote, 0);

    const { data: similarDeals } = await supabase
      .from("deals")
      .select("*")
      .eq("status", "approved")
      .eq("provider", deal.provider)
      .neq("id", deal.id)
      .gt("end_at", new Date().toISOString())
      .limit(5);

    // Increment view count
    await supabase.rpc("increment_view_count", { target_deal_id: id }).catch(() => {});

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
