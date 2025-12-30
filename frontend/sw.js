// Irisje Service Worker — SAFE & DEFENSIVE CACHE
// v20251230-SAFE-NO-EXTENSION

const CACHE_NAME = "irisje-cache-v20251230";

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json",
];

/* =========================
   INSTALL
========================= */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

/* =========================
   ACTIVATE
========================= */
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

/* =========================
   FETCH
========================= */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // ❌ NOOIT niet-http(s) requests (chrome-extension, etc.)
  if (!req.url.startsWith("http")) {
    return;
  }

  const accept = req.headers.get("accept") || "";

  /* 🔴 HTML — network first */
  if (accept.includes("text/html")) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  /* 🟡 CSS / JS — network first + cache update */
  if (
    req.destination === "style" ||
    req.destination === "script"
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, copy);
            });
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  /* 🔵 Images / fonts — cache first */
  if (
    req.destination === "image" ||
    req.destination === "font"
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, copy);
            });
          }
          return res;
        });
      })
    );
    return;
  }

  /* ⚪ Overig — network fallback */
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
