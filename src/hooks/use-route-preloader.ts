"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";

const MAIN_ROUTES = ["/", "/search", "/my", "/profile", "/leaderboard", "/create", "/login"];

export function useRoutePreloader() {
  const router = useRouter();

  useLayoutEffect(() => {
    MAIN_ROUTES.forEach((route) => router.prefetch(route));
  }, [router]);
}
