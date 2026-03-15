"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SavedDealIdsProvider } from "@/components/saved-deals/saved-deal-ids-context";
import { ToastProvider } from "@/components/ui/toast";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppLoadingScreen } from "@/components/layout/app-loading-screen";
import { useRoutePreloader } from "@/hooks/use-route-preloader";
import { LevelUpModal } from "@/components/rewards/level-up-modal";
import { getPageSkeleton } from "@/components/layout/page-skeleton";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

const SKELETON_DELAY_MS = 100;
const INITIAL_SPLASH_MIN_MS = 2200;
const SPLASH_SHOWN_KEY = "topla_splash_shown";

function LayoutShell({ children }: { children: React.ReactNode }) {
  useRoutePreloader();
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showInitialSplash, setShowInitialSplash] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });

  useEffect(() => {
    if (!showInitialSplash) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(SPLASH_SHOWN_KEY, "1");
      setShowInitialSplash(false);
    }, INITIAL_SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, [showInitialSplash]);

  useEffect(() => {
    setPendingPath(null);
    setShowSkeleton(false);
  }, [pathname]);

  useEffect(() => {
    if (!pendingPath) return;
    const showTimer = setTimeout(() => setShowSkeleton(true), SKELETON_DELAY_MS);
    const fallback = setTimeout(() => {
      setPendingPath(null);
      setShowSkeleton(false);
    }, 4000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(fallback);
    };
  }, [pendingPath]);

  const handleLinkCapture = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-no-skeleton]")) return;
      const a = target.closest('a[href^="/"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("/api") || href.startsWith("/auth")) return;
      const path = href.split("?")[0];
      if (path === pathname) return;
      setPendingPath(path);
      setShowSkeleton(false);
    },
    [pathname]
  );

  const useSkeleton = pendingPath && showSkeleton;

  return (
    <div
      className="flex flex-col min-h-dvh max-w-lg mx-auto bg-background relative overflow-x-hidden"
      onClickCapture={handleLinkCapture}
    >
      <AnimatePresence mode="wait">
        {showInitialSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 max-w-lg mx-auto bg-background"
          >
            <AppLoadingScreen />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col min-h-dvh flex-1"
          >
            <TopHeader />
            <main className="flex-1 pb-20 pt-16 min-w-0">
              {useSkeleton ? getPageSkeleton(pendingPath!) : children}
            </main>
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>
      <LevelUpModal />
    </div>
  );
}

interface MainLayoutClientProps {
  children: React.ReactNode;
  initialUser: User | null;
  initialProfile: Profile | null;
  initialSavedDealIds?: string[];
}

export default function MainLayoutClient({
  children,
  initialUser,
  initialProfile,
  initialSavedDealIds = [],
}: MainLayoutClientProps) {
  return (
    <AuthProvider initialUser={initialUser} initialProfile={initialProfile}>
      <SavedDealIdsProvider initialSavedDealIds={initialSavedDealIds}>
        <ToastProvider>
          <LayoutShell>{children}</LayoutShell>
        </ToastProvider>
      </SavedDealIdsProvider>
    </AuthProvider>
  );
}
