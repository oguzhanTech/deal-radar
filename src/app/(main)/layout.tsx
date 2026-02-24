"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useRoutePreloader } from "@/hooks/use-route-preloader";
import { LevelUpModal } from "@/components/rewards/level-up-modal";

function LayoutShell({ children }: { children: React.ReactNode }) {
  useRoutePreloader();

  return (
    <div className="flex flex-col min-h-dvh max-w-lg mx-auto bg-background relative overflow-x-hidden">
      <TopHeader />
      <main className="flex-1 pb-20 min-w-0">{children}</main>
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
