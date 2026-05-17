const CACHE_NAME = 'liliw-v4';
const API_CACHE   = 'liliw-api-v1';
const IMAGE_CACHE = 'liliw-img-v1';

const IMAGE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Key routes to pre-cache on install
const PRECACHE_URLS = [
  '/', '/attractions', '/map', '/news', '/about', '/faq',
  '/heritage', '/culture', '/arts', '/dining', '/gallery', '/stories', '/contact',
];

// Public Strapi API routes safe to serve stale (content doesn't change by the second)
const CACHEABLE_API = [
  '/api/strapi/hero-slides',
  '/api/strapi/events',
  '/api/strapi/news-events',
  '/api/strapi/arts',
  '/api/strapi/culture-aspects',
];
const API_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

function isCacheableApi(pathname) {
  return CACHEABLE_API.some((p) => pathname.startsWith(p));
}

function isFresh(response) {
  const date = response.headers.get('date');
  if (!date) return false;
  return Date.now() - new Date(date).getTime() < API_MAX_AGE_MS;
}

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const KEEP = new Set([CACHE_NAME, API_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !KEEP.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ── Public Strapi API: stale-while-revalidate ──────────────────────────────
  if (isCacheableApi(url.pathname)) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);

        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => null);

        // Serve stale if fresh enough; background-refresh in parallel
        if (cached && isFresh(cached)) {
          networkFetch; // fire and forget
          return cached;
        }

        // Stale or missing — wait for network, fall back to stale cache
        const networkRes = await networkFetch;
        if (networkRes) return networkRes;
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'You are offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // ── Other API routes: network-first, no caching ────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'You are offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // ── Images (Cloudinary + local): cache-first with 7-day expiry ────────────
  if (url.hostname.includes('cloudinary.com') || request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0', 10);
          if (Date.now() - cachedAt < IMAGE_MAX_AGE) return cached;
        }
        try {
          const res = await fetch(request);
          if (res.ok) {
            const headers = new Headers(res.headers);
            headers.set('sw-cached-at', String(Date.now()));
            const stored = new Response(await res.clone().arrayBuffer(), {
              status: res.status, statusText: res.statusText, headers,
            });
            cache.put(request, stored);
          }
          return res;
        } catch {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // ── Next.js static assets: cache-first ────────────────────────────────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // ── HTML page navigation: network-first, cache as offline fallback ─────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone(); // clone synchronously before caches.open async gap
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const home = await caches.match('/');
          if (home) return home;
          return new Response(
            `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Liliw Tourism — Offline</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0 }
    body { font-family: system-ui, sans-serif; min-height: 100vh; display: flex;
           align-items: center; justify-content: center; background: #f8fafc; padding: 24px }
    .card { background: white; border-radius: 20px; padding: 48px 40px; max-width: 420px;
            width: 100%; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,.08) }
    .icon { width: 72px; height: 72px; background: #00BFB3; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;
            font-size: 32px }
    h1 { font-size: 24px; font-weight: 700; color: #0F1F3C; margin-bottom: 12px }
    p  { color: #64748b; font-size: 15px; line-height: 1.7; margin-bottom: 28px }
    a  { display: inline-block; padding: 12px 32px; background: #00BFB3; color: white;
         border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🌊</div>
    <h1>You're Offline</h1>
    <p>No internet connection detected. Check your connection and try again — Liliw Tourism will be waiting!</p>
    <a href="/">Try Again</a>
  </div>
</body>
</html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }
});
