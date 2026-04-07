"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    // İlk boyamayı bloke etmemek için SW kaydını load + idle sonrasına erteliyoruz.
    const onLoad = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(register, { timeout: 2000 });
      } else {
        setTimeout(register, 1200);
      }
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
