import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "./home-content";
import { getDemoEndingSoon, getDemoPopular, getDemoNewest } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let endingSoonData: any[] = [];
  let popularData: any[] = [];
  let newestData: any[] = [];

  try {
    const supabase = await createClient();

    const [endingSoon, popular, newest] = await Promise.all([
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
    ]);

    endingSoonData = endingSoon.data ?? [];
    popularData = popular.data ?? [];
    newestData = newest.data ?? [];
  } catch {
    // Supabase not available or tables don't exist
  }

  // Fall back to demo data when Supabase returns empty
  const useDemo = endingSoonData.length === 0 && popularData.length === 0 && newestData.length === 0;

  return (
    <HomeContent
      endingSoon={useDemo ? getDemoEndingSoon() : endingSoonData}
      popular={useDemo ? getDemoPopular() : popularData}
      newest={useDemo ? getDemoNewest() : newestData}
      isDemo={useDemo}
    />
  );
}
