"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useRoutePreloader } from "@/hooks/use-route-preloader";
import { LevelUpModal } from "@/components/rewards/level-up-modal";
import { getPageSkeleton } from "@/components/layout/page-skeleton";

function LayoutShell({ children }: { children: React.ReactNode }) {
  useRoutePreloader();
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  useEffect(() => {
    if (!pendingPath) return;
    const t = setTimeout(() => setPendingPath(null), 4000);
    return () => clearTimeout(t);
  }, [pendingPath]);

  const handleLinkCapture = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const a = target.closest('a[href^="/"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("/api") || href.startsWith("/auth")) return;
      const path = href.split("?")[0];
      if (path === pathname) return;
      setPendingPath(path);
    },
    [pathname]
  );

  return (
    <div
      className="flex flex-col min-h-dvh max-w-lg mx-auto bg-background relative overflow-x-hidden"
      onClickCapture={handleLinkCapture}
    >
      <TopHeader />
      <main className="flex-1 pb-20 min-w-0">
        {pendingPath ? getPageSkeleton(pendingPath) : children}
      </main>
      <BottomNav />
      <LevelUpModal />
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <LayoutShell>{children}</LayoutShell>
      </ToastProvider>
    </AuthProvider>
  );
}
