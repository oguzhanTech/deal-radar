"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MAIN_ROUTES = ["/", "/search", "/my", "/profile", "/leaderboard"];

export function useRoutePreloader() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      MAIN_ROUTES.forEach((route) => router.prefetch(route));
    }, 300);
    return () => clearTimeout(timer);
  }, [router]);
}
