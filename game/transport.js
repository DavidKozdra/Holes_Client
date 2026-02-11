// ============================================================
// CLIENT UDP TRANSPORT (WebRTC DataChannel via geckos.io)
// ============================================================
// Provides an unreliable, low-latency channel alongside Socket.IO.
// High-frequency events (position, projectiles, sounds, terrain)
// go over the DataChannel (UDP semantics). Everything else stays
// on Socket.IO (TCP/reliable).
//
// Usage:
//   udpTransport.send('event_name', data)   — fire & forget over UDP
//   udpTransport.on('EVENT_NAME', callback) — listen for UDP events
//   udpTransport.isReady()                  — true if DataChannel open
// ============================================================

var udpTransport = (function () {
    var channel = null;     // geckos.io client channel
    var ready = false;      // DataChannel open?
    var listeners = {};     // event → [callback, …]
    var pendingListeners = []; // listeners registered before channel opens
    var serverUrl = null;
    var serverPort = null;

    // Events that should be sent over UDP (client → server)
    var UDP_SEND_EVENTS = {
        'update_player': true,
        'update_node': true,
        'update_iron_node': true,
        'update_nodes': true,
        'update_iron_nodes': true,
        'new_proj': true,
        'delete_proj': true,
        'new_sound': true,
        'delete_sound': true,
        'EXPLOSION': true,
        'wander_request': true,
    };

    // Events received over UDP (server → client)
    var UDP_RECV_EVENTS = {
        'UPDATE_POS': true,
        'UPDATE_PLAYER': true,
        'ABILITY_VISUAL': true,
        'UPDATE_NODE': true,
        'UPDATE_IRON_NODE': true,
        'UPDATE_NODES': true,
        'UPDATE_IRON_NODES': true,
        'NEW_PROJECTILE': true,
        'DELETE_PROJ': true,
        'NEW_SOUND': true,
        'EXPLOSION': true,
        'WANDER_TARGET': true,
        'sync_time': true,
        'HEAL_PLANTS': true,
        'ENTITY_LEVEL_UPDATE': true,
        'PLAYER_COLOR_CHANGED': true,
        'PLAYERS_SYNC': true,
        'PLAYER_MARKED_DEAD': true,
    };

    /**
     * Initialize the UDP channel using a token from the server.
     * Call this after Socket.IO connects and receives the UDP_TOKEN event.
     * @param {string} token - Auth token from server
     * @param {string} url - Server URL (e.g., "http://localhost" or "https://example.com")
     * @param {number|null} port - Server port (e.g., 3000) or null to use url as-is
     */
    function init(token, url, port) {
        if (typeof GeckosClient === 'undefined' || !GeckosClient.default) {
            console.warn('[UDP] geckos.io client not loaded — all traffic will use Socket.IO');
            return;
        }

        serverUrl = url;
        serverPort = port;

        try {
            var geckos = GeckosClient.default;

            // Configure connection - set port to null if included in URL
            var options = {
                authorization: token,
                url: url,
                port: port,
                iceServers: [],  // Empty for local dev; add STUN/TURN for production
                label: 'holes-udp',
            };

            channel = geckos(options);

            channel.onConnect(function (error) {
                if (error) {
                    console.error('[UDP] Connection failed:', error.message || error);
                    ready = false;
                    return;
                }

                ready = true;
                console.log('[UDP] DataChannel connected! Low-latency transport active.');

                // Register any pending listeners
                for (var i = 0; i < pendingListeners.length; i++) {
                    var p = pendingListeners[i];
                    _registerListener(p.event, p.callback);
                }
                pendingListeners = [];
            });

            channel.onDisconnect(function (reason) {
                console.log('[UDP] DataChannel disconnected:', reason);
                ready = false;
                // Don't attempt reconnect — the Socket.IO channel is still active
                // and will serve as fallback. UDP will reconnect on next page load.
            });
        } catch (e) {
            console.error('[UDP] Failed to initialize:', e);
            ready = false;
        }
    }

    function _registerListener(event, callback) {
        if (channel) {
            channel.on(event, function (data) {
                try {
                    callback(data);
                } catch (e) {
                    console.error('[UDP] Error in listener for "' + event + '":', e);
                }
            });
        }
    }

    /**
     * Send a message over the UDP DataChannel.
     * Falls back silently (caller should also send via Socket.IO if needed).
     * @param {string} event
     * @param {*} data
     * @returns {boolean} true if sent via UDP, false if not available
     */
    function send(event, data) {
        if (ready && channel) {
            try {
                channel.emit(event, data);
                return true;
            } catch (e) {
                // Channel may have closed
                return false;
            }
        }
        return false;
    }

    /**
     * Register a listener for a UDP event from the server.
     * If the channel isn't ready yet, the listener is queued.
     * @param {string} event
     * @param {Function} callback
     */
    function on(event, callback) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);

        if (ready && channel) {
            _registerListener(event, callback);
        } else {
            pendingListeners.push({ event: event, callback: callback });
        }
    }

    /**
     * Check if the UDP channel is open and ready.
     * @returns {boolean}
     */
    function isReady() {
        return ready;
    }

    /**
     * Check if an event should be sent over UDP.
     * @param {string} event
     * @returns {boolean}
     */
    function shouldSendViaUDP(event) {
        return UDP_SEND_EVENTS[event] === true;
    }

    /**
     * Check if an event will be received over UDP.
     * @param {string} event
     * @returns {boolean}
     */
    function isUdpRecvEvent(event) {
        return UDP_RECV_EVENTS[event] === true;
    }

    /**
     * Smart emit: sends via UDP if available and appropriate, otherwise via Socket.IO.
     * For UDP events, this prefers the DataChannel but falls back to socket.emit.
     * @param {string} event
     * @param {*} data
     */
    function emit(event, data) {
        if (shouldSendViaUDP(event) && ready && channel) {
            try {
                channel.emit(event, data);
                return; // Sent via UDP, no need for Socket.IO
            } catch (e) {
                // Fall through to Socket.IO
            }
        }
        // Fallback: send via Socket.IO
        if (typeof socket !== 'undefined' && socket && socket.connected) {
            socket.emit(event, data);
        }
    }

    /**
     * Close the UDP channel.
     */
    function close() {
        if (channel) {
            try { channel.close(); } catch (e) { /* ignore */ }
        }
        ready = false;
        channel = null;
        listeners = {};
        pendingListeners = [];
    }

    /**
     * Monkey-patch a Socket.IO socket's emit method so that UDP-eligible
     * events are transparently routed through the DataChannel when it is
     * open.  This means ALL existing `socket.emit(...)` calls throughout
     * the codebase benefit from UDP automatically — no per-call changes.
     *
     * Call once after the Socket.IO socket is created:
     *   udpTransport.wrapSocketEmit(socket);
     *
     * @param {object} sock - The Socket.IO client socket instance
     */
    function wrapSocketEmit(sock) {
        if (!sock || sock.__udpWrapped) return; // already wrapped
        var _origEmit = sock.emit.bind(sock);
        sock.emit = function (event) {
            // If the DataChannel is open and this is a UDP-eligible event,
            // send over the DataChannel instead of Socket.IO.
            // Only intercept if there's no ack callback (3rd+ arg), since
            // UDP doesn't support request/response acknowledgements.
            if (shouldSendViaUDP(event) && ready && channel && arguments.length <= 2) {
                try {
                    channel.emit(event, arguments[1]);
                    return sock; // match Socket.IO return convention
                } catch (e) {
                    // DataChannel error — fall through to Socket.IO
                }
            }
            // Forward ALL arguments to the original emit (preserves ack callbacks, etc.)
            return _origEmit.apply(sock, arguments);
        };
        sock.__udpWrapped = true;
    }

    return {
        init: init,
        send: send,
        on: on,
        emit: emit,
        isReady: isReady,
        shouldSendViaUDP: shouldSendViaUDP,
        isUdpRecvEvent: isUdpRecvEvent,
        wrapSocketEmit: wrapSocketEmit,
        close: close,
    };
})();
