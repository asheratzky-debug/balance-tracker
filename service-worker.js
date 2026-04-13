const CACHE_NAME = 'balance-tracker-v4';

// Only cache CDN static assets — never app HTML files
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CDN_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // HTML / navigation: ALWAYS fetch fresh, never serve from cache
  if (event.request.mode === 'navigate'
      || url.pathname.endsWith('.html')
      || url.pathname === '/'
      || url.pathname.endsWith('/')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // CDN assets: cache-first (Tailwind, Chart.js rarely change)
  if (url.hostname.includes('cdn')) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        }))
    );
    return;
  }

  // Everything else: network first, cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
