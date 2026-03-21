import { createClient } from "@/lib/supabase/server";
import type { Deal } from "@/lib/types/database";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialDeals: Deal[] = [];
  let initialDealsCount = 0;

  if (user) {
    const [deals, countResult] = await Promise.all([
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
    initialDeals = deals.data ?? [];
    initialDealsCount = countResult.count ?? 0;
  }

  return (
    <ProfileClient
      initialDeals={initialDeals}
      initialDealsCount={initialDealsCount}
      initialUserId={user?.id ?? null}
    />
  );
}
