/* MULTIPLAY – Service Worker (PWA offline-stöd) */
const CACHE = 'multiplay-v2';
const ASSETS = [
  './',
  './index.html',
  './styles/app.css',
  './js/shared.js',
  './js/app.js',
  './js/multiplication.js',
  './js/clock.js',
  './js/tenfriends.js',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Network-first (med cache-uppdatering) för navigationer och egna
   .html/.js/.css – appen uppdateras när nätet finns, funkar offline.
   Cache-first med runtime-caching för övrigt (t.ex. Google Fonts). */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const networkFirst = req.mode === 'navigate' ||
    (sameOrigin && /\.(?:html|js|css)$/.test(url.pathname));

  if (networkFirst) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached => cached || caches.match('./index.html'))
        )
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached =>
        cached || fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
      )
    );
  }
});
