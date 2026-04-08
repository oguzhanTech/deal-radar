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
const INITIAL_SPLASH_MIN_MS = 180;
const SPLASH_SHOWN_KEY = "topla_splash_shown";
const REFRESH_SHELL_MIN_MS = 550;

function MobileHomeRefreshSkeleton() {
  return (
    <div className="space-y-4 py-3 px-4 animate-in fade-in duration-150">
      <div className="relative rounded-3xl bg-muted h-[190px] overflow-hidden">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-44 rounded-md bg-muted animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLg = useIsLgUp();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [skeletonShownAt, setSkeletonShownAt] = useState<number | null>(null);
  const [showInitialSplash, setShowInitialSplash] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });
  const [showRefreshShell, setShowRefreshShell] = useState(false);
  useRoutePreloader(!showInitialSplash);

  useEffect(() => {
    if (!showInitialSplash) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(SPLASH_SHOWN_KEY, "1");
      setShowInitialSplash(false);
    }, INITIAL_SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, [showInitialSplash]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLg || pathname !== "/") return;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!isStandalone) return;
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isReload = navEntry?.type === "reload";
    if (!isReload) return;
    setShowRefreshShell(true);
    const t = setTimeout(() => setShowRefreshShell(false), REFRESH_SHELL_MIN_MS);
    return () => clearTimeout(t);
  }, [isLg, pathname]);

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
  const useRefreshShell = !isLg && showRefreshShell && pathname === "/";

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
              {useRefreshShell ? (
                <MobileHomeRefreshSkeleton />
              ) : useSkeleton ? (
                getPageSkeleton(pendingPath!)
              ) : (
                children
              )}
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


