import { createAdminClient } from "@/lib/supabase/admin";
import { AdminDashboardActions } from "./admin-dashboard-actions";
import { AdminPendingDeals } from "./admin-pending-deals";
import { t } from "@/lib/i18n";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const [
    { count: totalDeals },
    { count: pendingDeals },
    { count: totalUsers },
    { count: totalReports },
    { data: pendingDealsRaw },
  ] = await Promise.all([
    supabase.from("deals").select("*", { count: "exact", head: true }),
    supabase.from("deals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("deal_reports").select("*", { count: "exact", head: true }),
    supabase
      .from("deals")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  let profileMap: Record<string, string> = {};
  if (pendingDealsRaw && pendingDealsRaw.length > 0) {
    const userIds = [...new Set(pendingDealsRaw.map((d) => d.created_by))];
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

  const pendingDealsList = (pendingDealsRaw ?? []).map((d) => ({
    ...d,
    profile: { display_name: profileMap[d.created_by] ?? null },
  }));

  const stats = [
    { label: t("admin.stats.totalDeals"), value: totalDeals ?? 0, color: "bg-blue-500", href: "/admin/deals" },
    { label: t("admin.stats.pending"), value: pendingDeals ?? 0, color: "bg-yellow-500", href: "/admin/deals?filter=pending" },
    { label: t("admin.stats.users"), value: totalUsers ?? 0, color: "bg-green-500", href: "/admin/users" },
    { label: t("admin.stats.reports"), value: totalReports ?? 0, color: "bg-red-500", href: "/admin/reports" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("admin.dashboard")}</h2>
        <AdminDashboardActions />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border rounded-xl p-4 hover:bg-muted/50 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <h3 className="text-base font-bold mb-3">{t("admin.pending.title")}</h3>
        <AdminPendingDeals initialDeals={pendingDealsList} />
      </div>
    </div>
  );
}
