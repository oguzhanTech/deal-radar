"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex flex-col min-h-dvh max-w-lg mx-auto bg-background relative">
          <TopHeader />
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
