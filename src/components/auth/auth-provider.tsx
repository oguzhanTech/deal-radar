"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/actions";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

const AUTH_CACHE_KEY = "auth_display";

function getCachedAuthSync(): { initial: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { initial: string };
  } catch {
    return null;
  }
}

function setCachedAuth(user: User): void {
  if (typeof window === "undefined") return;
  try {
    const initial =
      user.user_metadata?.full_name?.charAt(0) ||
      user.user_metadata?.name?.charAt(0) ||
      user.email?.charAt(0)?.toUpperCase() ||
      "U";
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ initial }));
  } catch {
    // ignore
  }
}

function clearCachedAuth(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // ignore
  }
}

/** UI için tek kaynak: giriş yapmış gibi göster (avatar) mi? Hiç null flash olmaz. */
export type AuthDisplay = { kind: "guest" } | { kind: "user"; initial: string; user: User | null; profile: Profile | null };

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  /** Sayfa geçişlerinde flash olmaması için: avatar/giriş kararı buna göre. */
  display: AuthDisplay;
  loading: boolean;
  levelUp: number | null;
  dismissLevelUp: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  display: { kind: "guest" },
  loading: true,
  levelUp: null,
  dismissLevelUp: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/** Header vb. sadece display kullanmalı – böylece sayfa geçişinde hiç "Giriş yap" flash'ı olmaz. */
export function useAuthDisplay() {
  const { display, profile } = useContext(AuthContext);
  const showAsLoggedIn = display.kind === "user";
  const initial = display.kind === "user" ? display.initial : "U";
  return { showAsLoggedIn, initial, profile, user: display.kind === "user" ? display.user : null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  const profileRetryCount = useRef(0);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const [cachedDisplay, setCachedDisplay] = useState<{ initial: string } | null>(() => getCachedAuthSync());

  const display: AuthDisplay = useMemo(() => {
    if (user) {
      const initial =
        profile?.display_name?.charAt(0)?.toUpperCase() ||
        user.user_metadata?.full_name?.charAt(0) ||
        user.user_metadata?.name?.charAt(0) ||
        user.email?.charAt(0)?.toUpperCase() ||
        "U";
      return { kind: "user", initial, user, profile };
    }
    if (cachedDisplay) return { kind: "user", initial: cachedDisplay.initial, user: null, profile: null };
    return { kind: "guest" };
  }, [user, profile, cachedDisplay]);

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
        if (session?.user) {
          setUser(session.user);
          setCachedAuth(session.user);
          setCachedDisplay(getCachedAuthSync());
          await fetchProfile(session.user);
        } else if (!userRef.current) {
          setUser(null);
          setProfile(null);
          setCachedDisplay(null);
          clearCachedAuth();
        }
      } catch {
        if (!userRef.current) {
          setUser(null);
          setCachedDisplay(null);
          clearCachedAuth();
        }
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setCachedAuth(session.user);
        setCachedDisplay(getCachedAuthSync());
        profileRetryCount.current = 0;
        await fetchProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setCachedDisplay(null);
        prevLevelRef.current = null;
        profileRetryCount.current = 0;
        clearCachedAuth();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  useEffect(() => {
    if (!user || profile || loading) return;
    if (profileRetryCount.current >= 2) return;
    const delay = profileRetryCount.current === 0 ? 500 : 1500;
    const t = setTimeout(() => {
      profileRetryCount.current += 1;
      fetchProfile(user).catch(() => {});
    }, delay);
    return () => clearTimeout(t);
  }, [user, profile, loading, fetchProfile]);

  const signOut = async () => {
    try {
      await signOutAction();
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    setCachedDisplay(null);
    prevLevelRef.current = null;
    clearCachedAuth();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, profile, display, loading, levelUp, dismissLevelUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
