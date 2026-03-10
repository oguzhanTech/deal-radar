import { createAdminClient } from "@/lib/supabase/admin";
import { AdminReportsContent } from "./admin-reports-content";

type ReportRow = {
  id: string;
  deal_id: string;
  user_id: string;
  reason: string;
  created_at: string;
  deal?: { title: string; id: string } | null;
  reporter?: { display_name: string | null } | null;
};

export default async function AdminReportsPage() {
  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("deal_reports")
    .select("*, deal:deals(title, id)")
    .order("created_at", { ascending: false })
    .limit(100);

  const reports = (rows ?? []) as ReportRow[];
  if (reports.length === 0) {
    return <AdminReportsContent initialReports={[]} />;
  }

  const userIds = [...new Set(reports.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);

  const nameByUserId =
    profiles?.reduce<Record<string, string | null>>((acc, p) => {
      acc[p.user_id] = p.display_name ?? null;
      return acc;
    }, {}) ?? {};

  const reportsWithReporter: ReportRow[] = reports.map((r) => ({
    ...r,
    reporter: { display_name: nameByUserId[r.user_id] ?? null },
  }));

  return <AdminReportsContent initialReports={reportsWithReporter} />;
}
