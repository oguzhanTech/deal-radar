import { createClient } from "@/lib/supabase/server";
import MainLayoutClient from "./main-layout-client";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  let initialUser: Awaited<ReturnType<typeof getSession>>["user"] = null;
  let initialProfile: Awaited<ReturnType<typeof getSession>>["profile"] = null;

  try {
    const session = await getSession();
    initialUser = session.user;
    initialProfile = session.profile;
  } catch {
    // Session okunamazsa client tarafı fallback kullanır
  }

  return (
    <MainLayoutClient initialUser={initialUser} initialProfile={initialProfile}>
      {children}
    </MainLayoutClient>
  );
}

async function getSession() {
  const supabase = await createClient();
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
