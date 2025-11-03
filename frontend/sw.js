// frontend/sw.js
/* 🌸 Irisje.nl – Service Worker v6 (auto-refresh)
   - Cacht alleen http(s) same-origin resources
   - Offline fallback voor navigaties naar /offline.html
   - Automatische herlaad bij nieuwe versie
*/

const CACHE_NAME = "irisje-cache-v6";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  "/", "/index.html", OFFLINE_URL,
  "/style.css", "/manifest.json",
  "/favicon.ico", "/icons/icon-192.png", "/icons/icon-512.png"
];

/* === INSTALL === */
self.addEventListener("install", (event) => {
  console.log("🔧 [SW] Installatie gestart...");
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
    self.skipWaiting(); // onmiddellijk klaarzetten
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

    // 🔄 Forceer refresh bij nieuwe SW
    const clientsList = await self.clients.matchAll({ type: "window" });
    for (const client of clientsList) {
      client.navigate(client.url);
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

  // Navigaties: network-first, bij fout → offline.html
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

  // Alleen same-origin HTTP(S) bestanden cachen
  if (!isHttp || !isSameOrigin) return;

  // Cache-first strategie
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
