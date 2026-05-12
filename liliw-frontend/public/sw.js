const CACHE_NAME = 'liliw-v1';

// Key routes to pre-cache on install
const PRECACHE_URLS = ['/', '/attractions', '/map', '/news', '/about', '/faq'];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}) // non-fatal if a precache URL fails
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-http(s) requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ── API routes: network-first, no caching ──
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

  // ── Images (Cloudinary + local): cache-first ──
  if (
    url.hostname.includes('cloudinary.com') ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // ── Next.js static assets (_next/static): cache-first ──
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

  // ── HTML page navigation: network-first, cache as offline fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
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
