/* MULTIPLAY – Service Worker (PWA offline-stöd) */

// VIKTIGT: Öka versionsnumret vid varje push (v2 → v3 → v4 osv)
const CACHE_VERSION = 'v8';
const CACHE = `multiplay-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './styles/app.css',
  './js/app.js',
  './js/multiplication.js',
  './js/clock.js',
  './js/tenfriends.js',
  './js/nationella.js',
  './js/np-matte-muntligt.js',
  './js/np-matte-skriftlig.js',
  './js/np-svenska.js',
  './js/np-svenska-texts.js',
  './js/platsvarde.js',
  './js/uppstallning.js',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Tillåter sidan att be SW ta över direkt (backup om skipWaiting i install inte räckte)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first för navigationsanrop, cache-first för resurser
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
