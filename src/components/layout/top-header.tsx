"use client";

import { Radar } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";

export function TopHeader() {
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Radar className="h-6 w-6" />
          <span className="font-bold text-lg tracking-tight">DealRadar</span>
        </Link>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {user ? (
            <Link href="/profile">
              <Avatar className="h-8 w-8 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-xs">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white/30 transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
