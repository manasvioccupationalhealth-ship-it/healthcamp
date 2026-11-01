const CACHE_NAME = "healthcamp-shell-v1";
const APP_SHELL_URLS = [
  "/",
  "/login",
  "/manifest.json",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Pass through non-GET requests to network
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Avoid caching dynamic mutation or streaming API endpoints
  if (url.pathname.startsWith("/api/sync") || url.pathname.startsWith("/api/reports")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache when offline
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // If navigation request fails, return cached root
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }

        return new Response("Offline network unavailable", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      })
  );
});
