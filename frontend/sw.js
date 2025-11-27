// frontend/sw.js
/* 🌸 Irisje.nl – Service Worker v8 (stabiel & geoptimaliseerd)
   Functies:
   ✅ Cache van essentiële bestanden (inclusief maskable icon)
   ✅ Offline fallback (offline.html)
   ✅ Automatische refresh bij nieuwe versies
   ✅ Melding aan gebruiker bij update
   ✅ Minder console-logging in productie
*/

const CACHE_NAME = "irisje-cache-v8";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  "/", "/index.html", OFFLINE_URL,
  "/style.css", "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png" // ✅ nieuw toegevoegd
];

/* === Logging beperken buiten localhost === */
if (self.location.hostname !== "localhost") {
  console.log = () => {};
}

/* === INSTALL === */
self.addEventListener("install", (event) => {
  console.log("🔧 [SW] Installatie gestart...");
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
    self.skipWaiting();
    console.log("✅ [SW] Installatie voltooid.");
  })());
});

/* === ACTIVATE === */
self.addEventListener("activate", (event) => {
  console.log("♻️ [SW] Activering...");
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
    self.clients.claim();

    // 🔄 Nieuwe versie-melding aan clients
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientsList) {
      client.postMessage({ type: "NEW_VERSION" });
    }
  })());
});

/* === FETCH === */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isHttp = url.protocol === "http:" || url.protocol === "https:";
  const isSameOrigin = url.origin === self.location.origin;

  // 🧭 Navigatie: network-first met offline fallback
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        return (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Alleen same-origin HTTP(S)
  if (!isHttp || !isSameOrigin) return;

  // 📦 Cache-first strategie voor statische bestanden
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const resp = await fetch(req);
      const clone = resp.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, clone));
      return resp;
    } catch {
      const fallback = await caches.match(req);
      return fallback || new Response("Offline", { status: 503 });
    }
  })());
});

/* === Berichtverwerking (voor toekomstige uitbreidingen) === */
self.addEventListener("message", (event) => {
  // eventueel uitbreiden met client-communicatie
});
