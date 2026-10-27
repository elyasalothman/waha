/* Public shell only. Authentication, APIs and private books never enter CacheStorage. */
const VERSION = "waha-public-v8";
const OFFLINE = "/offline.html";
const PUBLIC_PAGES = new Set([
  "/",
  "/today",
  "/onboarding",
  "/settings",
  "/app/calc",
  "/app/units",
  "/app/notes",
  "/app/tasks",
  "/app/focus",
  "/app/timer",
  "/app/password",
  "/app/qr",
  "/store",
  "/welcome",
  "/life",
  "/games",
  "/money",
  "/tools",
  "/more",
  "/quran",
  "/books/alhajda",
  "/books/trading-guide",
  "/pro/cv",
  "/pro/pdf",
  "/pro/scan",
  "/pro/image",
]);
function isPublicPage(path) {
  // App routes SSR only public shells; personal records are loaded locally after hydration.
  return PUBLIC_PAGES.has(path) || /^\/app\/[a-z0-9-]+$/.test(path);
}
function isAsset(path) {
  return [
    "/assets/",
    "/fonts/",
    "/icons/",
    "/books/alhajda/assets/",
    "/books/alhajda/chapters/",
  ].some((prefix) => path.startsWith(prefix));
}
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.add(OFFLINE)));
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "WARM_PUBLIC_SHELL") {
    // Warm only allowlisted public documents and static assets already requested by this client.
    const urls = Array.isArray(event.data.urls) ? event.data.urls.slice(0, 200) : [];
    event.waitUntil(
      caches.open(VERSION).then(async (cache) => {
        for (const raw of urls) {
          try {
            const url = new URL(raw, self.location.origin);
            if (url.origin !== self.location.origin || url.search) continue;
            if (!isPublicPage(url.pathname) && !isAsset(url.pathname)) continue;
            if (!(await cache.match(url.href))) {
              const response = await fetch(url.href, { credentials: "omit" });
              if (response.ok && response.type === "basic") await cache.put(url.href, response);
            }
          } catch {
            /* Warming is optional when offline or storage is full. */
          }
        }
      }),
    );
  }
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("waha-public-") && key !== VERSION)
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const asset = isAsset(url.pathname);
  const page = request.mode === "navigate" && isPublicPage(url.pathname) && !url.search;
  if (!asset && request.mode !== "navigate") return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      if (asset) {
        const hit = await cache.match(request);
        if (hit) return hit;
      }
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic" && (asset || page)) {
          await cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        const hit = asset || page ? await cache.match(request) : null;
        return hit || (request.mode === "navigate" ? await cache.match(OFFLINE) : Response.error());
      }
    })(),
  );
});
