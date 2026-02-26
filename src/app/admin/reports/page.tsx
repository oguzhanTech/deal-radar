import { createAdminClient } from "@/lib/supabase/admin";
import { AdminReportsContent } from "./admin-reports-content";

export default async function AdminReportsPage() {
  const supabase = createAdminClient();
  const { data: reports } = await supabase
    .from("deal_reports")
    .select("*, deal:deals(title, id), reporter:profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminReportsContent initialReports={reports ?? []} />;
}
