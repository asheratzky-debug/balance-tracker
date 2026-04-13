const CACHE_NAME = 'balance-tracker-v3';
const urlsToCache = [
  './',
  './index.html',
  './portfolio.html',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install - cache important files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate - clean old caches, then notify all open windows to reload
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        // Tell every open tab to reload so they get fresh content
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
      })
  );
  self.clients.claim();
});

// Fetch - always get HTML fresh from network (bypass HTTP cache),
// network-first for everything else with cache fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isHTML = event.request.mode === 'navigate'
              || url.pathname.endsWith('.html')
              || url.pathname === '/'
              || url.pathname.endsWith('/');

  event.respondWith(
    fetch(event.request, isHTML ? { cache: 'no-store' } : {})
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
