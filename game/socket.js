// ============================================================
// PLAYER STATE BATCHING SYSTEM - Reduces network overhead
// ============================================================
var socket; //Connection to the server - declared first
var curID = null; //The ID of the current player
var playerStateBatcher; // Will be initialized immediately after class definition

// Accumulates player updates and sends them in batches every 100ms
class PlayerStateBatcher {
    constructor(batchInterval = 100) {
        this.batchInterval = batchInterval;
        this.buffer = {
            update_names: [],
            update_values: [],
            pos: null,
            holding: null
        };
        this.flushTimer = null;
        this.isDirty = false;
        this.lastFlush = 0;
    }

    addUpdate(fieldName, fieldValue) {
        // Check if field already exists in buffer
        const existingIndex = this.buffer.update_names.indexOf(fieldName);
        if (existingIndex >= 0) {
            // Update existing value
            this.buffer.update_values[existingIndex] = fieldValue;
        } else {
            // Add new field
            this.buffer.update_names.push(fieldName);
            this.buffer.update_values.push(fieldValue);
        }
        this.isDirty = true;
        this._scheduleFlush();
    }

    setPosition(pos) {
        this.buffer.pos = pos;
        this.isDirty = true;
        this._scheduleFlush();
    }

    setHolding(holding) {
        this.buffer.holding = holding;
        this.isDirty = true;
        this._scheduleFlush();
    }

    _scheduleFlush() {
        if (this.flushTimer) return; // Already scheduled
        
        const now = Date.now();
        const timeSinceLastFlush = now - this.lastFlush;
        
        if (timeSinceLastFlush >= this.batchInterval) {
            // Enough time passed, flush immediately
            this.flush();
        } else {
            // Schedule flush for remaining time
            const delay = this.batchInterval - timeSinceLastFlush;
            this.flushTimer = setTimeout(() => this.flush(), delay);
        }
    }

    flush() {
        if (!this.isDirty || !socket || !socket.connected) {
            this.flushTimer = null;
            return;
        }

        if (typeof curPlayer === 'undefined' || !curPlayer) {
            this.flushTimer = null;
            return;
        }

        const updateData = {
            id: curPlayer.id,
            pos: this.buffer.pos || curPlayer.pos,
            holding: this.buffer.holding || curPlayer.holding,
            update_names: this.buffer.update_names.slice(),
            update_values: this.buffer.update_values.slice()
        };

        // Only send if there's something to send
        if (updateData.update_names.length > 0 || this.buffer.pos || this.buffer.holding) {
            socket.emit('update_player', updateData);
        }

        // Reset buffer
        this.buffer = {
            update_names: [],
            update_values: [],
            pos: null,
            holding: null
        };
        this.isDirty = false;
        this.lastFlush = Date.now();
        this.flushTimer = null;
    }

    // Force immediate flush when needed (e.g., on critical events)
    flushImmediate() {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        this.flush();
    }
}

// Initialize batcher immediately - this must happen before any code tries to use it
playerStateBatcher = new PlayerStateBatcher(100);

// ============================================================
// SOCKET LISTENERS - Now defined after batcher initialization
// ============================================================

