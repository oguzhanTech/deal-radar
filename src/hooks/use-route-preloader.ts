"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { prefetchOnce } from "@/lib/prefetch-once";

const TAB_ROUTES = ["/", "/search", "/profile"];
const OTHER_ROUTES = ["/my", "/create", "/leaderboard", "/login"];

export function useRoutePreloader(enabled = true) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    const skip = (route: string) =>
      pathname === route || (route !== "/" && pathname.startsWith(route));
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const runPreload = () => {
      TAB_ROUTES.forEach((route) => {
        if (!skip(route)) prefetchOnce(router, route);
      });

      timeoutId = setTimeout(() => {
        OTHER_ROUTES.forEach((route) => {
          if (!skip(route)) prefetchOnce(router, route);
        });
      }, 2500);
    };

    const idle =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(runPreload, { timeout: 2500 })
        : null;

    if (idle == null) {
      runPreload();
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
    return () => {
      window.cancelIdleCallback(idle);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, router, pathname]);
}
