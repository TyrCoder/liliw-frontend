/**
 * Liliw Tourism service worker.
 *
 * BUILD is rewritten by scripts/stamp-sw.mjs before every production build.
 * That matters more than anything else in this file: a service worker is only
 * reinstalled when its own bytes change, so while this was a fixed string the
 * worker installed once and never again. Every visitor kept serving pages
 * precached on the day they first opened the site — which is exactly the
 * "offline mode is out of date" people were seeing. The stamp forces a new
 * install per deploy, and the cache names carry it so the old shell is dropped
 * rather than accumulating.
 */
const BUILD = 'dev';

const CACHE_NAME = `liliw-shell-${BUILD}`;
const API_CACHE  = `liliw-api-${BUILD}`;
// Images are addressed by URL and a given URL never changes content, so they
// survive a deploy. Re-downloading every panorama on each release would be a
// slow, expensive way to gain nothing.
const IMAGE_CACHE = 'liliw-img-v3';

const IMAGE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;  // 30 days
const API_MAX_AGE   = 5 * 60 * 1000;             // 5 minutes

// Every page a visitor can reach, precached on install.
const PRECACHE_URLS = [
  '/',
  '/about', '/arts', '/attractions', '/business/apply', '/community',
  '/contact', '/culture', '/dining', '/faq', '/gallery', '/heritage',
  '/immersive', '/itineraries', '/news', '/participate', '/profile',
  '/rewards', '/scan', '/stories', '/terms', '/tourist-spots',
  '/offline.html',
];

// Local assets to pre-cache (audio + images)
const PRECACHE_ASSETS = [
  '/audio/welcome.mp3',
  '/audio/ancestral-en.mp3', '/audio/ancestral-fil.mp3',
  '/audio/church-en.mp3',    '/audio/church-fil.mp3',
  '/audio/legend-en.mp3',    '/audio/legend-fil.mp3',
  '/audio/tsinelas-en.mp3',  '/audio/tsinelas-fil.mp3',
  '/images/gat/body.png',
  '/images/gat/head.png',
  '/images/gat/head-speaking.png',
  '/images/gat/neck.png',
  '/images/gat/arm-free.png',
  '/images/gat/arm-staff.png',
  '/images/liliw-dog.png',
  '/images/lilio-head.png',
  '/images/login-banner.webp',
  '/images/liliw-banner.webp',
  // The ground under every page. Without it an offline visit is blank cream.
  '/images/liliw-cream.webp',
  '/manifest.json',
];

/**
 * Content endpoints, cached stale-while-revalidate.
 *
 * These used to be /api/strapi/*, which stopped existing when Strapi was
 * removed. Nothing matched, so no content was ever cached and an offline visit
 * showed pages with empty lists.
 */
const CACHEABLE_API = [
  '/api/content/attractions',
  '/api/content/news-events',
  '/api/content/events',
  '/api/content/stories',
  '/api/content/arts',
  '/api/content/culture-heritages',
  '/api/content/faqs',
  '/api/content/gallery',
  '/api/content/itineraries',
  '/api/content/community-events',
  '/api/content/participation-options',
  '/api/content/reviews',
];

/**
 * The map is the one page that genuinely cannot work offline: it is map tiles
 * streamed from Mapbox, and there is no version of it to show without them.
 * The 3D tours are no longer on this list — the attraction data is cached
 * above and panoramas already seen are in the image cache, so a tour that has
 * been opened once opens again with no connection.
 */
const NETWORK_ONLY_PATHS = ['/map'];

function isCacheableApi(pathname) {
  return CACHEABLE_API.some((p) => pathname.startsWith(p));
}

function isNetworkOnly(pathname) {
  return NETWORK_ONLY_PATHS.some((p) => pathname.startsWith(p));
}

// ── Skip waiting on demand (allows instant update when user clicks Reload) ────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled([
        // `cache: 'reload'` so the precache is filled from the network rather
        // than from the browser's own HTTP cache, which is how a fresh install
        // can still end up storing the previous deploy's HTML.
        ...PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})),
        ...PRECACHE_ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})),
      ])
    )
  );
  // No skipWaiting here on purpose. It made the new worker take over mid-visit
  // and the controllerchange handler then reloaded the page under the reader.
  // The app offers a Reload action instead, and that is what posts SKIP_WAITING.
});