function socketSetup(){
    // Listen for explosion events and spawn visuals for all clients
    socket.on('EXPLOSION', (data) => {
        if (typeof createExplosion !== 'undefined') {
            createExplosion({ pos: { x: data.x, y: data.y }, size: { w: data.w, h: data.h } });
        }
        if (typeof spawnExplosion !== 'undefined') {
            spawnExplosion(data.x, data.y, data.w, data.h);
        }
    });
    // Listen for explicit ability visual state events from the server
    socket.on('ABILITY_VISUAL', (data) => {
        // data: { playerId, ability, value }
        if (players && players[data.playerId]) {
            // Set the visual state field directly
            players[data.playerId][data.ability] = data.value;
        }
    });
    
    //all caps means it came from the server
    //all lower means it came from the client

    // Handle page close/refresh - send player data to server
    window.addEventListener('beforeunload', (event) => {
        if (socket && socket.connected && curPlayer) {
            // Prepare complete player data for persistence
            const completeData = {
                playerName: curPlayer.name,
                pos: curPlayer.pos ? { x: curPlayer.pos.x, y: curPlayer.pos.y } : { x: 0, y: 0 },
                race: curPlayer.race,
                teamId: curPlayer.teamId || null,
                color: curPlayer.color || 0,
                // Stats
                statBlock: curPlayer.statBlock ? {
                    race: curPlayer.statBlock.race,
                    level: curPlayer.statBlock.level,
                    xp: curPlayer.statBlock.xp,
                    xpNeeded: curPlayer.statBlock.xpNeeded,
                    stats: curPlayer.statBlock.stats
                } : null,
                maxDirtInv: maxDirtInv,
                // Inventory
                invBlock: curPlayer.invBlock ? {
                    items: curPlayer.invBlock.items || {},
                    hotbar: Array.isArray(curPlayer.invBlock.hotbar) ? curPlayer.invBlock.hotbar : ["","","","",""],
                    selectedHotBar: typeof curPlayer.invBlock.selectedHotBar === 'number' ? curPlayer.invBlock.selectedHotBar : 0,
                    equiped: curPlayer.invBlock.equiped || { head: "", neck: "", chest: "", legs: "", feet: "" }
                } : null,
                // Move slots
                movesSlots: Array.isArray(curPlayer.movesSlots) ? curPlayer.movesSlots : null
            };
            
            // Send via sendBeacon (most reliable for unload events)
            navigator.sendBeacon('/api/save-player-data', JSON.stringify(completeData));
            
            // Also emit socket event with short timeout as backup
            socket.emit('player_saving', { playerName: curPlayer.name });
        }
    });

    // Server capacity notification
    socket.on('SERVER_FULL', (data) => {
        try {
            const msg = data && data.message
                ? `${data.message} (${data.current ?? '?'} / ${data.max ?? '?'})`
                : 'Server is full. Please try again later.';
            alert(msg);
        } catch (e) {
            // no-op
        }
        // Back to server selection UI
        try {
            if (typeof gameState !== 'undefined') gameState = 'initial';
            const canvas = document.getElementById('canvas-container');
            if (canvas) canvas.style.display = 'none';
        } catch (e) {}
        try {
            socket.disconnect();
        } catch (e) {}
    });

    // Permadeath notification from server
    socket.on('PERMA_DEATH', () => {
        window.isHardcoreServer = true;
        // Death UI will handle the restart button
    });

    // Socket event handlers
    socket.on('GIVE_MAP', (data) => {
        testMap.data = data;
    });

    socket.on('NEW_PLAYER', (data) => {
        players[data.id] = new Player(
            data.pos.x,
            data.pos.y,
            data.hp,
            data.id,
            data.color,
            data.race,
            data.name
        );
        updatePlayerCount();

        if(data.statBlock.level != 1){
            players[data.id].statBlock.level = data.statBlock.level;
            // Merge stats and preserve healthRegen from BASE_STATS since server doesn't track it
            const baseRegen = BASE_STATS[players[data.id].race].healthRegen;
            Object.assign(players[data.id].statBlock.stats, data.statBlock.stats);
            players[data.id].statBlock.stats.healthRegen = baseRegen;
        }

        // Sync team data if player is part of a team
        if (data.teamId) {
            players[data.id].teamId = data.teamId;
        }

        //console.log("New player added: " + data.id);
    });

    socket.on('OLD_DATA', (data) => {
        let keys = Object.keys(data.players);
        for (let i = 0; i < keys.length; i++) {
            const playerData = data.players[keys[i]];
            //console.log(playerData);
            players[keys[i]] = new Player(
                playerData.pos.x,
                playerData.pos.y,
                playerData.statBlock.stats.hp,
                keys[i],
                playerData.color,
                playerData.race,
                playerData.name
            );

            if(data.players[keys[i]].statBlock.level != 1){
                players[keys[i]].statBlock.level = data.players[keys[i]].statBlock.level;
                // Merge stats and preserve healthRegen from BASE_STATS since server doesn't track it
                const baseRegen = BASE_STATS[players[keys[i]].race].healthRegen;
                Object.assign(players[keys[i]].statBlock.stats, data.players[keys[i]].statBlock.stats);
                players[keys[i]].statBlock.stats.healthRegen = baseRegen;
            }
        }
    });

    socket.on('YOUR_ID', (data) => {
        if(curID != null && curPlayer){
            //console.log("Your ID is already set to: " + curPlayer.id);
            //console.log("New ID received: " + data.id);
            //Reconnection
            curPlayer.id = data.id;
            socket.emit("player_reconnected", {
                player: curPlayer,
                oldID: curID
            });
            curID = data.id;
        }
        else{
            curID = data.id;
            //console.log("New ID received: " + data.id);
        }
        
    });

    // Handle items response from server after requesting them
    socket.on('receive_my_items', (data) => {
        if (!curPlayer) return;
        
        if (data.hasOldItems) {
            try {
                const clampHP = (statsObj) => {
                    if (!statsObj || typeof statsObj.hp !== 'number' || typeof statsObj.mhp !== 'number') return;
                    if (statsObj.hp > statsObj.mhp) statsObj.hp = statsObj.mhp;
                    if (statsObj.hp < 0) statsObj.hp = 0;
                };

                // Restore position first
                if (data.pos && typeof data.pos.x === 'number' && typeof data.pos.y === 'number') {
                    curPlayer.pos.x = data.pos.x;
                    curPlayer.pos.y = data.pos.y;
                    camera.pos = createVector(data.pos.x, data.pos.y);
                }
                
                // Restore stats
                if (data.statBlock) {
                    const sb = data.statBlock;
                    if (curPlayer.statBlock && typeof curPlayer.statBlock.heal === 'function') {
                        if (sb.race != null) curPlayer.statBlock.race = sb.race;
                        if (typeof sb.level === 'number') curPlayer.statBlock.level = sb.level;
                        if (typeof sb.xp === 'number') curPlayer.statBlock.xp = sb.xp;
                        if (typeof sb.xpNeeded === 'number') curPlayer.statBlock.xpNeeded = sb.xpNeeded;
                        // Merge saved stats with base stats to ensure all properties exist
                        if (sb.stats && typeof sb.stats === 'object') {
                            const raceIndex = sb.race != null ? sb.race : curPlayer.race;
                            const baseStats = JSON.parse(JSON.stringify(BASE_STATS[raceIndex]));
                            curPlayer.statBlock.stats = Object.assign({}, baseStats, sb.stats);
                            clampHP(curPlayer.statBlock.stats);
                        }
                    } else {
                        const health = (sb.stats && typeof sb.stats.hp === 'number') ? sb.stats.hp : undefined;
                        const raceIndex = (typeof sb.race === 'number') ? sb.race : (typeof curPlayer.race === 'number' ? curPlayer.race : 0);
                        curPlayer.statBlock = new StatBlock(raceIndex, health);
                        if (typeof sb.level === 'number') curPlayer.statBlock.level = sb.level;
                        if (typeof sb.xp === 'number') curPlayer.statBlock.xp = sb.xp;
                        if (typeof sb.xpNeeded === 'number') curPlayer.statBlock.xpNeeded = sb.xpNeeded;
                        // Merge saved stats with base stats to ensure all properties exist
                        if (sb.stats && typeof sb.stats === 'object') {
                            const baseStats = JSON.parse(JSON.stringify(BASE_STATS[raceIndex]));
                            curPlayer.statBlock.stats = Object.assign({}, baseStats, sb.stats);
                            clampHP(curPlayer.statBlock.stats);
                        }
                    }
                }
                
                // Restore inventory - inventory is already empty from constructor
                if (data.invBlock) {
                    const inv = data.invBlock;
                    const itemsIn = inv.items || {};
                    const names = Object.keys(itemsIn);
                    
                    for (let i = 0; i < names.length; i++) {
                        const name = names[i];
                        const rec = itemsIn[name];
                        const amt = (rec && typeof rec.amount === 'number') ? rec.amount : (typeof rec === 'number' ? rec : 1);
                        curPlayer.invBlock.addItem(name, amt, false);
                        const inst = curPlayer.invBlock.items[name];
                        if (rec && typeof rec === 'object') {
                            if (typeof rec.durability === 'number') inst.durability = rec.durability;
                            if (typeof rec.maxDurability === 'number') inst.maxDurability = rec.maxDurability;
                        }
                    }
                    
                    // Restore hotbar
                    if (Array.isArray(inv.hotbar)) {
                        curPlayer.invBlock.hotbar = inv.hotbar.slice(0, 5);
                        for (let i = 0; i < curPlayer.invBlock.hotbar.length; i++) {
                            const key = curPlayer.invBlock.hotbar[i];
                            if (!key || !curPlayer.invBlock.items[key]) curPlayer.invBlock.hotbar[i] = "";
                        }
                    }
                    
                    if (typeof inv.selectedHotBar === 'number') {
                        curPlayer.invBlock.selectedHotBar = Math.max(0, Math.min(4, inv.selectedHotBar));
                    }
                    
                    // Restore equipped items
                    if (inv.equiped && typeof inv.equiped === 'object') {
                        const eq = inv.equiped;
                        const slots = ["head","neck","chest","legs","feet"];
                        for (let i = 0; i < slots.length; i++) {
                            const s = slots[i];
                            const itemName = eq[s] || "";
                            curPlayer.invBlock.equiped[s] = (itemName && curPlayer.invBlock.items[itemName]) ? itemName : "";
                        }
                    }
                }
                
                // Restore team
                if (data.teamId) {
                    curPlayer.teamId = data.teamId;
                }

                // Restore dirt bag capacity (default 600 if missing)
                if (typeof data.maxDirtInv === 'number') {
                    maxDirtInv = data.maxDirtInv;
                } else {
                    maxDirtInv = maxDirtInv || 600;
                }
                if (curPlayer) curPlayer.maxDirtInv = maxDirtInv;
                if (typeof dirtInv === 'number' && dirtInv > maxDirtInv) dirtInv = maxDirtInv;
                
                // Restore move slots
                if (Array.isArray(data.movesSlots)) {
                    curPlayer.movesSlots = data.movesSlots.slice(0, 10);
                    while (curPlayer.movesSlots.length < 10) {
                        curPlayer.movesSlots.push(null);
                    }
                }
            } catch (e) {
                console.error('[Items] Failed to restore old inventory:', e);
                // Fallback to starter kit on error
                if (typeof giveDefaultItems === 'function') {
                    giveDefaultItems();
                }
            }
        } else {
            // New player - give starter kit
            if (typeof giveDefaultItems === 'function') {
                giveDefaultItems();
            }

            // Reset dirt bag capacity for new players
            maxDirtInv = 600;
            if (curPlayer) curPlayer.maxDirtInv = maxDirtInv;
        }
    });

    // Apply saved snapshot (inventory/statBlock/pos) when provided by server
    socket.on('PLAYER_SNAPSHOT', (data) => {
        if (!curPlayer) return;
        try {
            let hasOldKit = false;

            const clampHP = (statsObj) => {
                if (!statsObj || typeof statsObj.hp !== 'number' || typeof statsObj.mhp !== 'number') return;
                if (statsObj.hp > statsObj.mhp) statsObj.hp = statsObj.mhp;
                if (statsObj.hp < 0) statsObj.hp = 0;
            };
            
            if (data.pos && typeof data.pos.x === 'number' && typeof data.pos.y === 'number') {
                curPlayer.pos.x = data.pos.x;
                curPlayer.pos.y = data.pos.y;
            }
            if (data.statBlock) {
                const sb = data.statBlock;
                // Preserve StatBlock methods; merge snapshot values
                if (curPlayer.statBlock && typeof curPlayer.statBlock.heal === 'function') {
                    if (sb.race != null) curPlayer.statBlock.race = sb.race;
                    if (typeof sb.level === 'number') curPlayer.statBlock.level = sb.level;
                    if (typeof sb.xp === 'number') curPlayer.statBlock.xp = sb.xp;
                    if (typeof sb.xpNeeded === 'number') curPlayer.statBlock.xpNeeded = sb.xpNeeded;
                    if (sb.stats && typeof sb.stats === 'object') {
                        curPlayer.statBlock.stats = sb.stats;
                        clampHP(curPlayer.statBlock.stats);
                    }
                } else {
                    // If somehow missing methods, rehydrate a new instance
                    const health = (sb.stats && typeof sb.stats.hp === 'number') ? sb.stats.hp : undefined;
                    const raceIndex = (typeof sb.race === 'number') ? sb.race : (typeof curPlayer.race === 'number' ? curPlayer.race : 0);
                    curPlayer.statBlock = new StatBlock(raceIndex, health);
                    if (typeof sb.level === 'number') curPlayer.statBlock.level = sb.level;
                    if (typeof sb.xp === 'number') curPlayer.statBlock.xp = sb.xp;
                    if (typeof sb.xpNeeded === 'number') curPlayer.statBlock.xpNeeded = sb.xpNeeded;
                    if (sb.stats && typeof sb.stats === 'object') {
                        curPlayer.statBlock.stats = sb.stats;
                        clampHP(curPlayer.statBlock.stats);
                    }
                }
            }
            if (data.invBlock) {
                hasOldKit = true;
                const inv = data.invBlock;
                // Clear default items since we're restoring old kit
                curPlayer.invBlock.items = {};
                curPlayer.invBlock.hotbar = ["", "", "", "", ""];
                curPlayer.invBlock.selectedHotBar = 0;
                curPlayer.invBlock.equiped = { head: "", neck: "", chest: "", legs: "", feet: "" };
                
                // Hydrate plain item records into item instances
                const itemsIn = inv.items || {};
                const names = Object.keys(itemsIn);
                for (let i = 0; i < names.length; i++) {
                    const name = names[i];
                    const rec = itemsIn[name];
                    const amt = (rec && typeof rec.amount === 'number') ? rec.amount : (typeof rec === 'number' ? rec : 1);
                    curPlayer.invBlock.addItem(name, amt, false);
                    const inst = curPlayer.invBlock.items[name];
                    if (rec && typeof rec === 'object') {
                        if (typeof rec.durability === 'number') inst.durability = rec.durability;
                        if (typeof rec.maxDurability === 'number') inst.maxDurability = rec.maxDurability;
                    }
                }

                // Apply hotbar, validating any missing items
                if (Array.isArray(inv.hotbar)) {
                    curPlayer.invBlock.hotbar = inv.hotbar.slice(0, 5);
                    for (let i = 0; i < curPlayer.invBlock.hotbar.length; i++) {
                        const key = curPlayer.invBlock.hotbar[i];
                        if (!key || !curPlayer.invBlock.items[key]) curPlayer.invBlock.hotbar[i] = "";
                    }
                }
                // Clamp selected hotbar index
                if (typeof inv.selectedHotBar === 'number') {
                    const idx = Math.max(0, Math.min(4, inv.selectedHotBar));
                    curPlayer.invBlock.selectedHotBar = idx;
                }
                // Apply equiped slots, validating presence
                if (inv.equiped && typeof inv.equiped === 'object') {
                    const eq = inv.equiped;
                    const slots = ["head","neck","chest","legs","feet"];
                    for (let i = 0; i < slots.length; i++) {
                        const s = slots[i];
                        const itemName = eq[s] || "";
                        curPlayer.invBlock.equiped[s] = (itemName && curPlayer.invBlock.items[itemName]) ? itemName : "";
                    }
                }
            }
            // Optionally update team
            if (data.teamId) {
                curPlayer.teamId = data.teamId;
            }

            // Restore dirt bag capacity
            if (typeof data.maxDirtInv === 'number') {
                maxDirtInv = data.maxDirtInv;
            } else {
                maxDirtInv = maxDirtInv || 600;
            }
            curPlayer.maxDirtInv = maxDirtInv;
            if (typeof dirtInv === 'number' && dirtInv > maxDirtInv) dirtInv = maxDirtInv;
            
            // If no old kit was restored, give default items now
            if (!hasOldKit && typeof giveDefaultItems === 'function') {
                console.log('[Persistence] No old kit found for player - giving default items');
                giveDefaultItems();
            } else if (hasOldKit) {
                console.log('[Persistence] Old kit restored for player');
            }
        } catch (e) {
            console.warn('Failed to apply PLAYER_SNAPSHOT', e);
        }
    });

    socket.on("change_name", (data) => {
        curPlayer.name = data
    });

    socket.on('REMOVE_PLAYER', (data) => {
        players[data] = {};
        delete players[data];
        updatePlayerCount();
    });

    socket.on('PLAYERS_CHECK', (data) => {
        if(data.ids.length != Object.keys(players).length+1){
            let keys = Object.keys(players);
            for(let i= 0; i < keys.length; i++){
                if(!data.ids.includes(keys[i])){
                    players[keys[i]] = {};
                    delete players[keys[i]];
                }
            }
            updatePlayerCount();
        }
    });

    socket.on('UPDATE_ALL_POS', (data) => {
        let keys = Object.keys(data);

        // Update players' positions
        for (let i = 0; i < keys.length; i++) {
            const playerId = keys[i];
            const playerData = data[playerId];

            if (playerId === curPlayer.id) {
                socket.emit('update_pos', {
                    id: curPlayer.id,
                    pos: curPlayer.pos,
                    holding: curPlayer.holding
                });
            } else {
                if (players[playerId]) {
                    players[playerId].pos.x = playerData.pos.x;
                    players[playerId].pos.y = playerData.pos.y;
                    players[playerId].hp = playerData.hp;
                    players[playerId].holding = playerData.holding;
                    players[playerId].direction = playerData.direction;
                }
            }
        }
    });

    socket.on('UPDATE_POS', (data) => {
        if (players[data.id]) {
            players[data.id].pos.x = data.pos.x;
            players[data.id].pos.y = data.pos.y;
            players[data.id].holding = data.holding;
        }
    });

    socket.on("UPDATE_PLAYER", (data) =>{
        if(players[data.id]){
            for(let i=0; i<data.update_names.length; i++){
                const name = data.update_names[i];
                const value = data.update_values[i];
                if(name.includes("stats")){
                    players[data.id].statBlock.stats[name.split("stats.")[1]] = value;
                }
                else if(name.includes("statBlock")){
                    players[data.id].statBlock[name.split("statBlock.")[1]] = value;
                }
                // Sync all move/ability state fields (e.g., forcefieldActive, auraTimer, isDashing, flashTimer, meditateActive, meditateTimer, dashTimer, dashCooldown, particles, etc)
                else if (name === "particles" && Array.isArray(value)) {
                    // Deep copy to avoid reference issues
                    players[data.id].particles = value.map(p => Object.assign({}, p));
                }
                else if (
                    name.endsWith("Active") ||
                    name.endsWith("Timer") ||
                    name.endsWith("Cooldown") ||
                    name.endsWith("flashTimer") ||
                    name.endsWith("isDashing")
                ) {
                    players[data.id][name] = value;
                }
                else{
                    players[data.id][name] = value;
                }
            }
            players[data.id].pos.x = data.pos.x;
            players[data.id].pos.y = data.pos.y;
            players[data.id].holding = data.holding;
        }
    })

    socket.on("UPDATE_NODE", (data) => {
        if(testMap.chunks[data.chunkPos] != undefined){
            if(data.amt > 0){
                if (testMap.chunks[data.chunkPos].data[data.index] > 0) testMap.chunks[data.chunkPos].data[data.index] -= data.amt;
                if (testMap.chunks[data.chunkPos].data[data.index] < 0.3 && testMap.chunks[data.chunkPos].data[data.index] !== -1){
                    testMap.chunks[data.chunkPos].data[data.index] = 0;
                }
            }
            else{
                if (testMap.chunks[data.chunkPos].data[data.index] < 1.3 && testMap.chunks[data.chunkPos].data[data.index] !== -1){
                    testMap.chunks[data.chunkPos].data[data.index] -= data.amt;
                }
                if (testMap.chunks[data.chunkPos].data[data.index] > 1.3){
                    testMap.chunks[data.chunkPos].data[data.index] = 1.3;
                }
            }
        }
    });

    socket.on("UPDATE_IRON_NODE", (data) => {
        if(testMap.chunks[data.chunkPos] != undefined){
            if(data.amt > 0){
                if (testMap.chunks[data.chunkPos].iron_data[data.index] > 0) testMap.chunks[data.chunkPos].iron_data[data.index] -= data.amt;
                if (testMap.chunks[data.chunkPos].iron_data[data.index] < 0.3 && testMap.chunks[data.chunkPos].iron_data[data.index] !== -1){
                    testMap.chunks[data.chunkPos].iron_data[data.index] = 0;
                }
            }
            else{
                if (testMap.chunks[data.chunkPos].iron_data[data.index] < 1.3 && testMap.chunks[data.chunkPos].iron_data[data.index] !== -1){
                    testMap.chunks[data.chunkPos].iron_data[data.index] -= data.amt;
                }
                if (testMap.chunks[data.chunkPos].iron_data[data.index] > 1.3){
                    testMap.chunks[data.chunkPos].iron_data[data.index] = 1.3;
                }
            }
        }
    });

    socket.on("UPDATE_NODES", (data) => {
        //console.log("update nodes", data);
        let chunk = testMap.getChunk(data.cx, data.cy);
        let posX = Math.round(data.pos.x / TILESIZE);
        let posY = Math.round(data.pos.y / TILESIZE);
        posX = posX - (data.cx * CHUNKSIZE);
        posY = posY - (data.cy * CHUNKSIZE);
        for(let x = posX-data.radius; x <= posX+data.radius; x++){
            for(let y = posY-data.radius; y <= posY+data.radius; y++){
                if(x >= 0 && x < CHUNKSIZE && y >= 0 && y < CHUNKSIZE){
                    let index = x + y * CHUNKSIZE;
                    if(data.amt > 0){
                        if (chunk.data[index] > 0) chunk.data[index] -= data.amt;
                        if (chunk.data[index] < 0.3 && chunk.data[index] !== -1){
                            chunk.data[index] = 0;
                        }
                    }
                    else{
                        if (chunk.data[index] < 1.3 && chunk.data[index] !== -1){
                            chunk.data[index] -= data.amt;
                        }
                        if (chunk.data[index] > 1.3){
                            chunk.data[index] = 1.3;
                        }
                    }
                }
                else{
                    //deal with the edge cases where the node is outside the chunk
                    let tempChunk;
                    let index;
                    if(y < 0 && x >= 0 && x < CHUNKSIZE){ // top edge
                        tempChunk = testMap.getChunk(data.cx, data.cy-1);
                        index = x + (CHUNKSIZE + y) * CHUNKSIZE;
                    }
                    else if(y >= CHUNKSIZE && x >= 0 && x < CHUNKSIZE){ // bottom edge
                        tempChunk = testMap.getChunk(data.cx, data.cy+1);
                        index = x + (y - CHUNKSIZE) * CHUNKSIZE;
                    }
                    else if(x < 0 && y >= 0 && y < CHUNKSIZE){ // left edge
                        tempChunk = testMap.getChunk(data.cx-1, data.cy);
                        index = (CHUNKSIZE + x) + y * CHUNKSIZE;
                    }
                    else if(x >= CHUNKSIZE && y >= 0 && y < CHUNKSIZE){ // right edge
                        tempChunk = testMap.getChunk(data.cx+1, data.cy);
                        index = (x - CHUNKSIZE) + y * CHUNKSIZE;
                    }
                    else if(x < 0 && y < 0){ // top left corner
                        tempChunk = testMap.getChunk(data.cx-1, data.cy-1);
                        index = (CHUNKSIZE + x) + (CHUNKSIZE + y) * CHUNKSIZE;
                    }
                    else if(x >= CHUNKSIZE && y < 0){ // top right corner
                        tempChunk = testMap.getChunk(data.cx+1, data.cy-1);
                        index = (x - CHUNKSIZE) + (CHUNKSIZE + y) * CHUNKSIZE;
                    }
                    else if(x < 0 && y >= CHUNKSIZE){ // bottom left corner
                        tempChunk = testMap.getChunk(data.cx-1, data.cy+1);
                        index = (CHUNKSIZE + x) + (y - CHUNKSIZE) * CHUNKSIZE;
                    }
                    else if(x >= CHUNKSIZE && y >= CHUNKSIZE){ // bottom right corner
                        tempChunk = testMap.getChunk(data.cx+1, data.cy+1);
                        index = (x - CHUNKSIZE) + (y - CHUNKSIZE) * CHUNKSIZE;
                    }
                    if(tempChunk != undefined){
                        if(index != undefined){
                            if(data.amt > 0){
                                if (tempChunk.data[index] > 0) tempChunk.data[index] -= data.amt;
                                if (tempChunk.data[index] < 0.3 && tempChunk.data[index] !== -1){
                                    tempChunk.data[index] = 0;
                                }
                            }
                            else{
                                if (tempChunk.data[index] < 1.3 && tempChunk.data[index] !== -1){
                                    tempChunk.data[index] -= data.amt;
                                }
                                if (tempChunk.data[index] > 1.3){
                                    tempChunk.data[index] = 1.3;
                                }
                            }
                        }
                    }
                }

            }
        }
    });

    socket.on("UPDATE_IRON_NODES", (data) => {
        // iron node updates should not double-process normal nodes
        let chunk = testMap.getChunk(data.cx, data.cy);
        let posX = Math.round(data.pos.x / TILESIZE);
        let posY = Math.round(data.pos.y / TILESIZE);
        posX = posX - (data.cx * CHUNKSIZE);
        posY = posY - (data.cy * CHUNKSIZE);
        for(let x = posX-data.radius; x <= posX+data.radius; x++){
            for(let y = posY-data.radius; y <= posY+data.radius; y++){
                if(x >= 0 && x < CHUNKSIZE && y >= 0 && y < CHUNKSIZE){
                    let index = x + y * CHUNKSIZE;
                    if(data.amt > 0){
                        if (chunk.iron_data[index] > 0) chunk.iron_data[index] -= data.amt;
                        if (chunk.iron_data[index] < 0.3 && chunk.iron_data[index] !== -1){
                            chunk.iron_data[index] = 0;
                        }
                    }
                    else{
                        if (chunk.iron_data[index] < 1.3 && chunk.iron_data[index] !== -1){
                            chunk.iron_data[index] -= data.amt;
                        }
                        if (chunk.iron_data[index] > 1.3){
                            chunk.iron_data[index] = 1.3;
                        }
                    }
                }
                else{
                    //deal with the edge cases where the node is outside the chunk
                    let tempChunk;
                    let index;
                    if(y < 0 && x >= 0 && x < CHUNKSIZE){ // top edge
                        tempChunk = testMap.getChunk(data.cx, data.cy-1);
                        index = x + (CHUNKSIZE + y) * CHUNKSIZE;
                    }
                    else if(y >= CHUNKSIZE && x >= 0 && x < CHUNKSIZE){ // bottom edge
                        tempChunk = testMap.getChunk(data.cx, data.cy+1);
                        index = x + (y - CHUNKSIZE) * CHUNKSIZE;
                    }
                    else if(x < 0 && y >= 0 && y < CHUNKSIZE){ // left edge
                        tempChunk = testMap.getChunk(data.cx-1, data.cy);
                        index = (CHUNKSIZE + x) + y * CHUNKSIZE;
                    }
                    else if(x >= CHUNKSIZE && y >= 0 && y < CHUNKSIZE){ // right edge
                        tempChunk = testMap.getChunk(data.cx+1, data.cy);
                        index = (x - CHUNKSIZE) + y * CHUNKSIZE;
                    }
                    else if(x < 0 && y < 0){ // top left corner
                        tempChunk = testMap.getChunk(data.cx-1, data.cy-1);
                        index = (CHUNKSIZE + x) + (CHUNKSIZE + y) * CHUNKSIZE;
                    }
                    else if(x >= CHUNKSIZE && y < 0){ // top right corner
                        tempChunk = testMap.getChunk(data.cx+1, data.cy-1);
                        index = (x - CHUNKSIZE) + (CHUNKSIZE + y) * CHUNKSIZE;
                    }
                    else if(x < 0 && y >= CHUNKSIZE){ // bottom left corner
                        tempChunk = testMap.getChunk(data.cx-1, data.cy+1);
                        index = (CHUNKSIZE + x) + (y - CHUNKSIZE) * CHUNKSIZE;
                    }
                    else if(x >= CHUNKSIZE && y >= CHUNKSIZE){ // bottom right corner
                        tempChunk = testMap.getChunk(data.cx+1, data.cy+1);
                        index = (x - CHUNKSIZE) + (y - CHUNKSIZE) * CHUNKSIZE;
                    }
                    if(tempChunk != undefined){
                        if(index != undefined){
                            if(data.amt > 0){
                                if (tempChunk.iron_data[index] > 0) tempChunk.iron_data[index] -= data.amt;
                                if (tempChunk.iron_data[index] < 0.3 && tempChunk.iron_data[index] !== -1){
                                    tempChunk.iron_data[index] = 0;
                                }
                            }
                            else{
                                if (tempChunk.iron_data[index] < 1.3 && tempChunk.iron_data[index] !== -1){
                                    tempChunk.iron_data[index] -= data.amt;
                                }
                                if (tempChunk.iron_data[index] > 1.3){
                                    tempChunk.iron_data[index] = 1.3;
                                }
                            }
                        }
                    }
                }

            }
        }
    });

    socket.on("NEW_OBJECT", (data) => {
        // Only log entities
        if(data.obj.brainID !== undefined) {
            console.log('[Client] NEW_OBJECT received:', data.obj.objName, 'at chunk', data.cx + ',' + data.cy, 'race:', data.obj.race, 'brainID:', data.obj.brainID);
        }
        const chunkKey = getChunkKey(data.cx, data.cy);
        let chunk = testMap.chunks[chunkKey];
        if(chunk != undefined){
            let temp = createObject(data.obj.objName, data.obj.pos.x, data.obj.pos.y, data.obj.rot, data.obj.color, data.obj.id, data.obj.ownerName, data.obj.brainID);

            if(temp.type == "InvObj"){
                temp.invBlock.invId = data.obj.invBlock.invId;
                let keys = Object.keys(data.obj.invBlock.items);
                for(let i=0; i<keys.length; i++){
                    temp.invBlock.addItem(keys[i], data.obj.invBlock.items[keys[i]].amount, false);
                }
            }
            if(temp.objName == "ExpOrb"){
                temp.id = data.obj.id;
            }
            if(temp.objName == "Sign"){
                temp.txt = data.obj.txt;
            }
            chunk.objects.push(temp);
            chunk.objects.sort((a,b) => a.z - b.z);
        }
    });

    socket.on("DELETE_OBJ", (data) => {
        if(!data) return;
        const chunkKey = getChunkKey(data.cx, data.cy);
        let chunk = testMap.chunks[chunkKey];
        if(chunk != undefined){
            for(let i = chunk.objects.length-1; i >= 0; i--){
                if(data.objName == "ExpOrb"){
                    if(data.z == chunk.objects[i].z && data.id == chunk.objects[i].id){
                        chunk.objects[i].deleteTag = true;
                    }
                }
                else if(data.brainID != undefined){
                    if(data.z == chunk.objects[i].z && data.brainID == chunk.objects[i].brainID){
                        chunk.objects[i].deleteTag = true;
                    }
                }
                else if(data.pos && chunk.objects[i].pos){
                    if(data.pos.x == chunk.objects[i].pos.x && data.pos.y == chunk.objects[i].pos.y && data.z == chunk.objects[i].z && data.objName == chunk.objects[i].objName){
                        chunk.objects[i].deleteTag = true;
                    }
                }
            }
        }
    });

    socket.on("UPDATE_OBJ", (data) =>{
        if(!data) return;
        const chunkKey = getChunkKey(data.cx, data.cy);
        let chunk = testMap.chunks[chunkKey];
        if(chunk != undefined){
            for(let i = chunk.objects.length-1; i >= 0; i--){
                if(data.objName == "ExpOrb"){
                    if(data.z == chunk.objects[i].z && data.id == chunk.objects[i].id){
                        chunk.objects[i][data.update_name] = data.update_value;
                        if(data.pos && chunk.objects[i].pos){
                            chunk.objects[i].pos.x = data.pos.x;
                            chunk.objects[i].pos.y = data.pos.y;
                        }
                    }
                }
                else if(data.brainID != undefined){
                    if(data.z == chunk.objects[i].z && data.brainID == chunk.objects[i].brainID){
                        chunk.objects[i][data.update_name] = data.update_value;
                        if(data.pos && chunk.objects[i].pos){
                            chunk.objects[i].pos.x = data.pos.x;
                            chunk.objects[i].pos.y = data.pos.y;
                        }
                    }
                }
                else if(data.pos && chunk.objects[i].pos){
                    if(data.pos.x == chunk.objects[i].pos.x && data.pos.y == chunk.objects[i].pos.y && data.z == chunk.objects[i].z && data.objName == chunk.objects[i].objName){
                        chunk.objects[i][data.update_name] = data.update_value;
                    }
                }
            }
        }
    })

    socket.on("UPDATE_INV", (data) =>{
        const chunkKey = getChunkKey(data.cx, data.cy);
        let chunk = testMap.chunks[chunkKey];
        if(chunk != undefined){
            for(let i = chunk.objects.length-1; i >= 0; i--){
                if(data.pos && chunk.objects[i].pos && data.pos.x == chunk.objects[i].pos.x && data.pos.y == chunk.objects[i].pos.y && data.z == chunk.objects[i].z && data.objName == chunk.objects[i].objName){
                    chunk.objects[i].invBlock.items = data.items;
                    if(curPlayer != undefined){
                        if(curPlayer.otherInv != undefined){
                            if(curPlayer.otherInv.invBlock.invId == chunk.objects[i].invBlock.invId) updateSwapItemLists(chunk.objects[i].invBlock);
                        }
                    }
                }
            }
        }
    })

    socket.on("NEW_PROJECTILE", (data) =>{
        let proj = createProjectile(data.name, data.ownerName, data.color, data.pos.x, data.pos.y, data.flightPath.a);
        proj.id = data.id;
        const chunkKey = getChunkKey(data.cPos.x, data.cPos.y);
        if(testMap.chunks[chunkKey] != undefined){
            testMap.chunks[chunkKey].projectiles.push(proj);
        }
    });

    socket.on("DELETE_PROJ", (data) =>{
        const chunkKey = getChunkKey(data.cPos.x, data.cPos.y);
        let chunk = testMap.chunks[chunkKey];
        if(chunk != undefined){
            for(let i=chunk.projectiles.length-1; i>=0; i--){
                if(
                    data.id == chunk.projectiles[i].id &&
                    data.lifeSpan == chunk.projectiles[i].lifeSpan &&
                    data.name == chunk.projectiles[i].name &&
                    data.ownerName == chunk.projectiles[i].ownerName
                ){
                    chunk.projectiles[i].deleteTag = true;
                }
            }
        }
    });

    socket.on("NEW_SOUND", (data) =>{
        let sound = new SoundObj(data.sound, data.pos.x, data.pos.y);
        sound.id = data.id;
        const chunkKey = getChunkKey(data.cPos.x, data.cPos.y);
        if(testMap.chunks[chunkKey] != undefined){
            testMap.chunks[chunkKey].soundObjs.push(sound);
        }
    });

    socket.on("GIVE_CHUNK", (data) => {
        const chunkKey = getChunkKey(data.x, data.y);
        testMap.chunks[chunkKey] = new Chunk(data.x, data.y);
        const chunk = testMap.chunks[chunkKey];
        let keys = Object.keys(data.data);
        for(let i=0; i<keys.length; i++) chunk.data[keys[i]] = data.data[keys[i]];
        keys = Object.keys(data.iron_data);
        for(let i=0; i<keys.length; i++) chunk.iron_data[keys[i]] = data.iron_data[keys[i]];
        testMap.chunkBools[chunkKey] = true;
        for(let i=0; i<data.objects.length; i++){
            let temp = createObject(
                data.objects[i].objName, 
                data.objects[i].pos.x, 
                data.objects[i].pos.y, 
                data.objects[i].rot, 
                data.objects[i].color, 
                data.objects[i].id, 
                data.objects[i].ownerName, 
                data.objects[i].brainID,
                data.objects[i].level,
                data.objects[i].xp
            );
            
            //fix some obj properties
            if(temp.type == "InvObj"){
                if(data.objects[i].invBlock != undefined){
                    temp.invBlock.invId = data.objects[i].invBlock.invId;
                    if(data.objects[i].invBlock.items != undefined){
                        let keys = Object.keys(data.objects[i].invBlock.items);
                        for(let j=0; j<keys.length; j++){
                            temp.invBlock.addItem(keys[j], data.objects[i].invBlock.items[keys[j]].amount, false);
                            //TODO: fix durability
                        }
                    }
                }
            }
            if(temp.type == "Plant"){
                if(data.objects[i].stage == undefined) data.objects[i].stage = 0;
                else temp.stage = data.objects[i].stage;
            }
            if(temp.objName == "Door"){
                temp.alpha = data.objects[i].alpha;
            }
            if(temp.objName == "ExpOrb"){
                temp.id = data.objects[i].id;
            }
            if(temp.objName == "Dirt Bin"){
                temp.mhp = data.objects[i].mhp;
            }
            if(temp.objName == "Sign"){
                temp.txt = data.objects[i].txt;
            }
            temp.hp = data.objects[i].hp;
            
            chunk.objects.push(temp);
            chunk.objects.sort((a,b) => a.pos.y - b.pos.y);
            chunk.objects.sort((a,b) => a.z - b.z);
        }
        if(data.projectiles){
            for(let i=0; i<data.projectiles.length; i++){
                let temp = createProjectile(data.projectiles[i].name, data.projectiles[i].ownerName, data.projectiles[i].color, data.projectiles[i].pos.x, data.projectiles[i].pos.y, data.projectiles[i].flightPath.a);
                temp.id = data.projectiles[i].id;
                chunk.projectiles.push(temp);
            }
        }
        
        for(let i=0; i<testMap.brains.length; i++){
            if(testMap.brains[i].obj == null){
                if(
                    testMap.brains[i].target.x > data.x * CHUNKSIZE * TILESIZE &&
                    testMap.brains[i].target.x < (data.x+1) * CHUNKSIZE * TILESIZE &&
                    testMap.brains[i].target.y > data.y * CHUNKSIZE * TILESIZE &&
                    testMap.brains[i].target.y < (data.y+1) * CHUNKSIZE * TILESIZE
                ){
                    let temp = createObject("Ant", testMap.brains[i].target.x, testMap.brains[i].target.y, 0, 0, "", "Server", testMap.brains[i].id);
                    chunk.objects.push(temp);
                    chunk.objects.sort((a,b) => a.pos.y - b.pos.y);
                    chunk.objects.sort((a,b) => a.z - b.z);
                }
            }
        }
    });

    socket.on("GIVE_PORTALS", (data) => {
        knownPortals = data.portals;
    });

    // Listen for a broadcasted new chat message from the server
    socket.on("NEW_CHAT_MESSAGE", (data) => {
        //console.log("message data ",data)
        addChatMessage(data);
    });

    socket.on("sync_time", (data) => {
        setTimeUI(data)
    });

    // Receive full server summary including teams on connection or update
    socket.on('SERVER_SUMMARY', (data) => {
        if (data && data.teams) {
            if (typeof window.allTeams === 'undefined') window.allTeams = {};
            window.allTeams = data.teams;
        }
    });

    socket.on("HEAL_PLANTS", (data) => {
        //console.log("Healing plants");
        let keys = Object.keys(testMap.chunks);
        // Loop through each chunk
        for(let i=0; i<keys.length;i++){
            let chunk = testMap.chunks[keys[i]];
            // Loop through each tile in the chunk
            for(let j=0; j<chunk.objects.length;j++){
                if(chunk.objects[j].type=="Plant" || chunk.objects[j].objName=="Tree" || chunk.objects[j].objName=="AppleTree"){
                    if(chunk.objects[j].hp < chunk.objects[j].mhp){
                        chunk.objects[j].hp += 5; // Heal the plant by 0.1 HP
                        if(chunk.objects[j].hp > chunk.objects[j].mhp){
                            chunk.objects[j].hp = chunk.objects[j].mhp; // Cap the HP at max HP
                        }
                    }
                }
            }
        }
    });

    socket.on("ENTITY_LEVEL_UPDATE", (data) => {
        // Update entity level and stats
        let chunk = testMap.chunks[data.cx + "," + data.cy];
        if (chunk) {
            for (let j = 0; j < chunk.objects.length; j++) {
                let obj = chunk.objects[j];
                if (obj.pos.x === data.objPos.x && obj.pos.y === data.objPos.y) {
                    if (obj.statBlock) {
                        obj.statBlock.level = data.level;
                        obj.statBlock.xp = data.xp;
                        obj.hp = data.hp;
                        obj.mhp = data.mhp;
                    }
                    break;
                }
            }
        }
    });

    socket.on("WANDER_TARGET", (data) => {
        for(let i=0; i<testMap.brains.length; i++){
            if(data.id == testMap.brains[i].id){
                testMap.brains[i].target = createVector(data.target.x, data.target.y);
            }
        }
    })

    // Handle new brain entities (e.g., from Queen's Kiss ability)
    socket.on("NEW_BRAIN", (data) => {
        if (!data || !data.id || !data.target) {
            console.error('[NEW_BRAIN] Invalid brain data:', data);
            return;
        }
        
        // Create a proper Brain class instance with methods
        const brain = new Brain(200, data.personality || 'swarm');
        brain.id = data.id;
        brain.target = createVector(data.target.x, data.target.y);
        brain.teamId = data.teamId || null;
        brain.ownerName = data.ownerName || null;
        
        testMap.brains.push(brain);
        console.log(`[NEW_BRAIN] Added brain ${brain.id} at (${brain.target.x}, ${brain.target.y})`);
        
        // Try to spawn the entity immediately if we have the chunk loaded
        const chunkPos = testMap.globalToChunk(brain.target.x, brain.target.y);
        const chunkKey = getChunkKey(chunkPos.x, chunkPos.y);
        const chunk = testMap.chunks[chunkKey];
        
        if (chunk) {
            const entity = createObject("Ant", brain.target.x, brain.target.y, 0, data.color || 0, "", data.ownerName || "Server", brain.id);
            // Set team on the entity
            if (data.teamId) {
                entity.teamId = data.teamId;
            }
            chunk.objects.push(entity);
            chunk.objects.sort((a,b) => a.pos.y - b.pos.y);
            chunk.objects.sort((a,b) => a.z - b.z);
            console.log(`[NEW_BRAIN] Spawned entity for brain ${brain.id}`);
        }
    });

    socket.on("server_ended", () => {

        testMap.chunks = {};
        testMap.chunkBools = {};
        
        gameState = "player_status"
        togglePlayerStatusTable()

        // After 20 seconds, reload once
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    });

    // Team system handlers
    socket.on('TEAMS_UPDATE', (data) => {
        if (typeof window.allTeams === 'undefined') window.allTeams = {};
        window.allTeams = data.teams;
        // Update current player's color if they're in a team and color has changed
        if (curPlayer && curPlayer.teamId && data.teams[curPlayer.teamId]) {
            const teamColor = data.teams[curPlayer.teamId].color;
            if (teamColor) {
                curPlayer.color = teamColor;
            }
        }
        if (typeof updateTeamManagementUI === 'function') {
            updateTeamManagementUI();
        }
    });

    socket.on('TEAM_CREATED', (data) => {
        if (typeof window.allTeams === 'undefined') window.allTeams = {};
        window.allTeams[data.teamId] = data.team;
    });

    socket.on('TEAM_JOINED', (data) => {
        if (curPlayer) {
            curPlayer.teamId = data.teamId;
            curPlayer.teamData = data.team;
            // Set player color to team color
            curPlayer.color = data.team.color;
        }
        alert(`Joined team: ${data.team.name}`);
        if (typeof updateTeamManagementUI === 'function') {
            updateTeamManagementUI();
        }
    });

    socket.on('TEAM_LEFT', (data) => {
        if (curPlayer) {
            curPlayer.teamId = null;
            curPlayer.teamData = null;
            curPlayer.color = 0;
        }
        if (typeof updateTeamManagementUI === 'function') {
            updateTeamManagementUI();
        }
    });

    socket.on('TEAM_DISBANDED', (data) => {
        if (curPlayer) {
            curPlayer.teamId = null;
            curPlayer.teamData = null;
            curPlayer.color = 0;
        }
        alert('Your team has been disbanded');
        if (typeof updateTeamManagementUI === 'function') {
            updateTeamManagementUI();
        }
    });

    socket.on('TEAM_REQUEST', (data) => {
        // Update the team requests list in window.allTeams
        if (window.allTeams && window.allTeams[data.teamId]) {
            if (!window.allTeams[data.teamId].requests) {
                window.allTeams[data.teamId].requests = [];
            }
            if (!window.allTeams[data.teamId].requests.includes(data.playerName)) {
                window.allTeams[data.teamId].requests.push(data.playerName);
            }
        }
        if (typeof updateTeamManagementUI === 'function') {
            updateTeamManagementUI();
        }
    });

    socket.on('TEAM_REQUEST_SENT', (data) => {
        alert('Team join request sent!');
    });

    socket.on('TEAM_REQUEST_DENIED', (data) => {
        alert('Your team join request was denied');
    });

    socket.on('TEAM_ERROR', (data) => {
        alert(data.message);
    });

    socket.on('TEAM_MEMBER_REMOVED', (data) => {
        if (curPlayer) {
            curPlayer.teamId = null;
            curPlayer.color = 0;
        }
        alert('You have been removed from your team');
        if (typeof updateTeamManagementUI === 'function') {
            updateTeamManagementUI();
        }
    });

    socket.on('PLAYER_COLOR_CHANGED', (data) => {
        // Update another player's color when they join/leave a team
        if (players[data.playerId]) {
            players[data.playerId].color = data.color;
        }
    });

    socket.on('TEAM_INVITE', (data) => {
        // Show invite dialog
        showTeamInvitePrompt(data.teamName, data.inviterName, data.teamId);
    });

    socket.on('TEAM_INVITE_SENT', (data) => {
        alert(`Invitation sent to ${data.playerName}`);
    });

    socket.on('TEAM_INVITE_DECLINED', (data) => {
        alert('The player declined your invitation');
    });
}