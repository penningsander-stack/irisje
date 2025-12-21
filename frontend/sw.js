// Irisje Service Worker — SAFE CACHE FIX
// v20251221-SAFE-CSS-JS-REFRESH

const CACHE_NAME = "irisje-cache-v20251221";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json",
];

// ===== Install =====
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// ===== Activate =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ===== Fetch =====
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 🔴 HTML: altijd network-first (BELANGRIJK)
  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // 🟡 CSS & JS: network-first + cache update (FIX)
  if (
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, clone);
          });
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 🔵 Overig: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req);
    })
  );
});
