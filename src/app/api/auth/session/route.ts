import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Canlıda client getSession() bazen HttpOnly cookie'leri okuyamadığı için null döner.
 * Bu route sunucu tarafında cookie'leri okuyup session + profile döndürür;
 * AuthProvider getSession() null gelirse buna fallback yapar.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null, profile: null });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ user, profile });
  } catch {
    return NextResponse.json({ user: null, profile: null });
  }
}
