import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { dealId } = await request.json();
    if (!dealId) return NextResponse.json({ error: "Missing dealId" }, { status: 400 });

    const supabase = createAdminClient();
    await supabase.rpc("increment_view_count", { target_deal_id: dealId });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
