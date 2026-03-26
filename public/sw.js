const CACHE_NAME = "dealradar-v3";
const API_CACHE_NAME = `${CACHE_NAME}-api`;
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const IMAGE_CACHE_NAME = `${CACHE_NAME}-images`;
const META_CACHE_NAME = `${CACHE_NAME}-meta`;
const OFFLINE_URL = "/offline.html";
const STATIC_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NAV_TIMEOUT_MS = 2500;
const APP_SHELL_URL = "/";
const PRECACHE_URLS = [
  OFFLINE_URL,
  APP_SHELL_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/splash/splash_topla.png",
];

const API_TTL_BY_PREFIX = [
  { prefix: "/api/deals", ttlMs: 60 * 1000 },
  { prefix: "/api/leaderboard", ttlMs: 120 * 1000 },
  { prefix: "/api/users/", ttlMs: 300 * 1000 },
];

function isSameOrigin(requestUrl) {
  try {
    const url = new URL(requestUrl);
    return url.origin === self.location.origin;
  } catch {
    return false;
  }
}

function shouldBypassCache(url, method) {
  if (method !== "GET") return true;
  if (!isSameOrigin(url.href)) return true;
  if (
    url.pathname.startsWith("/api/auth/") ||
    url.pathname.startsWith("/api/my/") ||
    url.pathname.startsWith("/api/profile/") ||
    url.pathname.startsWith("/api/push/") ||
    url.pathname.startsWith("/api/cron/") ||
    url.pathname.startsWith("/api/setup") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/auth")
  ) {
    return true;
  }
  return false;
}

function getApiTtl(url) {
  if (url.pathname === "/api/deals") {
    const feed = url.searchParams.get("feed");
    const q = url.searchParams.get("q");
    if (feed === "home") return 45 * 1000;
    if (q) return 20 * 1000;
    return 60 * 1000;
  }
  if (url.pathname.startsWith("/api/users/") && url.pathname.endsWith("/summary")) {
    return 300 * 1000;
  }
  const found = API_TTL_BY_PREFIX.find((entry) => url.pathname.startsWith(entry.prefix));
  return found?.ttlMs ?? null;
}

function isStaticAsset(url) {
  if (url.pathname === "/manifest.json" || url.pathname === "/offline.html" || url.pathname === "/favicon.ico") {
    return true;
  }
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/splash/") ||
    url.pathname.startsWith("/_next/static/")
  );
}

function isImageRequest(request, url) {
  if (request.destination === "image") return true;
  if (url.pathname === "/_next/image") return true;
  return /\.(png|jpg|jpeg|webp|gif|svg|avif)$/i.test(url.pathname);
}

async function putWithMeta(cacheName, request, response, ttlMs) {
  const [cache, metaCache] = await Promise.all([
    caches.open(cacheName),
    caches.open(META_CACHE_NAME),
  ]);
  await cache.put(request, response);
  await metaCache.put(
    request.url,
    new Response(JSON.stringify({ ts: Date.now(), ttlMs }), {
      headers: { "content-type": "application/json" },
    })
  );
}

async function getFreshCached(cacheName, request) {
  const [cache, metaCache] = await Promise.all([
    caches.open(cacheName),
    caches.open(META_CACHE_NAME),
  ]);
  const [cachedResponse, metaResponse] = await Promise.all([
    cache.match(request),
    metaCache.match(request.url),
  ]);
  if (!cachedResponse || !metaResponse) return null;
  try {
    const meta = await metaResponse.json();
    if (!meta?.ts || !meta?.ttlMs) return null;
    if (Date.now() - meta.ts > meta.ttlMs) {
      await Promise.all([cache.delete(request), metaCache.delete(request.url)]);
      return null;
    }
    return cachedResponse;
  } catch {
    return null;
  }
}

async function staleWhileRevalidateApi(request, ttlMs) {
  const cached = await getFreshCached(API_CACHE_NAME, request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (response?.ok) {
        await putWithMeta(API_CACHE_NAME, request, response.clone(), ttlMs);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    void refresh;
    return cached;
  }

  const network = await refresh;
  if (network) return network;
  return fetch(request);
}

async function cacheFirstStatic(request) {
  const cached = await getFreshCached(STATIC_CACHE_NAME, request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response?.ok) {
      await putWithMeta(STATIC_CACHE_NAME, request, response.clone(), STATIC_TTL_MS);
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

async function cacheFirstImage(request) {
  const cached = await getFreshCached(IMAGE_CACHE_NAME, request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response?.ok) {
      await putWithMeta(IMAGE_CACHE_NAME, request, response.clone(), IMAGE_TTL_MS);
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    fetch(request)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
    if (response?.ok) {
      await putWithMeta(STATIC_CACHE_NAME, request, response.clone(), 5 * 60 * 1000);
    }
    return response;
  } catch {
    // getFreshCached, install sırasında meta yazılmadıysa null döndürebilir.
    // Offline/timeout anında doğrudan caches.match ile en azından bir HTML döndürmeye çalışıyoruz.
    const [cachedNav, cachedShell, offline] = await Promise.all([
      caches.match(request),
      caches.match(APP_SHELL_URL),
      caches.match(OFFLINE_URL),
    ]);

    if (cachedNav) return cachedNav;
    if (cachedShell) return cachedShell;
    if (offline) return offline;

    // Son çare: yine fetch deniyoruz ama offline ise bu da fail olur.
    try {
      return await fetch(request);
    } catch {
      return new Response("", { status: 503, statusText: "Offline" });
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // addAll herhangi bir asset 404/timeout olursa tüm pre-cache’i iptal edebiliyor.
      // Bu yüzden URL’leri tek tek ekliyoruz; offline.html mutlaka cache’e düşmeli.
      const cache = await caches.open(STATIC_CACHE_NAME);
      await Promise.all(
        PRECACHE_URLS.map(async (u) => {
          try {
            await cache.add(u);
          } catch {
            // ignore
          }
        })
      );
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![API_CACHE_NAME, STATIC_CACHE_NAME, IMAGE_CACHE_NAME, META_CACHE_NAME].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  if (shouldBypassCache(url, request.method)) return;

  const apiTtl = getApiTtl(url);
  if (apiTtl) {
    event.respondWith(staleWhileRevalidateApi(request, apiTtl));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(cacheFirstImage(request));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = { title: "Topla", body: "", url: "/" };
  try {
    data = event.data.json();
  } catch (_) {
    data.body = event.data.text();
  }
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    data: { url: data.url || "/" },
    tag: data.url || "topla-push",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(data.title || "Topla", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const client = clientList[0];
        if ("focus" in client) client.focus();
        if (client.url !== self.location.origin + url) client.navigate(url);
      } else if (self.clients.openWindow) {
        self.clients.openWindow(self.location.origin + url);
      }
    })
  );
});
