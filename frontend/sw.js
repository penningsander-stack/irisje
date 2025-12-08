// frontend/sw.js – Irisje.nl Service Worker v10 (no more clone/bodyUsed errors)

const CACHE_NAME = "irisje-cache-v10";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png"
];

// INSTALL – alleen basisbestanden cachen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ACTIVATE – oude caches opschonen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Alleen GET-requests verwerken
  if (req.method !== "GET") return;

  // HTML / navigatie – altijd network-first, met offline fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Alleen same-origin cachen
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  // CSS & JS – network-first, GEEN caching (voorkomt body-used/clone-ellende)
  if (req.destination === "style" || req.destination === "script") {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Overige assets (icons, images, manifest, etc.) – simpel cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((resp) => {
          // Alleen succesvolle responses en basic (geen cross-origin opaque)
          if (!resp || resp.status !== 200 || resp.type !== "basic") {
            return resp;
          }
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
          return resp;
        })
        .catch(() => new Response("Offline", { status: 503 }));
    })
  );
});
