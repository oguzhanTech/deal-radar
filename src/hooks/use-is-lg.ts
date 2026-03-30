"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1024px)";
/** Yüklü PWA penceresi genelde 1024px altında açılabilir; standalone + bu genişlikte masaüstü shell */
const STANDALONE_DESKTOP_MIN_WIDTH = 900;

function isIosStandalone(): boolean {
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isStandaloneDisplay(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || isIosStandalone();
}

function computeIsLgUp(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia(QUERY).matches) return true;
  if (isStandaloneDisplay() && window.innerWidth >= STANDALONE_DESKTOP_MIN_WIDTH) return true;
  return false;
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  const dm = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", onChange);
  dm.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    dm.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function getSnapshot() {
  return computeIsLgUp();
}

function getServerSnapshot() {
  return false;
}

/**
 * Masaüstü layout (lg): normalde `min-width: 1024px`.
 * Yüklü PWA (standalone) penceresi dar açıldığında da `innerWidth >= 900` ise masaüstü shell kullanılır;
 * telefon genişliği (~390px) bu dalda değildir.
 */
export function useIsLgUp() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
