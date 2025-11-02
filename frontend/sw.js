/* frontend/sw.js
   🌸 Irisje.nl – verbeterde cache-service-worker met offline fallback
*/

const CACHE_NAME = "irisje-cache-v2";
const OFFLINE_URLS = [
  "index.html",
  "offline.html",
  "style.css",
  "manifest.json"
];

// ✅ Installatie: belangrijkste bestanden in cache plaatsen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Caching bestanden:", OFFLINE_URLS);
      return cache.addAll(OFFLINE_URLS);
    }).catch((err) => {
      console.error("❌ Cache-fout:", err);
    })
  );
  self.skipWaiting();
});

// ✅ Activatie: oude caches opruimen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) {
          console.log("🧹 Oude cache verwijderd:", k);
          return caches.delete(k);
        }
      }))
    )
  );
  self.clients.claim();
});

// ✅ Fetch: eerst netwerk proberen, anders cache of offline-pagina
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // ✅ Succesvol netwerkverzoek → opslaan in cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // ❌ Geen netwerk → probeer cache, anders offline.html
        return caches.match(event.request)
          .then((cached) => cached || caches.match("offline.html"));
      })
  );
});
