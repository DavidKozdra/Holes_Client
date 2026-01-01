// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const candidates = ['sw.js', './sw.js', '/game/sw.js'];
    (async () => {
      for (const url of candidates) {
        try {
          const reg = await navigator.serviceWorker.register(url);
          console.log('SW registered:', reg.scope);
          return;
        } catch (err) {
          console.warn('SW register failed for', url, err);
        }
      }
      console.error('SW registration failed for all candidates');
    })();
  });
}
  