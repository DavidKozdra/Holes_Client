// ============================================================
// SERVICE WORKER REGISTRATION — Production PWA
// ============================================================
// • Registers the SW with proper scope
// • Listens for updates and prompts the user to refresh
// • Provides a global `swReady` promise for other modules
// ============================================================

/** Resolves when the SW is active and controlling the page */
window.swReady = new Promise(resolve => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported');
    resolve(null);
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none'        // always fetch fresh sw.js
      });

      console.log('[PWA] SW registered — scope:', registration.scope);

      // ── Handle updates ──────────────────────────────────────
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // A new SW is waiting — notify the user
            showUpdateBanner(registration);
          }
        });
      });

      // ── Periodic update check (every 60 min while tab is open) ──
      setInterval(() => registration.update(), 60 * 60 * 1000);

      // ── If page was served by an old SW, check immediately ──
      if (registration.waiting) {
        showUpdateBanner(registration);
      }

      resolve(registration);
    } catch (err) {
      console.error('[PWA] SW registration failed:', err);
      resolve(null);
    }
  });

  // Reload all tabs once the new SW takes over
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
});

// ── Update prompt banner ─────────────────────────────────────
function showUpdateBanner(registration) {
  // Don't show during active gameplay — check if game has started
  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.innerHTML = `
    <span>🔄 A new version of Holes is available!</span>
    <button id="pwa-update-btn">Update Now</button>
    <button id="pwa-dismiss-btn">Later</button>
  `;
  banner.style.cssText = `
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100000;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    padding: 14px 20px;
    background: linear-gradient(135deg, #3b2f2f 0%, #5a3e2b 100%);
    color: #f5deb3; font-family: 'Press Start 2P', monospace; font-size: 11px;
    border-top: 3px solid #ffd700;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
    animation: slideUp 0.4s ease-out;
  `;

  // Inject keyframe once
  if (!document.getElementById('pwa-update-style')) {
    const style = document.createElement('style');
    style.id = 'pwa-update-style';
    style.textContent = `
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      #pwa-update-btn {
        background: #ffd700; color: #3b2f2f; border: none; padding: 8px 16px;
        font-family: inherit; font-size: 11px; cursor: pointer; border-radius: 4px;
      }
      #pwa-update-btn:hover { background: #e6c200; }
      #pwa-dismiss-btn {
        background: transparent; color: #f5deb3; border: 1px solid #f5deb3;
        padding: 8px 16px; font-family: inherit; font-size: 11px;
        cursor: pointer; border-radius: 4px;
      }
      #pwa-dismiss-btn:hover { background: rgba(255,255,255,0.1); }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  document.getElementById('pwa-update-btn').addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage('skipWaiting');
    }
    banner.remove();
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
  });
}
  