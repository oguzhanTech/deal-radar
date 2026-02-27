"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, PlusCircle, Radar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const tabs = [
  { href: "/", icon: Home, labelKey: "nav.home" },
  { href: "/search", icon: Search, labelKey: "nav.search" },
  { href: "/create", icon: PlusCircle, labelKey: "nav.create", accent: true },
  { href: "/my", icon: Radar, labelKey: "nav.myRadar" },
  { href: "/profile", icon: User, labelKey: "nav.profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl shadow-nav pb-safe border-t border-border/50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              onMouseEnter={() => router.prefetch(tab.href)}
              onTouchStart={() => router.prefetch(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative",
                "active:scale-90 transition-transform"
              )}
            >
              {tab.accent ? (
                <div className="flex items-center justify-center w-13 h-13 -mt-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform">
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
              ) : (
                <>
                  <Icon
                    className={cn(
                      "h-[22px] w-[22px] transition-colors",
                      isActive ? "text-primary" : "text-stone-400"
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-semibold transition-colors",
                      isActive ? "text-primary" : "text-stone-400"
                    )}
                  >
                    {t(tab.labelKey)}
                  </span>
                  {isActive && (
                    <div
                      className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-[3px] bg-primary rounded-full transition-all duration-200"
                    />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
