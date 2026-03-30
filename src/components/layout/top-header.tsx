"use client";

import { Home, PlusCircle, Radar, Search, Trophy, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth, useAuthDisplay } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { t } from "@/lib/i18n";
import { prefetchOnce } from "@/lib/prefetch-once";
import { cn } from "@/lib/utils";
import { APP_SHELL_CLASS } from "@/lib/layout-constants";
import { HeaderSearch } from "@/components/layout/header-search";
import Link from "next/link";

const DESKTOP_NAV = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/search", labelKey: "nav.search", icon: Search },
  { href: "/create", labelKey: "nav.create", icon: PlusCircle },
  { href: "/my", labelKey: "nav.myRadar", icon: Radar },
  { href: "/profile", labelKey: "nav.profile", icon: User },
] as const;

export function TopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { showAsLoggedIn, initial, profile } = useAuthDisplay();

  const avatarLetter = profile?.display_name?.charAt(0)?.toUpperCase() || initial;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      <div
        className={cn(
          APP_SHELL_CLASS,
          "flex items-center justify-between h-16 px-4 sm:px-5 lg:px-6 gap-2 lg:gap-4"
        )}
      >
        <div className="flex items-center gap-3 lg:gap-8 min-w-0 flex-1">
          <Link
            href="/"
            prefetch
            onMouseEnter={() => prefetchOnce(router, "/")}
            onTouchStart={() => prefetchOnce(router, "/")}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm">
              <Radar className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-lg leading-tight tracking-tight truncate">{t("app.name")}</span>
              <span className="text-[9px] font-medium text-white/60 leading-none -mt-0.5 hidden sm:block truncate">
                {t("app.tagline")}
              </span>
            </div>
          </Link>

          <nav
            className="hidden lg:flex items-center gap-1 min-w-0 flex-1 justify-center max-w-3xl"
            aria-label="Ana navigasyon"
          >
            {DESKTOP_NAV.map(({ href, labelKey, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  onMouseEnter={() => prefetchOnce(router, href)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                    active ? "bg-white/20 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  <span>{t(labelKey)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <HeaderSearch />

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            <Link
              href="/profile"
              prefetch
              onMouseEnter={() => prefetchOnce(router, "/profile")}
              onTouchStart={() => prefetchOnce(router, "/profile")}
            >
              <Avatar className="h-9 w-9 border-2 border-white/25 ring-2 ring-white/10">
                {profile?.profile_image_url && (
                  <AvatarImage src={profile.profile_image_url} alt={profile.display_name ?? "Avatar"} />
                )}
                <AvatarFallback className="bg-white/15 text-white text-xs font-bold">{avatarLetter}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              href="/login"
              prefetch
              onMouseEnter={() => prefetchOnce(router, "/login")}
              onTouchStart={() => prefetchOnce(router, "/login")}
              className="text-sm font-semibold bg-white/15 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl hover:bg-white/25 transition-all active:scale-95 whitespace-nowrap"
            >
              {t("common.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
