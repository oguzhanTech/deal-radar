const CACHE_NAME = "dealradar-v2";
const API_CACHE_NAME = `${CACHE_NAME}-api`;
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const META_CACHE_NAME = `${CACHE_NAME}-meta`;
const OFFLINE_URL = "/offline.html";
const STATIC_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![API_CACHE_NAME, STATIC_CACHE_NAME, META_CACHE_NAME].includes(k))
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
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
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
