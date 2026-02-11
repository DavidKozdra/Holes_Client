// ============================================================
// CONNECTION HEALTH MONITOR
// ============================================================
// Tracks Socket.IO connection state, provides reconnect logic,
// shows a non-intrusive banner when the connection drops, and
// runs an application-level ping/pong heartbeat so we detect
// silent disconnects that the transport layer misses.
//
// Depends on: socket (global), udpTransport (global, optional)
// Load AFTER socket.js and BEFORE sketch.js
// ============================================================

var connectionHealth = (function () {
    'use strict';

    // ── State ──
    var connected = false;
    var reconnecting = false;
    var reconnectAttempts = 0;
    var lastPongTime = 0;
    var pingInterval = null;
    var bannerEl = null;

    // ── Config ──
    var PING_INTERVAL_MS = 10000;   // App-level ping every 10 s
    var PONG_TIMEOUT_MS  = 15000;   // Consider dead if no pong within 15 s
    var MAX_SILENT_MS    = 30000;   // Force reconnect after 30 s silence

    // ── Banner UI ──
    function _createBanner() {
        if (bannerEl) return;
        bannerEl = document.createElement('div');
        bannerEl.id = 'connection-banner';
        bannerEl.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'width:100%', 'z-index:99999',
            'padding:8px 16px', 'font-family:monospace', 'font-size:14px',
            'text-align:center', 'color:#fff', 'display:none',
            'pointer-events:none', 'transition:opacity 0.3s',
        ].join(';');
        document.body.appendChild(bannerEl);
    }

    function _showBanner(msg, color) {
        if (!bannerEl) _createBanner();
        bannerEl.textContent = msg;
        bannerEl.style.background = color || 'rgba(200,40,40,0.92)';
        bannerEl.style.display = 'block';
        bannerEl.style.opacity = '1';
    }

    function _hideBanner() {
        if (!bannerEl) return;
        bannerEl.style.opacity = '0';
        setTimeout(function () {
            if (bannerEl) bannerEl.style.display = 'none';
        }, 350);
    }

    // ── Application-level heartbeat ──
    // Socket.IO has its own ping/pong at the engine level, but it can
    // be slow to detect certain silent failures (especially across
    // proxies / load balancers). This gives us faster detection.
    function _startHeartbeat() {
        _stopHeartbeat();
        lastPongTime = Date.now();
        console.log('[ConnHealth] Heartbeat started, lastPongTime =', lastPongTime);

        pingInterval = setInterval(function () {
            if (!socket || !socket.connected) return;

            // Send app-level ping directly via the original Socket.IO emit
            // to bypass the event-queue wrapper and avoid volatile flag issues.
            var emitFn = (socket.__origEmit || socket.emit).bind(socket);
            emitFn('app_ping', { t: Date.now() });

            // Check if we've heard back recently
            var silence = Date.now() - lastPongTime;
            console.log('[ConnHealth] Ping sent, silence = ' + (silence / 1000).toFixed(1) + 's');
            if (silence > MAX_SILENT_MS) {
                console.warn('[ConnHealth] No response for ' + (silence / 1000).toFixed(0) + 's — forcing reconnect');
                _showBanner('⚠ Connection lost — reconnecting…', 'rgba(200,40,40,0.92)');
                try { socket.disconnect(); } catch (e) { /* ignore */ }
                // Socket.IO will auto-reconnect if reconnection is enabled
                try { socket.connect(); } catch (e) { /* ignore */ }
            } else if (silence > PONG_TIMEOUT_MS) {
                _showBanner('⚠ Connection unstable — waiting for server…', 'rgba(180,130,20,0.92)');
            }
        }, PING_INTERVAL_MS);
    }

    function _stopHeartbeat() {
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }
    }

    // ── Attach to an existing Socket.IO socket ──
    // Call this once inside socketSetup() after the socket is created.
    function attach(sock) {
        if (!sock) return;

        // ── Connection established ──
        sock.on('connect', function () {
            connected = true;
            reconnecting = false;
            console.log('[ConnHealth] Connected (id=' + sock.id + ')');

            if (reconnectAttempts > 0) {
                _showBanner('✓ Reconnected!', 'rgba(40,160,60,0.92)');
                setTimeout(_hideBanner, 3000);
            } else {
                _hideBanner();
            }
            reconnectAttempts = 0;
            _startHeartbeat();
        });

        // ── Disconnected ──
        sock.on('disconnect', function (reason) {
            connected = false;
            if (typeof playerJoined !== 'undefined') playerJoined = false; // Stop batcher sending to stale socket
            console.warn('[ConnHealth] Disconnected:', reason);
            _showBanner('⚠ Disconnected — ' + reason, 'rgba(200,40,40,0.92)');
            _stopHeartbeat();

            // If the server kicked us, Socket.IO won't auto-reconnect.
            // "io server disconnect" = server called socket.disconnect()
            // "io client disconnect" = client called socket.disconnect()
            if (reason === 'io server disconnect') {
                console.log('[ConnHealth] Server forced disconnect — attempting manual reconnect in 2s');
                setTimeout(function () {
                    try { sock.connect(); } catch (e) { /* ignore */ }
                }, 2000);
            }
            // For transport-level disconnects Socket.IO's built-in
            // reconnection will kick in automatically.
        });

        // ── Reconnect lifecycle ──
        sock.io.on('reconnect_attempt', function (attempt) {
            reconnecting = true;
            reconnectAttempts = attempt;
            _showBanner('⚠ Reconnecting… (attempt ' + attempt + ')', 'rgba(200,120,20,0.92)');
            console.log('[ConnHealth] Reconnect attempt', attempt);
        });

        sock.io.on('reconnect', function (attempt) {
            connected = true;
            reconnecting = false;
            console.log('[ConnHealth] Reconnected after', attempt, 'attempts');
            _showBanner('✓ Reconnected!', 'rgba(40,160,60,0.92)');
            setTimeout(_hideBanner, 3000);
            _startHeartbeat();
        });

        sock.io.on('reconnect_failed', function () {
            reconnecting = false;
            console.error('[ConnHealth] Reconnection failed — giving up');
            _showBanner('✖ Could not reconnect. Please refresh the page.', 'rgba(160,30,30,0.95)');
            bannerEl.style.pointerEvents = 'auto';
            bannerEl.style.cursor = 'pointer';
            bannerEl.onclick = function () { location.reload(); };
        });

        sock.io.on('reconnect_error', function (err) {
            console.warn('[ConnHealth] Reconnect error:', err && err.message || err);
        });

        // ── Connection errors ──
        sock.on('connect_error', function (err) {
            connected = false;
            console.warn('[ConnHealth] Connection error:', err && err.message || err);
            if (!reconnecting) {
                _showBanner('⚠ Connection error — retrying…', 'rgba(200,40,40,0.92)');
            }
        });

        // ── App-level pong from server ──
        sock.on('app_pong', function () {
            lastPongTime = Date.now();
            console.log('[ConnHealth] Pong received, lastPongTime updated');
            // If banner was showing a "connection unstable" warning, clear it
            if (connected && bannerEl && bannerEl.style.display !== 'none') {
                _hideBanner();
            }
        });

        // If the socket is already connected (fast local connections),
        // the 'connect' event won't fire again, so start heartbeat now.
        if (sock.connected) {
            console.log('[ConnHealth] Socket already connected on attach — starting heartbeat immediately');
            connected = true;
            _startHeartbeat();
        }

        console.log('[ConnHealth] Monitoring attached to socket');
    }

    // ── Public API ──
    return {
        attach: attach,
        isConnected: function () { return connected; },
        isReconnecting: function () { return reconnecting; },
        getAttempts: function () { return reconnectAttempts; },
        getLastPong: function () { return lastPongTime; },
    };
})();
