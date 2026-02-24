"use client";

import { Radar } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";

export function TopHeader() {
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="flex items-center justify-between h-16 px-5 max-w-lg mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm">
            <Radar className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg leading-tight tracking-tight">DealRadar</span>
            <span className="text-[9px] font-medium text-white/60 leading-none -mt-0.5">Never miss a deal</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user && <NotificationBell />}
          {user ? (
            <Link href="/profile">
              <Avatar className="h-9 w-9 border-2 border-white/25 ring-2 ring-white/10">
                <AvatarFallback className="bg-white/15 text-white text-xs font-bold">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/25 transition-all active:scale-95"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
