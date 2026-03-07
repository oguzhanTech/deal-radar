import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/server";
import { MyRadarClient, type SavedDealItem } from "./my-radar-client";

export default async function MyRadarPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return <MyRadarClient initialSaves={null} needsLogin={true} userId={null} />;
    }

    const saves = await getSavesForUser(supabase, user.id);

    return (
      <MyRadarClient initialSaves={saves} needsLogin={false} userId={user.id} />
    );
  } catch {
    return <MyRadarClient initialSaves={null} needsLogin={true} userId={null} />;
  }
}

async function getSavesForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<SavedDealItem[]> {
  try {
    const { data: savesRows } = await supabase
      .from("deal_saves")
      .select("user_id, deal_id, reminder_settings, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!savesRows?.length) {
      return [];
    }

    const dealIds = savesRows.map((r) => r.deal_id);
    const anon = await createAnonClient();
    const { data: deals } = await anon
      .from("deals")
      .select("*")
      .in("id", dealIds)
      .eq("status", "approved");

    const dealsById = new Map((deals ?? []).map((d) => [d.id, d]));

    return savesRows
      .map((row) => {
        const deal = dealsById.get(row.deal_id);
        if (!deal) return null;
        return { ...row, deal } as SavedDealItem;
      })
      .filter((s): s is SavedDealItem => s != null);
  } catch {
    return [];
  }
}
