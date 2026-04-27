// ============================================================
// sw.js — Service Worker TDT Mundial
// Configurado para: https://sax456.github.io/Futbol-TDT/
// ============================================================

const CACHE_NAME = "tdt-mundial-v1";
const BASE = "/Futbol-TDT";

const PRECACHE = [
  `${BASE}/index.html`,
  `${BASE}/login.html`,
  `${BASE}/dashboard.html`,
  `${BASE}/grupo.html`,
  `${BASE}/css/global.css`,
  `${BASE}/css/components.css`,
  `${BASE}/css/dashboard.css`,
  `${BASE}/css/grupo.css`,
  `${BASE}/css/apuestas.css`,
  `${BASE}/css/responsive.css`,
  `${BASE}/js/auth.js`,
  `${BASE}/js/navbar.js`,
  `${BASE}/js/dashboard.js`,
  `${BASE}/js/grupo.js`,
  `${BASE}/js/apuestas.js`,
  `${BASE}/js/calcular_puntos.js`,
  `${BASE}/font/AkaPosse.ttf`,
  `${BASE}/IMG/LOGO NAVBAR.png`,
  `${BASE}/IMG/logo TDT PERFIL.png`,
  `${BASE}/IMG/icons/icon-192.png`,
  `${BASE}/IMG/icons/icon-512.png`
];

// Instalación
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url => cache.add(url).catch(() => null))
      )
    )
  );
  self.skipWaiting();
});

// Activación — limpiar cachés viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — Network first, caché como fallback
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // No interceptar llamadas externas
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("jsdelivr") ||
    url.hostname.includes("fonts.g")
  ) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
