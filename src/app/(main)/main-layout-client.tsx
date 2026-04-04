"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { SavedDealIdsProvider } from "@/components/saved-deals/saved-deal-ids-context";
import { ToastProvider } from "@/components/ui/toast";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppLoadingScreen } from "@/components/layout/app-loading-screen";
import { useRoutePreloader } from "@/hooks/use-route-preloader";
import { useIsLgUp } from "@/hooks/use-is-lg";
const LevelUpModalLazy = dynamic(
  () => import("@/components/rewards/level-up-modal").then((m) => m.LevelUpModal),
  { ssr: false }
);

function LevelUpModalGate() {
  const { levelUp } = useAuth();
  if (levelUp === null) return null;
  return <LevelUpModalLazy />;
}
import { getPageSkeleton } from "@/components/layout/page-skeleton";
import { cn } from "@/lib/utils";
import { APP_SHELL_CLASS } from "@/lib/layout-constants";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

const SKELETON_DELAY_MS = 100;
const SKELETON_MIN_VISIBLE_MS = 160;
const INITIAL_SPLASH_MIN_MS = 800;
const SPLASH_SHOWN_KEY = "topla_splash_shown";

function LayoutShell({ children }: { children: React.ReactNode }) {
  useRoutePreloader();
  const pathname = usePathname();
  const isLg = useIsLgUp();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [skeletonShownAt, setSkeletonShownAt] = useState<number | null>(null);
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
    if (!isLg) return;
    setPendingPath(null);
    setShowSkeleton(false);
    setSkeletonShownAt(null);
  }, [isLg]);

  useEffect(() => {
    setPendingPath(null);
    if (!showSkeleton || !skeletonShownAt) {
      setShowSkeleton(false);
      setSkeletonShownAt(null);
      return;
    }

    const elapsed = Date.now() - skeletonShownAt;
    if (elapsed >= SKELETON_MIN_VISIBLE_MS) {
      setShowSkeleton(false);
      setSkeletonShownAt(null);
      return;
    }

    const hideTimer = setTimeout(() => {
      setShowSkeleton(false);
      setSkeletonShownAt(null);
    }, SKELETON_MIN_VISIBLE_MS - elapsed);
    return () => clearTimeout(hideTimer);
  }, [pathname, showSkeleton, skeletonShownAt]);

  useEffect(() => {
    if (!pendingPath) return;
    const showTimer = setTimeout(() => {
      setShowSkeleton(true);
      setSkeletonShownAt(Date.now());
    }, SKELETON_DELAY_MS);
    const fallback = setTimeout(() => {
      setPendingPath(null);
      setShowSkeleton(false);
      setSkeletonShownAt(null);
    }, 4000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(fallback);
    };
  }, [pendingPath]);

  const handleLinkCapture = useCallback(
    (e: React.MouseEvent) => {
      if (isLg) return;
      if (e.defaultPrevented) return;
      if ("button" in e && e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-no-skeleton]")) return;
      const a = target.closest('a[href^="/"]');
      if (!a) return;
      if (a.hasAttribute("download")) return;
      if (a.getAttribute("target") === "_blank") return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("/api") || href.startsWith("/auth")) return;
      if (href.startsWith("#")) return;
      const path = href.split("?")[0];
      if (path === pathname) return;
      setPendingPath(path);
      setShowSkeleton(false);
      setSkeletonShownAt(null);
    },
    [pathname, isLg]
  );

  const useSkeleton = !isLg && !!pendingPath && showSkeleton;

  return (
    <div
      className={cn("flex flex-col min-h-dvh bg-background relative overflow-x-hidden", APP_SHELL_CLASS)}
      onClickCapture={handleLinkCapture}
    >
      <AnimatePresence mode="wait">
        {showInitialSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 bg-background"
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
            <main className="flex-1 pb-20 pt-16 min-w-0 lg:pb-8">
              {useSkeleton ? getPageSkeleton(pendingPath!) : children}
            </main>
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>
      <LevelUpModalGate />
    </div>
  );
}

interface MainLayoutClientProps {
  children: React.ReactNode;
  initialUser: User | null;
  initialProfile: Profile | null;
}

export default function MainLayoutClient({
  children,
  initialUser,
  initialProfile,
}: MainLayoutClientProps) {
  return (
    <AuthProvider initialUser={initialUser} initialProfile={initialProfile}>
      <SavedDealIdsProvider>
        <ToastProvider>
          <LayoutShell>{children}</LayoutShell>
        </ToastProvider>
      </SavedDealIdsProvider>
    </AuthProvider>
  );
}


