// Service Worker para PWA
const CACHE_NAME = 'fixora-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Estrategia Network First (siempre intenta red primero)
self.addEventListener('fetch', (event) => {
  // Solo procesar peticiones http/https y únicamente el método GET para evitar errores de Cache API
  if (!event.request.url.startsWith('http') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clona y guarda en cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intenta desde cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Si no está en cache y es navegación, devuelve index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then((index) => index || Response.error());
          }
          // respondWith exige una Response: sin esto devolvía undefined y lanzaba
          // "Failed to convert value to 'Response'" cuando no había red ni caché.
          return Response.error();
        });
      })
  );
});

// Sincronización en background (opcional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Aquí puedes sincronizar datos pendientes cuando vuelva internet
  console.log('Sincronizando datos...');
}
