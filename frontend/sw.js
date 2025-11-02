/* frontend/sw.js
   🌸 Irisje.nl – verbeterde service worker met offline fallback
*/

const CACHE_NAME = "irisje-cache-v2";
const OFFLINE_URL = "offline.html";
const PRECACHE_URLS = [
  "index.html",
  "offline.html",
  "style.css",
  "manifest.json",
  "favicon.ico"
];

// 🔹 INSTALLATIE – cache de belangrijkste bestanden
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// 🔹 ACTIVEREN – oude versies verwijderen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 🔹 FETCH – probeer netwerk, val terug op cache of offline.html
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // ✅ Cache succesvolle responses voor later gebruik
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(async () => {
        // 🌐 Geen netwerk: probeer uit cache, anders offline.html
        const cached = await caches.match(event.request);
        return cached || (await caches.match(OFFLINE_URL));
      })
  );
});
