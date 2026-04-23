// ================================================================
// sw.js — Lenovox AI Service Worker
// Handles: offline caching, background sync, push notifications
// ================================================================
const CACHE_NAME = 'lenovox-v2';
const STATIC_ASSETS = [
  '/',
  '/index',
  '/login',
  '/signup',
  '/offline',
  '/favicon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap',
];

// ── INSTALL — cache static assets ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE — clean old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH — network first, cache fallback ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API requests
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.hostname.includes('firebasejs') || url.hostname.includes('googleapis')) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;
          // Return offline page for navigation requests
          if (request.mode === 'navigate') return caches.match('/offline');
          return new Response('Offline', { status: 503 });
        })
      )
  );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'Lenovox AI';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.tag || 'lenovox-notif',
    data: { url: data.url || '/appskeleton' },
    vibrate: [200, 100, 200],
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/appskeleton';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
