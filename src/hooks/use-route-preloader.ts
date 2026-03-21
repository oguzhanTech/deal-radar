"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { prefetchOnce } from "@/lib/prefetch-once";

const TAB_ROUTES = ["/", "/profile", "/create", "/search", "/my"];
const OTHER_ROUTES = ["/leaderboard", "/login"];

export function useRoutePreloader() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
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
      }, 250);
    };

    const idle =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(runPreload, { timeout: 700 })
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
  }, [router, pathname]);
}
