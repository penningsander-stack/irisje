/* frontend/sw.js
   🌸 Irisje.nl – definitieve PWA service worker (2025-11-01)
   Volledig compatibel met offline.html + manifest.json
*/

const CACHE_NAME = "irisje-cache-v20251101";
const FILES_TO_CACHE = [
  "index.html",
  "offline.html",
  "style.css",
  "manifest.json",
  "favicon.ico",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "login.html",
  "register.html",
  "results.html",
  "company.html",
  "dashboard.html",
  "admin.html",
  "request.html",
  "error.html",
  "status.html"
];

// ✅ Installatie: cache alle belangrijke bestanden
self.addEventListener("install", (event) => {
  console.log("📦 [ServiceWorker] Installeren...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ✅ Activatie: verwijder oude caches
self.addEventListener("activate", (event) => {
  console.log("🧹 [ServiceWorker] Activeren...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ Oude cache verwijderd:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ✅ Fetch: eerst cache, dan netwerk, anders offline.html
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("⚡ [Cache hit]", event.request.url);
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("offline.html");
          }
        });
    })
  );
});
