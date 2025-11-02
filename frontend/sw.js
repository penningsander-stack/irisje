// frontend/sw.js
/* 🌸 Irisje.nl – Service Worker v6
   - Betere offline fallback detectie (werkt nu ook in DevTools)
   - Negeert icoonfouten
   - Slim cachebeheer
*/

const CACHE_NAME = "irisje-cache-v6";
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
        } catch {
          console.warn(`⚠️ [SW] ${url} kon niet worden opgehaald.`);
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
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      );
      self.clients.claim();
    })()
  );
});

/* === FETCH (met verbeterde offline fallback) === */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // negeer icoon- en manifestverzoeken, die geven vaak 404/503 bij offline
  if (
    event.request.url.endsWith("favicon.ico") ||
    event.request.url.includes("icon-") ||
    event.request.url.endsWith("manifest.json")
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
        console.warn("⚠️ [SW] Offline fallback geactiveerd:", err);

        // robuuste detectie voor HTML-navigaties
        const acceptHeader = event.request.headers.get("accept") || "";
        if (
          event.request.mode === "navigate" ||
          event.request.destination === "document" ||
          acceptHeader.includes("text/html")
        ) {
          console.log("🌐 [SW] Offline fallback → offline.html");
          return caches.match(OFFLINE_URL);
        }

        return new Response("Offline", {
          status: 503,
          statusText: "Offline",
          headers: { "Content-Type": "text/plain" },
        });
      }
    })()
  );
});
