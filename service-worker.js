// Service Worker for Drillers Report App
// Provides offline capability and faster loading

const CACHE_NAME = 'drillers-report-v9-optimized';
const STATIC_CACHE = 'drillers-report-static-v9-optimized';

// Files to cache for offline use
const STATIC_FILES = [
    './',
    './dashboard/index.html',
    './report/index.html',
    './dashboard/dashboard-app.js',
    './report/app.js',
    './dashboard/dashboard-styles.css',
    './report/styles.css',
    './shared/loader.js',
    './shared/styles.css',
    './shared/services/storage.js',
    './shared/hooks/useLocalStorage.js',
    './shared/hooks/useDarkMode.js',
    './shared/components/Loading.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES.map(url => new Request(url, { cache: 'reload' })));
            })
            .catch((error) => {
                console.error('Service Worker: Cache failed', error);
            })
    );

    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== STATIC_CACHE && cache !== CACHE_NAME) {
                            console.log('Service Worker: Clearing old cache', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip Google Drive API calls - always go to network
    if (event.request.url.includes('googleapis.com') ||
        event.request.url.includes('google.com/auth')) {
        return;
    }

    const url = new URL(event.request.url);
    const isHTMLRequest = event.request.headers.get('accept')?.includes('text/html') ||
                         url.pathname.endsWith('.html') ||
                         url.pathname.endsWith('/');

    // NETWORK-FIRST for HTML files (always get fresh HTML)
    if (isHTMLRequest) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fresh HTML
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed, fallback to cache (offline support)
                    return caches.match(event.request);
                })
        );
    }
    // CACHE-FIRST for CSS, JS, images (fast loading)
    else {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Return cached version if available
                    if (response) {
                        return response;
                    }

                    // Clone the request
                    const fetchRequest = event.request.clone();

                    // Network request
                    return fetch(fetchRequest)
                        .then((response) => {
                            // Check if valid response
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }

                            // Clone the response
                            const responseToCache = response.clone();

                            // Cache the response for future use
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        })
                        .catch(() => {
                            // Network failed, try to return cached version
                            return caches.match(event.request);
                        });
                })
        );
    }
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});
