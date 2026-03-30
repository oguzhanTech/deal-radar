import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeroContent } from "./admin-hero-content";

export default async function AdminHeroPage() {
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("hero_announcements")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/hero] query error:", error);
  }

  return <AdminHeroContent initialAnnouncements={rows ?? []} />;
}
