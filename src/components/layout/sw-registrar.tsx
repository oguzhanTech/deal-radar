"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    // PWABuilder ve offline testlerinde ilk yüklemede SW'nin erken devreye girmesi için
    // "load/idle" beklemiyoruz; komponent mount olur olmaz kayıt başlatıyoruz.
    register();
  }, []);

  return null;
}
