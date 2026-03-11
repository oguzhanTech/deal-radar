import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Bildirim aboneliklerini sil
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id);

    // Profil verisini anonimleştir
    await supabase
      .from("profiles")
      .update({
        display_name: null,
        points: 0,
        level: 1,
        badges: [],
        trust_score: 0,
      })
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
  }
}

