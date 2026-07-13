importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'appiccolina-v30';

// Installa e forza l'attivazione immediata
self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './image_0.png',
                './logo_transparent.png',
                './manifest.json'
            ]);
        })
    );
});

// Spazza via la memoria della versione precedente
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Intercetta le richieste: network-first per HTML/JS, cache-first per asset
self.addEventListener('fetch', (event) => {
    // Non intercettare chiamate API (POST, PUT, ecc) o estensioni Chrome
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);
    const isAsset = /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/i.test(url.pathname);
    
    if (isAsset) {
        // Asset statici: cache-first
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    } else {
        // HTML/JS: network-first (permette aggiornamenti immediati)
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => {
                return caches.match(event.request);
            })
        );
    }
});