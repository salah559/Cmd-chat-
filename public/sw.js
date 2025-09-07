const CACHE_NAME = 'terminal-chat-v1.0.1';
const urlsToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/favicon.ico'
];

self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache).catch(err => {
                    console.log('Cache add failed:', err);
                });
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    // تجاهل طلبات Socket.IO
    if (event.request.url.includes('/socket.io/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => {
                    // في حالة عدم وجود اتصال، إرجاع صفحة أوفلاين
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});
