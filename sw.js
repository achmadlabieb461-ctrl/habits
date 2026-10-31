const CACHE_NAME = 'dayflow-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html', // Sesuaikan dengan nama file HTML Anda jika berbeda
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/@phosphor-icons/web',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.tailwindcss.com'
];

// 1. Install Service Worker & Simpan Aset ke Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Menyimpan aset ke cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Aktivasi & Bersihkan Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Ambil Aset (Fetch) - Strategi: Cache First, lalu Network
self.addEventListener('fetch', (event) => {
  // Jangan cache request ke API eksternal atau peta jika tidak diperlukan
  if (event.request.method !== 'GET' || event.request.url.includes('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika ada di cache, kembalikan
      if (cachedResponse) {
        return cachedResponse;
      }
      // Jika tidak, ambil dari jaringan
      return fetch(event.request).then((networkResponse) => {
        // Simpan ke cache secara dinamis untuk peta atau aset baru
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback jika offline dan tidak ada di cache (opsional)
        // return caches.match('./index.html'); 
      });
    })
  );
});