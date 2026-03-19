"use client";

import { useState, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64Url);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function usePushSubscribe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window;

  const permission =
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default";

  const enablePush = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      setError("Push ayarları eksik (VAPID anahtarı tanımlı değil).");
      return false;
    }
    if (!isSupported) {
      setError("Bu cihazda web push bildirimleri desteklenmiyor.");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setError("Bildirim izni verilmedi.");
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      if (!("pushManager" in reg)) {
        throw new Error("Push yöneticisi bu ortamda kullanılamıyor.");
      }
      const keyBytes = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes as unknown as BufferSource,
      });
      const payload = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: payload.endpoint,
          keys: payload.keys,
        }),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || res.statusText);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Abonelik başarısız.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { enablePush, isSupported, permission, loading, error };
}
