// sw.js

// Change this when you update your assets
const CACHE_NAME = 'holesgame-v9-mobile';

// Pre-cache URLs — critical assets for offline/PWA use
const PRECACHE_URLS = [
  './',
  './index.html',
  '../style.css',
  './manifest.json',
  './images/ui/title.png',
  './p5-init.js',
  './sketch.js',
  './input.js',
  './touchControls.js',
  './ui.js',
  './socket.js',
  './transport.js',
  './coreFunctions.js',
  './classes/player.js',
  './classes/map.js',
  './classes/invblock.js',
  './classes/items.js',
  './classes/objects.js',
  './classes/statblock.js',
  './magicSystem.js',
  './magicUI.js',
  './chatUI.js',
  './systemUI.js',
  './mainMenu.js',
  './preload.js',
  './diggingFunctions.js',
  './ui/inventoryUI.js',
  './craftingUI.js',
  './inventoryUI.js'
];

// Install: pre-cache the core assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Add each URL individually to avoid failing if one is missing
        return Promise.allSettled(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return Promise.resolve(); // Continue despite errors
            })
          )
        );
      })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

// Fetch:  
//  • Return from cache for pre-cached assets  
//  • Otherwise try network, cache the response, and fallback to cache on failure
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip service worker for API endpoints, Socket.IO, WebSocket, and cross-origin requests
  // Let the browser handle these normally without caching
  if (url.pathname.startsWith('/status') || 
      url.pathname.startsWith('/playerinfo') ||
      url.pathname.startsWith('/save-player-data') ||
      url.pathname.startsWith('/socket.io/') ||
      event.request.url.includes('socket.io') ||
      url.origin !== self.location.origin) {
    // Don't intercept - let browser handle it
    return;
  }

  // Always serve same-origin HTML from network (for updates)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/') || Promise.resolve(new Response('Offline', { status: 503 })))
    );
    return;
  }

  // All same-origin assets: network-first, cache-fallback
  // (ensures code updates always propagate)
  event.respondWith(
    fetch(event.request)
      .then(resp => {
        // Cache successful GET responses for later
        // Skip caching chrome-extension and other non-http(s) schemes
        const requestUrl = new URL(event.request.url);
        const isHttpScheme = requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:';
        
        if (resp.ok && event.request.method === 'GET' && isHttpScheme) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
