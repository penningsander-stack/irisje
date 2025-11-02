// frontend/sw.js
/* 🌸 Irisje.nl – Service Worker v5 (stabiel)
   - Cachet alleen http(s) same-origin resources (geen chrome-extension)
   - Offline fallback voor navigaties naar /offline.html
   - Eenvoudige precache + cleanup
*/
const CACHE_NAME = "irisje-cache-v5";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  "/", "/index.html", OFFLINE_URL,
  "/style.css", "/manifest.json"
];

// Install: precache basisbestanden
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
    self.skipWaiting();
  })());
});

// Activate: oude caches weg
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null));
    self.clients.claim();
  })());
});

// Fetch:
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isHttp = url.protocol === "http:" || url.protocol === "https:";
  const isSameOrigin = url.origin === self.location.origin;

  // Navigaties: network-first, bij fout -> offline.html
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        return fresh;
      } catch {
        const offline = await caches.match(OFFLINE_URL);
        return offline || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Alleen http(s) + same-origin cachen (vermijdt chrome-extension fouten)
  if (!isHttp || !isSameOrigin) return;

  // Statisch spul: cache-first, anders netwerk en dan bij cache zetten
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const resp = await fetch(req);
      const clone = resp.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, clone));
      return resp;
    } catch {
      // Laatste redmiddel: eventueel een cache-hit (als die er is)
      const fallback = await caches.match(req);
      return fallback || new Response("Offline", { status: 503 });
    }
  })());
});
