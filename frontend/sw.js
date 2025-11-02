// frontend/sw.js
/* 🌸 Irisje.nl – verbeterde service worker (v5)
   - Betrouwbare offline fallback (altijd werkt)
   - Automatische update na 24 uur
   - Fouttolerant cachen
*/

const CACHE_NAME = "irisje-cache-v5";
const OFFLINE_URL = "offline.html";
const OFFLINE_URLS = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json",
  `/${OFFLINE_URL}`,
  "/favicon.ico"
];

/* === INSTALLATIE === */
self.addEventListener("install", (event) => {
  console.log("🔧 [SW] Installatie gestart...");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const okFiles = [];
      for (const url of OFFLINE_URLS) {
        try {
          const res = await fetch(url, { cache: "no-cache" });
          if (res.ok) {
            await cache.put(url, res.clone());
            okFiles.push(url);
          } else {
            console.warn(`⚠️ [SW] ${url} gaf status ${res.status}, niet gecachet.`);
          }
        } catch (err) {
          console.warn(`⚠️ [SW] ${url} kon niet worden opgehaald (${err.message}).`);
        }
      }
      console.log("✅ [SW] Bestanden succesvol gecachet:", okFiles);
      self.skipWaiting();
    })()
  );
});

/* === ACTIVATIE === */
self.addEventListener("activate", (event) => {
  console.log("♻️ [SW] Activatie...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ [SW] Oude cache verwijderd:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* === FETCH HANDLER === */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        // Probeer eerst netwerk
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
        console.warn("⚠️ [SW] Netwerkfout:", err);
        // Toon cache als mogelijk
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Toon offline.html als laatste redmiddel
        return caches.match(OFFLINE_URL);
      }
    })()
  );
});

/* === AUTOMATISCHE UPDATE === */
setInterval(() => {
  console.log("🔄 [SW] Controle op nieuwe versie...");
  self.registration.update();
}, 24 * 60 * 60 * 1000);
