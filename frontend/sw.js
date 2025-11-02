// frontend/sw.js
/* 🌸 Irisje.nl – Service Worker v5
   - Offline fallback via offline.html
   - Slimmere detectie van navigatieverzoeken
   - Veilige caching en automatische updates
*/

const CACHE_NAME = "irisje-cache-v5";
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
      const okFiles = [];

      for (const url of OFFLINE_ASSETS) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            await cache.put(url, res.clone());
            okFiles.push(url);
          } else {
            console.warn(`⚠️ [SW] ${url} gaf status ${res.status}, niet gecachet.`);
          }
        } catch (err) {
          console.warn(`⚠️ [SW] Kon ${url} niet ophalen (${err.message})`);
        }
      }

      console.log("✅ [SW] Succesvol gecachet:", okFiles);
      self.skipWaiting();
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

/* === FETCH (offline fallback verbeterd) === */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        // Cache eerst
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // Dan netwerk
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
        console.warn("⚠️ [SW] Netwerkfout:", err);

        // Robuuste detectie van navigatie (pagina)
        if (
          event.request.mode === "navigate" ||
          (event.request.destination === "document") ||
          (event.request.headers.get("accept")?.includes("text/html"))
        ) {
          console.log("🌐 [SW] Offline fallback → offline.html");
          return caches.match(OFFLINE_URL);
        }

        // Andere bestanden (zoals afbeeldingen)
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })()
  );
});
