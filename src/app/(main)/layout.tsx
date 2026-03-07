import { createClient } from "@/lib/supabase/server";
import MainLayoutClient from "./main-layout-client";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  let initialUser: Awaited<ReturnType<typeof getSession>>["user"] = null;
  let initialProfile: Awaited<ReturnType<typeof getSession>>["profile"] = null;
  let initialSavedDealIds: string[] = [];

  try {
    const supabase = await createClient();
    const session = await getSession(supabase);
    initialUser = session.user;
    initialProfile = session.profile;

    if (initialUser) {
      const { data: saves } = await supabase
        .from("deal_saves")
        .select("deal_id")
        .eq("user_id", initialUser.id);
      initialSavedDealIds = (saves ?? []).map((r) => r.deal_id);
    }
  } catch {
    // Session okunamazsa client tarafı fallback kullanır
  }

  return (
    <MainLayoutClient
      initialUser={initialUser}
      initialProfile={initialProfile}
      initialSavedDealIds={initialSavedDealIds}
    >
      {children}
    </MainLayoutClient>
  );
}

async function getSession(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { user, profile };
}
