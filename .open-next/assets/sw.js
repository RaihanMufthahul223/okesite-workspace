/* OkeSite CRM Service Worker — Cloudflare Pages PWA */
const CACHE_NAME = "okesite-crm-v1";
const STATIC_CACHE = "okesite-static-v1";
// App shell & critical assets — network-first for HTML, cache-first for assets
const PRECACHE_URLS = ["/", "/dashboard", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best-effort precache, ignore failures (e.g. auth redirects)
      return cache.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: "no-store" }))).catch(() => undefined);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Network-first for navigations & API, cache-first for static
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Bypass Clerk auth, API mutations, and Next.js HMR
  if (url.pathname.startsWith("/api/") && req.headers.get("accept")?.includes("text/event-stream")) return;

  // For pages (navigations) — network first, fallback to cache, then offline
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          // Cache successful navigations (200)
          if (res.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          // Offline fallback — try cached dashboard
          const fallback = await caches.match("/dashboard");
          if (fallback) return fallback;
          return new Response("Offline — buka lagi saat online", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      })()
    );
    return;
  }

  // For static assets (js/css/images/fonts) — cache first
  if (/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/i.test(url.pathname) || url.pathname.startsWith("/_next/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        } catch {
          return cached || fetch(req);
        }
      })()
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
