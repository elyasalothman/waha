/* Public shell only. Authentication, APIs and private books never enter CacheStorage. */
const VERSION = "waha-public-v3";
const OFFLINE = "/offline.html";
const PUBLIC_PAGES = new Set(["/welcome", "/life", "/games", "/money", "/tools", "/more", "/quran"]);
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.add(OFFLINE)));
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
  const asset = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/");
  const page = request.mode === "navigate" && PUBLIC_PAGES.has(url.pathname) && !url.search;
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
