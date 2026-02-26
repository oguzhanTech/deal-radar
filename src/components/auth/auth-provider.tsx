"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/actions";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  levelUp: number | null;
  dismissLevelUp: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  levelUp: null,
  dismissLevelUp: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (currentUser: User) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .single();

        if (data) {
          if (prevLevelRef.current !== null && data.level > prevLevelRef.current) {
            setLevelUp(data.level);
          }
          prevLevelRef.current = data.level;
          setProfile(data);
          return;
        }

        const displayName =
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split("@")[0] ||
          "User";

        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({ user_id: currentUser.id, display_name: displayName })
          .select("*")
          .single();

        if (newProfile) {
          prevLevelRef.current = newProfile.level;
          setProfile(newProfile);
        }
      } catch {
        // profiles table may not exist yet
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  const dismissLevelUp = useCallback(() => setLevelUp(null), []);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user);
      } catch {
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
        prevLevelRef.current = null;
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    try {
      await signOutAction();
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    prevLevelRef.current = null;
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, levelUp, dismissLevelUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
