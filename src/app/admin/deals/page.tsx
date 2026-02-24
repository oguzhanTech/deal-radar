import { createClient } from "@/lib/supabase/server";
import { AdminDealsContent } from "./admin-deals-content";

export default async function AdminDealsPage() {
  const supabase = await createClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("*, profile:profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminDealsContent initialDeals={deals ?? []} />;
}
