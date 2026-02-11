// ============================================================
// BACKGROUND LOOP MANAGER
// ============================================================
// Keeps the game running when the browser tab is hidden.
//
// Problem:  Browsers throttle requestAnimationFrame (used by p5's
//           draw loop) to 0-1 fps and cap setTimeout to ≥1 s in
//           background tabs.  This freezes rendering, regen timers,
//           and the PlayerStateBatcher flush cycle.
//
// Solution: A Web Worker timer is NOT subject to those limits.
//           When the tab goes hidden we:
//             1. Stop p5's internal RAF loop  (noLoop())
//             2. Start the Worker ticking at ~20 fps
//             3. Each tick calls redraw() → draw() once
//           When the tab returns to the foreground we reverse it.
//
// The socket / DataChannel listeners keep firing regardless;
// this only fixes the draw-loop and setTimeout starvation.
// ============================================================

(function () {
    'use strict';

    var worker = null;
    var isHidden = false;
    var bgLoopRunning = false;

    // ── Create the Web Worker ──
    try {
        worker = new Worker('backgroundTimer.js');
    } catch (e) {
        console.warn('[BackgroundLoop] Could not create Web Worker:', e);
        return; // Graceful fallback — game just pauses in background as before
    }

    // ── Worker tick handler ──
    worker.onmessage = function () {
        if (!isHidden || !bgLoopRunning) return;

        // Drive p5's draw() for one frame
        if (typeof redraw === 'function') {
            try {
                redraw();
            } catch (e) { /* ignore per-frame errors */ }
        }

        // Flush the state batcher since its setTimeout is throttled
        if (typeof playerStateBatcher !== 'undefined' && playerStateBatcher.isDirty) {
            try {
                playerStateBatcher.flush();
            } catch (e) { /* ignore */ }
        }
    };

    // ── Visibility change listener ──
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            isHidden = true;
            bgLoopRunning = true;

            // Stop p5's requestAnimationFrame loop
            if (typeof noLoop === 'function') noLoop();

            // Start Worker ticks at ~20 fps (50 ms) — enough to keep
            // the game responsive while saving CPU in the background.
            worker.postMessage({ command: 'start', interval: 50 });
            console.log('[BackgroundLoop] Tab hidden — Worker driving loop at ~20 fps');
        } else {
            isHidden = false;
            bgLoopRunning = false;

            // Stop Worker ticks
            worker.postMessage({ command: 'stop' });

            // Resume p5's normal requestAnimationFrame loop
            if (typeof loop === 'function') loop();
            console.log('[BackgroundLoop] Tab visible — resuming normal RAF loop');
        }
    });

    console.log('[BackgroundLoop] Initialized — game will keep running in background tabs');
})();
