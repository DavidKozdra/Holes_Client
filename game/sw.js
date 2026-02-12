// ============================================================
// SERVICE WORKER — Production PWA
// ============================================================
// Bump CACHE_VERSION on every deploy to invalidate old caches.
// Uses a split-cache strategy:
//   • APP_SHELL  — precached core JS/CSS/HTML (network-first)
//   • ASSETS     — runtime-cached images & audio (cache-first, 30-day expiry)
//   • CDN        — third-party CDN libs (cache-first, 7-day expiry)
// ============================================================

const CACHE_VERSION = 24;
const APP_SHELL_CACHE  = `holes-shell-v${CACHE_VERSION}`;
const ASSETS_CACHE     = `holes-assets-v${CACHE_VERSION}`;
const CDN_CACHE        = `holes-cdn-v${CACHE_VERSION}`;
const OFFLINE_URL      = './offline.html';

const ALL_CACHES = [APP_SHELL_CACHE, ASSETS_CACHE, CDN_CACHE];

// ── Core app-shell files (precached at install) ──────────────
const APP_SHELL_URLS = [
  './',
  './index.html',
  './offline.html',
  '../style.css',
  './manifest.json',

  // Icons
  './images/ui/icon-192.png',
  './images/ui/icon-512.png',

  // Game scripts
  './p5-init.js',
  './sketch.js',
  './input.js',
  './inputCancelMeditate.js',
  './touchControls.js',
  './ui.js',
  './socket.js',
  './transport.js',
  './connectionHealth.js',
  './coreFunctions.js',
  './diggingFunctions.js',
  './devFunctions.js',
  './mainMenu.js',
  './preload.js',
  './magicSystem.js',
  './magicUI.js',
  './chatUI.js',
  './systemUI.js',
  './craftingUI.js',
  './inventoryUI.js',
  './backgroundLoop.js',

  // Classes
  './classes/player.js',
  './classes/map.js',
  './classes/invblock.js',
  './classes/items.js',
  './classes/objects.js',
  './classes/statblock.js',
  './classes/soundObj.js',
  './classes/flightPath.js',
  './classes/projectiles.js',
  './classes/musicSystem.js',
  './classes/brain.js',

  // UI modules
  './ui/inventoryUI.js',

  // Local libs
  './lib/geckos.io-client.min.js',

  // Font
  './assets/CalibrationGothicNbpLatin-rYmy.ttf'
];

// ── Paths that should NEVER be intercepted ───────────────────
const BYPASS_PATTERNS = [
  '/status',
  '/playerinfo',
  '/save-player-data',
  '/socket.io/',
];

function shouldBypass(url, request) {
  if (url.origin !== self.location.origin) return false; // handled separately
  return (
    BYPASS_PATTERNS.some(p => url.pathname.startsWith(p)) ||
    request.url.includes('socket.io')
  );
}

// ── Helpers ──────────────────────────────────────────────────
function isImage(url)   { return /\.(png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname); }
function isAudio(url)   { return /\.(wav|mp3|ogg|webm|m4a)$/i.test(url.pathname); }
function isFont(url)    { return /\.(woff2?|ttf|otf|eot)$/i.test(url.pathname); }
function isCDN(url)     { return url.origin !== self.location.origin; }

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(cache =>
      Promise.allSettled(
        APP_SHELL_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn(`[SW] precache skip: ${url}`, err.message)
          )
        )
      )
    )
  );
});

// ── ACTIVATE — purge outdated caches ─────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !ALL_CACHES.includes(k))
          .map(k => { console.log(`[SW] purging old cache: ${k}`); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Never intercept WebSocket upgrades or API calls
  if (event.request.method !== 'GET') return;
  if (shouldBypass(url, event.request)) return;

  // 2. Navigation requests → network-first, offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstNav(event.request));
    return;
  }

  // 3. CDN resources → cache-first (stale-while-revalidate)
  if (isCDN(url)) {
    event.respondWith(staleWhileRevalidate(event.request, CDN_CACHE));
    return;
  }

  // 4. Images / audio / fonts → cache-first (heavy assets)
  if (isImage(url) || isAudio(url) || isFont(url)) {
    event.respondWith(cacheFirstWithExpiry(event.request, ASSETS_CACHE));
    return;
  }

  // 5. Everything else (JS/CSS/HTML partials) → network-first
  event.respondWith(networkFirst(event.request, APP_SHELL_CACHE));
});

// ── STRATEGIES ───────────────────────────────────────────────

/** Navigation: network-first, fall back to cache, ultimate fallback offline page */
async function networkFirstNav(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(APP_SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL) || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
  }
}

/** Network-first for app-shell JS/CSS — ensures fresh code, cache fallback */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 408, statusText: 'Offline' });
  }
}

/** Cache-first for heavy assets — with lazy network update */
async function cacheFirstWithExpiry(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/** Stale-while-revalidate for CDN libs — instant from cache, update in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || new Response('', { status: 408 });
}

// ── MESSAGE HANDLER — manual cache clear / skip-waiting ──────
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCaches') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
