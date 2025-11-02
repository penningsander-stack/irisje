// frontend/sw.js
/* 🌸 Irisje.nl – Service Worker v4
   - Offline fallback via offline.html
   - Slimme caching (met update bij nieuwe versies)
   - Bescherming tegen fetch-fouten door ontbrekende iconen
*/

const CACHE_NAME = "irisje-cache-v4";
const OFFLINE_URL = "/offline.html";

const OFFLINE_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json",
  OFFLINE_URL,
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

/* === INSTALL === */
self.addEventListener("install", (event) => {
  console.log("🔧 [SW] Installatie gestart...");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of OFFLINE_ASSETS) {
        try {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res.clone());
          else console.warn(`⚠️ [SW] ${url} gaf status ${res.status}, niet gecachet.`);
        } catch (err) {
          console.warn(`⚠️ [SW] Kon ${url} niet ophalen (${err.message})`);
        }
      }
      self.skipWaiting();
      console.log("✅ [SW] Installatie voltooid.");
    })()
  );
});

/* === ACTIVATE === */
self.addEventListener("activate", (event) => {
  console.log("♻️ [SW] Activering...");
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ [SW] Oude cache verwijderd:", key);
            return caches.delete(key);
          }
        })
      );
      self.clients.claim();
    })()
  );
});

/* === FETCH === */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        // 1️⃣ Eerst proberen uit de cache
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // 2️⃣ Anders netwerk, en daarna toevoegen aan cache
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
        // 3️⃣ Fallback naar offline.html
        console.warn("⚠️ [SW] Netwerkfout, toon offline-pagina:", err);
        if (event.request.destination === "document") {
          return caches.match(OFFLINE_URL);
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })()
  );
});
