import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Giriş yapmış kullanıcının oluşturduğu fırsatları ve onaylı sayısını döndürür.
 * Sunucu tarafında cookie ile session okunduğu için client session gecikmesi/eksikliği olmaz.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ deals: [], count: 0 });
    }

    const [{ data: deals }, { count }] = await Promise.all([
      supabase
        .from("deals")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("status", "approved"),
    ]);

    const list = deals ?? [];
    return NextResponse.json({ deals: list, count: count ?? 0 });
  } catch {
    return NextResponse.json({ deals: [], count: 0 });
  }
}
