/* MULTIPLAY â€“ Service Worker (PWA offline-stÃ¶d) */

// VIKTIGT: Ã–ka versionsnumret vid varje push (v2 â†’ v3 â†’ v4 osv)
const CACHE_VERSION = 'v28';
const CACHE = `multiplay-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './styles/app.css',
  './js/shared.js',
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
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// TillÃ¥ter sidan att be SW ta Ã¶ver direkt (backup om skipWaiting i install inte rÃ¤ckte)
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

/* Network-first (med cache-uppdatering) fÃ¶r navigationer och egna
   .html/.js/.css â€“ appen uppdateras nÃ¤r nÃ¤tet finns, funkar offline.
   Cache-first med runtime-caching fÃ¶r Ã¶vrigt (t.ex. Google Fonts).
   POST m.fl. cachas aldrig. */
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
