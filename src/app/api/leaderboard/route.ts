import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createAnonClient();

    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("created_by")
      .eq("status", "approved");

    if (dealsError || !deals?.length) {
      return NextResponse.json([], { status: 200 });
    }

    const countByUser: Record<string, number> = {};
    for (const d of deals) {
      if (d.created_by) {
        countByUser[d.created_by] = (countByUser[d.created_by] ?? 0) + 1;
      }
    }

    const userIds = Object.keys(countByUser).sort(
      (a, b) => (countByUser[b] ?? 0) - (countByUser[a] ?? 0)
    );
    const topUserIds = userIds.slice(0, 20);

    if (topUserIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const { data: profilesRows, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", topUserIds);

    if (profilesError) {
      return NextResponse.json([], { status: 200 });
    }

    const nameByUser = Object.fromEntries(
      (profilesRows ?? []).map((r: { user_id: string; display_name: string | null }) => [r.user_id, r.display_name])
    );

    const profiles = topUserIds.map((id) => ({
      id,
      display_name: nameByUser[id] ?? null,
      deal_count: countByUser[id] ?? 0,
    }));

    return NextResponse.json(profiles);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
