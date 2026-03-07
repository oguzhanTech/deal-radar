import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/server";

/**
 * Giriş yapmış kullanıcının radar kayıtlarını döndürür.
 * Sunucu tarafında cookie ile session okunduğu için canlıda client session sorunu olmaz.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json([]);
    }

    const { data: savesRows } = await supabase
      .from("deal_saves")
      .select("user_id, deal_id, reminder_settings, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!savesRows?.length) {
      return NextResponse.json([]);
    }

    const dealIds = savesRows.map((r) => r.deal_id);
    const anon = await createAnonClient();
    const { data: deals } = await anon
      .from("deals")
      .select("*")
      .in("id", dealIds)
      .eq("status", "approved");

    const dealsById = new Map((deals ?? []).map((d) => [d.id, d]));

    const result = savesRows
      .map((row) => {
        const deal = dealsById.get(row.deal_id);
        if (!deal) return null;
        return { ...row, deal };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
