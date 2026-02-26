import { createReadOnlyClient } from "@/lib/supabase/server";
import { HomeContent } from "./home-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createReadOnlyClient();

  const [endingSoon, popular, newest, trending] = await Promise.all([
    supabase
      .from("deals")
      .select("*")
      .eq("status", "approved")
      .gt("end_at", new Date().toISOString())
      .order("end_at", { ascending: true })
      .limit(10),
    supabase
      .from("deals")
      .select("*")
      .eq("status", "approved")
      .gt("end_at", new Date().toISOString())
      .order("heat_score", { ascending: false })
      .limit(10),
    supabase
      .from("deals")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("deals")
      .select("*")
      .eq("status", "approved")
      .gt("end_at", new Date().toISOString())
      .gte("heat_score", 20)
      .order("heat_score", { ascending: false })
      .limit(8),
  ]);

  return (
    <HomeContent
      endingSoon={endingSoon.data ?? []}
      popular={popular.data ?? []}
      newest={newest.data ?? []}
      trending={trending.data ?? []}
    />
  );
}
