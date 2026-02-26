import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUsersContent } from "./admin-users-content";

export default async function AdminUsersPage() {
  const supabase = createAdminClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminUsersContent initialUsers={users ?? []} />;
}
