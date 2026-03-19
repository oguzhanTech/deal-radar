import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const supabase = await createAnonClient();
    const [{ data: profile }, { count }, { data: deals }] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, profile_image_url, trust_score, points, level, badges, created_at, role")
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("created_by", id)
        .eq("status", "approved"),
      supabase
        .from("deals")
        .select("*")
        .eq("created_by", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile,
      approvedDealsCount: count ?? 0,
      recentApprovedDeals: deals ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to load user summary" }, { status: 500 });
  }
}

