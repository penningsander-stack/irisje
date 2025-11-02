// frontend/sw.js
/* 🌸 Irisje.nl – Service Worker v7
   - Altijd offline fallback, ook bij varianten van index.html
   - Logt precies wat er gebeurt
*/

const CACHE_NAME = "irisje-cache-v7";
const OFFLINE_URL = "offline.html";

const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  `/${OFFLINE_URL}`
];

/* === INSTALL === */
self.addEventListener("install", (event) => {
  console.log("🔧 [SW] Installatie gestart...");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of ASSETS) {
        try {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res.clone());
        } catch (err) {
          console.warn(`⚠️ [SW] Niet gecachet: ${url}`, err);
        }
      }
      self.skipWaiting();
      console.log("✅ [SW] Installatie voltooid.");
    })()
  );
});

/* === ACTIVATE === */
self.addEventListener("activate", (event) => {
  console.log("♻️ [SW] Activatie...");
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)));
      self.clients.claim();
    })()
  );
});

/* === FETCH === */
self.addEventListener("fetch", (event) => {
  // Alleen GET-requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        // Probeer eerst cache
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // Dan netwerk
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
        // Fallback: toon offline.html bij navigatie
        const accept = event.request.headers.get("accept") || "";
        const isHTML =
          event.request.mode === "navigate" ||
          event.request.destination === "document" ||
          accept.includes("text/html");

        if (isHTML) {
          console.log("🌐 [SW] Offline fallback → offline.html");
          const cachedOffline = await caches.match(OFFLINE_URL);
          if (cachedOffline) return cachedOffline;
        }

        // Andere bestanden (icoon, CSS)
        return new Response("Offline", {
          status: 503,
          statusText: "Offline",
        });
      }
    })()
  );
});