// ── Activate ──────────────────────────────────────────────────────────────────
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

  // ── Map: network-only with an offline explanation ─────────────────────────
  if (request.mode === 'navigate' && isNetworkOnly(url.pathname)) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then((r) => r || new Response(
          `<!DOCTYPE html><html><head><meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Liliw — Offline</title>
          <style>
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:system-ui,sans-serif;min-height:100dvh;display:flex;
                 align-items:center;justify-content:center;background:#F9F6F0;padding:24px}
            .card{background:#fff;border-radius:20px;padding:48px 32px;max-width:400px;
                  width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.08)}
            h1{font-size:22px;font-weight:700;color:#0B3D91;margin-bottom:12px}
            p{color:#64748b;font-size:15px;line-height:1.7;margin-bottom:24px}
            a{display:inline-block;padding:12px 28px;background:#0B3D91;color:#F5C518;
              border-radius:10px;font-weight:700;text-decoration:none;font-size:14px}
          </style></head>
          <body><div class="card">
            <p style="font-size:48px;margin-bottom:16px">🗺️</p>
            <h1>Requires Internet</h1>
            <p>The map streams its tiles as you move, so it needs a connection. The 3D tours you have already opened still work offline.</p>
            <a href="/">Go Back</a>
          </div></body></html>`,
          { headers: { 'Content-Type': 'text/html' } }
        ))
      )
    );
    return;
  }

  // ── Content API: stale-while-revalidate ───────────────────────────────────
  if (isCacheableApi(url.pathname)) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);

        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) {
              const headers = new Headers(res.headers);
              headers.set('sw-cached-at', String(Date.now()));
              res.clone().arrayBuffer().then((buf) => {
                cache.put(request, new Response(buf, {
                  status: res.status, statusText: res.statusText, headers,
                }));
              });
            }
            return res;
          })
          .catch(() => null);

        // If we have a fresh cached copy, serve it and refresh in background
        if (cached) {
          const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0', 10);
          if (Date.now() - cachedAt < API_MAX_AGE) {
            networkFetch; // background refresh
            return cached;
          }
        }

        // Stale or missing — wait for network, fall back to stale cache
        const networkRes = await networkFetch;
        if (networkRes) return networkRes;
        if (cached) return cached;
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // ── Other API routes: network-first, no caching ───────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // ── Images (Cloudinary + local): cache-first, 30-day expiry ──────────────
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

  // ── Audio files: cache-first ──────────────────────────────────────────────
  if (request.destination === 'audio' || url.pathname.startsWith('/audio/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // ── Next.js static assets: cache-first ───────────────────────────────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // ── HTML navigation: network-first, cache as offline fallback ─────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const home = await caches.match('/');
          if (home) return home;
          return caches.match('/offline.html').then((r) => r || new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Liliw Tourism — Offline</title>
            <style>
              *{box-sizing:border-box;margin:0;padding:0}
              body{font-family:system-ui,sans-serif;min-height:100dvh;display:flex;
                   align-items:center;justify-content:center;background:#F9F6F0;padding:24px}
              .card{background:#fff;border-radius:20px;padding:48px 32px;max-width:400px;
                    width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.08)}
              h1{font-size:22px;font-weight:700;color:#0B3D91;margin-bottom:12px}
              p{color:#64748b;font-size:15px;line-height:1.7;margin-bottom:24px}
              a{display:inline-block;padding:12px 28px;background:#0B3D91;color:#F5C518;
                border-radius:10px;font-weight:700;text-decoration:none;font-size:14px}
            </style></head>
            <body><div class="card">
              <p style="font-size:48px;margin-bottom:16px">🏘️</p>
              <h1>You're Offline</h1>
              <p>No internet connection. Pages you've already visited are still available.</p>
              <a href="/">Try Again</a>
            </div></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          ));
        })
    );
    return;
  }
});
