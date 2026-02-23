/* MULTIPLAY – Service Worker (PWA offline-stöd) */
const CACHE = 'multiplay-v1';
const ASSETS = [
  './',
  './index.html',
  './styles/app.css',
  './js/app.js',
  './js/multiplication.js',
  './js/clock.js',
  './js/tenfriends.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Bubblegum+Sans&family=Nunito:wght@400;600;700;800;900&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS.filter(u => !u.startsWith('http'))))
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

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
