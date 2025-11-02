// frontend/sw.js

const CACHE_NAME = "irisje-cache-v1";
const OFFLINE_URL = "offline.html";

// ✅ Bestanden die in cache worden opgeslagen
const ASSETS_TO_CACHE = [
  "/",
  "index.html",
  "style.css",
  "offline.html",
  "favicon.ico",
  "request.html",
  "error.html"
];

// ✅ Installatie: initialiseer cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ✅ Activate: oude caches verwijderen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// ✅ Fetch: probeer netwerk, val terug op cache/offline
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Bewaar succesvolle responses in cache
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(async () => {
        // Offline fallback
        const cached = await caches.match(event.request);
        return cached || caches.match(OFFLINE_URL);
      })
  );
});
