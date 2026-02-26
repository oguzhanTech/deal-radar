import { createAdminClient } from "@/lib/supabase/admin";
import { AdminDealsContent } from "./admin-deals-content";

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = createAdminClient();

  const { data: deals, error } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[admin/deals] query error:", error);
  }

  let profileMap: Record<string, string> = {};
  if (deals && deals.length > 0) {
    const userIds = [...new Set(deals.map((d) => d.created_by))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);
    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p) => [p.user_id, p.display_name ?? ""])
      );
    }
  }

  const dealsWithProfile = (deals ?? []).map((d) => ({
    ...d,
    profile: { display_name: profileMap[d.created_by] ?? null },
  }));

  const validFilters = ["all", "pending", "approved", "rejected"];
  const initialFilter = validFilters.includes(filter ?? "") ? filter! : "all";

  return <AdminDealsContent initialDeals={dealsWithProfile} initialFilter={initialFilter} />;
}
