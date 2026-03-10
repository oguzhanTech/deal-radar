import { createAdminClient } from "@/lib/supabase/admin";
import { AdminReportsContent } from "./admin-reports-content";

export default async function AdminReportsPage() {
  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("deal_reports")
    .select("*, deal:deals(title, id)")
    .order("created_at", { ascending: false })
    .limit(100);

  const reports = rows ?? [];
  if (reports.length === 0) {
    return <AdminReportsContent initialReports={[]} />;
  }

  const userIds = [...new Set(reports.map((r: { user_id: string }) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);

  const nameByUserId =
    profiles?.reduce<Record<string, string | null>>((acc, p) => {
      acc[p.user_id] = p.display_name ?? null;
      return acc;
    }, {}) ?? {};

  const reportsWithReporter = reports.map((r: Record<string, unknown>) => ({
    ...r,
    reporter: { display_name: nameByUserId[r.user_id as string] ?? null },
  }));

  return <AdminReportsContent initialReports={reportsWithReporter} />;
}
