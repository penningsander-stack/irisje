/* frontend/sw.js
   🌸 Irisje.nl – eenvoudige cache-service-worker voor snellere laadtijden
*/
const CACHE_NAME = "irisje-cache-v1";
const OFFLINE_URLS = [
  "index.html",
  "style.css",
  "manifest.json",
  "favicon.ico"
];

// Installatie: cache de belangrijkste bestanden
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activatie: oude caches opschonen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: probeer cache eerst, val terug op netwerk
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ||
      fetch(event.request).then((res) => {
        // Cache nieuwe resources
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      }).catch(() => caches.match("index.html"))
    )
  );
});
