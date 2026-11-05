const CACHE_NAME = "cho-viet-3d-v5";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/i18n.js",
  "/css/open-playground.css",
  "/js/state-audio.js",
  "/js/world-3d.js",
  "/js/entities-3d.js",
  "/js/controls-loop.js",
  "/js/network-ui.js",
  "/js/town-expansion.js",
  "/libs/three.min.js",
  "/libs/OrbitControls.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache Socket.IO or API endpoints
  if (url.pathname.startsWith("/socket.io") || url.pathname.startsWith("/api/") || url.pathname === "/health") {
    return;
  }

  // Cache-first for immutable vendor libraries and icons
  if (url.pathname.startsWith("/libs/") || url.pathname === "/icon.svg") {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
    return;
  }

  // Network-first with cache fallback for HTML/JS/CSS
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("/index.html")))
  );
});
