// ============================================================
// BACKGROUND TIMER — Web Worker
// ============================================================
// Web Workers are immune to the browser's background-tab throttling
// that kills requestAnimationFrame and limits setTimeout to ≥1 s.
// This worker simply posts a 'tick' message at a fixed interval
// so the main thread can keep the game loop alive.
// ============================================================

let timerId = null;

self.onmessage = function (e) {
    if (e.data.command === 'start') {
        const interval = e.data.interval || 50;
        if (timerId) clearInterval(timerId);
        timerId = setInterval(() => self.postMessage('tick'), interval);
    } else if (e.data.command === 'stop') {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    }
};
