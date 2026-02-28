"use client";

import { useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const TAB_ROUTES = ["/", "/profile", "/create", "/search", "/my"];
const OTHER_ROUTES = ["/leaderboard", "/login"];

export function useRoutePreloader() {
  const router = useRouter();
  const pathname = usePathname();

  useLayoutEffect(() => {
    const skip = (route: string) =>
      pathname === route || (route !== "/" && pathname.startsWith(route));

    TAB_ROUTES.forEach((route) => {
      if (!skip(route)) router.prefetch(route);
    });

    const t = setTimeout(() => {
      OTHER_ROUTES.forEach((route) => {
        if (!skip(route)) router.prefetch(route);
      });
    }, 30);

    return () => clearTimeout(t);
  }, [router, pathname]);
}
