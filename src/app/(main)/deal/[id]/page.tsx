import { createClient } from "@/lib/supabase/server";
import { notFound, permanentRedirect } from "next/navigation";
import { dealPath } from "@/lib/deal-url";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Eski `/deal/{uuid}` adresleri — kalıcı yönlendirme */
export default async function LegacyDealRedirect({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("deals").select("slug").eq("id", id).maybeSingle();
  if (!data?.slug) notFound();
  permanentRedirect(dealPath(data));
}
