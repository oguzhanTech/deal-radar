import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dealPath } from "@/lib/deal-url";

/** ISR: fırsat detay (kanonik + eski /deal/uuid yolu) */
export async function revalidateDealDetail(supabase: SupabaseClient, dealId: string) {
  const { data } = await supabase.from("deals").select("slug").eq("id", dealId).maybeSingle();
  if (data?.slug) revalidatePath(dealPath(data));
  revalidatePath(`/deal/${dealId}`);
}
