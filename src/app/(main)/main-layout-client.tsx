"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SavedDealIdsProvider } from "@/components/saved-deals/saved-deal-ids-context";
import { ToastProvider } from "@/components/ui/toast";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useRoutePreloader } from "@/hooks/use-route-preloader";
import { LevelUpModal } from "@/components/rewards/level-up-modal";
import { getPageSkeleton } from "@/components/layout/page-skeleton";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

const SKELETON_DELAY_MS = 100;

function LayoutShell({ children }: { children: React.ReactNode }) {
  useRoutePreloader();
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);

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
      <TopHeader />
      <main className="flex-1 pb-20 min-w-0">
        {useSkeleton ? getPageSkeleton(pendingPath!) : children}
      </main>
      <BottomNav />
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
