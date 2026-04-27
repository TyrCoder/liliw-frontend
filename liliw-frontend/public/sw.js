const CACHE_NAME = 'liliw-cache-v2';
const urlsToCache = [
  '/',
  '/offline.html',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.log('Cache add error:', err);
        // Continue even if some URLs fail
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Fetch Event - Network First, Cache Second strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Never cache API requests with auth headers to avoid stale/unauthorized responses.
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('Offline', { status: 503 }))
    );
  } else if (event.request.mode === 'navigate') {
    // For pages, use network-first so deployments update immediately.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html');
          });
        })
    );
  } else {
    // For static assets, use cache first
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }

          return fetch(event.request).then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });

            return response;
          });
        })
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'liliw-notification',
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification('Liliw Tourism', options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reviews') {
    event.waitUntil(syncReviews());
  }
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncReviews() {
  try {
    const cache = await caches.open(CACHE_NAME);
    // Implement review sync logic
  } catch (error) {
    console.log('Review sync error:', error);
  }
}

async function syncBookings() {
  try {
    const cache = await caches.open(CACHE_NAME);
    // Implement booking sync logic
  } catch (error) {
    console.log('Booking sync error:', error);
  }
}
