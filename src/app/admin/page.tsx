import { createClient } from "@/lib/supabase/server";
import { AdminDashboardActions } from "./admin-dashboard-actions";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalDeals },
    { count: pendingDeals },
    { count: totalUsers },
    { count: totalReports },
  ] = await Promise.all([
    supabase.from("deals").select("*", { count: "exact", head: true }),
    supabase.from("deals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("deal_reports").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total Deals", value: totalDeals ?? 0, color: "bg-blue-500" },
    { label: "Pending Review", value: pendingDeals ?? 0, color: "bg-yellow-500" },
    { label: "Users", value: totalUsers ?? 0, color: "bg-green-500" },
    { label: "Reports", value: totalReports ?? 0, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <AdminDashboardActions />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="border rounded-xl p-4">
            <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
