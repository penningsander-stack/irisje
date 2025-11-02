/* frontend/sw.js
   🌸 Irisje.nl – verbeterde service worker met offline fallback
*/

const CACHE_NAME = "irisje-cache-v2";
const OFFLINE_URL = "offline.html";
const ASSETS_TO_CACHE = [
  "index.html",
  "offline.html",
  "style.css",
  "manifest.json",
  "favicon.ico",
];

// Installatie: cache de belangrijkste bestanden
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activatie: oude caches opruimen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: probeer netwerk, val terug op cache, anders offline.html
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        return cached || cache.match(OFFLINE_URL);
      })
  );
});
