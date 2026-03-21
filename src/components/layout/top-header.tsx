"use client";

import { Radar, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, useAuthDisplay } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { t } from "@/lib/i18n";
import { prefetchOnce } from "@/lib/prefetch-once";
import Link from "next/link";

export function TopHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAsLoggedIn, initial, profile } = useAuthDisplay();

  const avatarLetter = profile?.display_name?.charAt(0)?.toUpperCase() || initial;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="flex items-center justify-between h-16 px-5 max-w-lg mx-auto">
        <Link href="/" prefetch onMouseEnter={() => prefetchOnce(router, "/")} onTouchStart={() => prefetchOnce(router, "/")} className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm">
            <Radar className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg leading-tight tracking-tight">{t("app.name")}</span>
            <span className="text-[9px] font-medium text-white/60 leading-none -mt-0.5">{t("app.tagline")}</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/leaderboard"
            prefetch
            onMouseEnter={() => prefetchOnce(router, "/leaderboard")}
            onTouchStart={() => prefetchOnce(router, "/leaderboard")}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-colors"
            title={t("home.leaderboardTitle")}
            aria-label={t("home.leaderboardTitle")}
          >
            <Trophy className="h-5 w-5" />
          </Link>
          {user && <NotificationBell />}
          {showAsLoggedIn ? (
            <Link href="/profile" prefetch onMouseEnter={() => prefetchOnce(router, "/profile")} onTouchStart={() => prefetchOnce(router, "/profile")}>
              <Avatar className="h-9 w-9 border-2 border-white/25 ring-2 ring-white/10">
                {profile?.profile_image_url && <AvatarImage src={profile.profile_image_url} alt={profile.display_name ?? "Avatar"} />}
                <AvatarFallback className="bg-white/15 text-white text-xs font-bold">
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              href="/login"
              prefetch
              onMouseEnter={() => prefetchOnce(router, "/login")}
              onTouchStart={() => prefetchOnce(router, "/login")}
              className="text-sm font-semibold bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/25 transition-all active:scale-95"
            >
              {t("common.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
