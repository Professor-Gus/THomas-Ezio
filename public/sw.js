const CACHE_NAME = 'ecosphere-offline-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('Pre-cache warning during install:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache first strategy for assets, Network first for APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or Google Drive OAuth/API endpoints (should remain live or handle via custom offline UI)
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/drive') || url.hostname.includes('googleapis.com')) {
    return;
  }

  // API endpoint analyzer/assistant should always try network first, or handle offline gracefully in App.tsx
  if (url.pathname.startsWith('/api/gemini')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return a JSON response indicating we are offline
        return new Response(JSON.stringify({
          matchedTriggerId: null,
          confidence: 0,
          response: "[Modo de Contingência local] Conexão central offline. O Guardião Neural está operando localmente via sensores integrados.",
          answer: "Olá! No momento estou sem uplink com a IA central, mas continuo operando via protocolos de contingência local. Posso guiar seu percurso offline!"
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // HTML, JS, CSS, and other local resources - Cache first with Network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache and update cache in background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore silent fetch failures when offline */});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        // Offline fallbacks for resources
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
        return new Response('Recurso offline indisponível.', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
