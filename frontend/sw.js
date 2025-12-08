// frontend/sw.js – Fixed version to prevent stale cache issues

const CACHE_NAME = "irisje-cache-v9";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // HTML → always network‑first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // CSS → network‑first, fallback to cache
  if (req.destination === "style") {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          caches.open(CACHE_NAME).then((c) => c.put(req, resp.clone()));
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // JS → network‑first
  if (req.destination === "script") {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          caches.open(CACHE_NAME).then((c) => c.put(req, resp.clone()));
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Images & other static → cache‑first
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((resp) => {
            caches.open(CACHE_NAME).then((c) => c.put(req, resp.clone()));
            return resp;
          })
          .catch(() => cached)
      );
    })
  );
});
