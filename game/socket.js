var socket; //Connection to the server
var curID = null; //The ID of the current player

function socketSetup(){
    //all caps means it came from the server
    //all lower means it came from the client

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
            players[data.id].statBlock.stats = data.statBlock.stats;
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
                players[keys[i]].statBlock.stats = data.players[keys[i]].statBlock.stats;
            }
        }
    });

    socket.on('YOUR_ID', (data) => {
        if(curID != null){
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

    // Apply saved snapshot (inventory/statBlock/pos) when provided by server
    socket.on('PLAYER_SNAPSHOT', (data) => {
        if (!curPlayer) return;
        try {
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
                    if (sb.stats && typeof sb.stats === 'object') curPlayer.statBlock.stats = sb.stats;
                } else {
                    // If somehow missing methods, rehydrate a new instance
                    const health = (sb.stats && typeof sb.stats.hp === 'number') ? sb.stats.hp : undefined;
                    const raceIndex = (typeof sb.race === 'number') ? sb.race : (typeof curPlayer.race === 'number' ? curPlayer.race : 0);
                    curPlayer.statBlock = new StatBlock(raceIndex, health);
                    if (typeof sb.level === 'number') curPlayer.statBlock.level = sb.level;
                    if (typeof sb.xp === 'number') curPlayer.statBlock.xp = sb.xp;
                    if (typeof sb.xpNeeded === 'number') curPlayer.statBlock.xpNeeded = sb.xpNeeded;
                    if (sb.stats && typeof sb.stats === 'object') curPlayer.statBlock.stats = sb.stats;
                }
            }
            if (data.invBlock) {
                const inv = data.invBlock;
                // Hydrate plain item records into item instances
                const itemsIn = inv.items || {};
                curPlayer.invBlock.items = {};
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
                    curPlayer.invBlock.equiped = curPlayer.invBlock.equiped || { head: "", neck: "", chest: "", legs: "", feet: "" };
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
        } catch (e) {
            console.warn('Failed to apply PLAYER_SNAPSHOT', e);
        }
    });

    socket.on("change_name", (data) => {
        curPlayer.name = data
    });

    socket.on('REMOVE_PLAYER', (data) => {
        console.log("Removing player: " + data);
        players[data] = {};
        delete players[data];
        updatePlayerCount();
    });

    socket.on('PLAYERS_CHECK', (data) => {
        if(data.ids.length != Object.keys(players).length+1){
            let keys = Object.keys(players);
            for(let i= 0; i < keys.length; i++){
                if(!data.ids.includes(keys[i])){
                    console.log("Removing player: " + keys[i]);
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
                if(data.update_names[i].includes("stats")){
                    players[data.id].statBlock.stats[data.update_names[i].split("stats.")[1]] = data.update_values[i];
                }
                else if(data.update_names[i].includes("statBlock")){
                    players[data.id].statBlock[data.update_names[i].split("statBlock.")[1]] = data.update_values[i];
                }
                else{
                    players[data.id][data.update_names[i]] = data.update_values[i];
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
        let chunk = testMap.chunks[data.cx+","+data.cy];
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
        //console.log(data);
        let chunk = testMap.chunks[data.cx+","+data.cy];
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
                else{
                    if(data.pos.x == chunk.objects[i].pos.x && data.pos.y == chunk.objects[i].pos.y && data.z == chunk.objects[i].z && data.objName == chunk.objects[i].objName){
                        chunk.objects[i].deleteTag = true;
                    }
                }
            }
        }
    });

    socket.on("UPDATE_OBJ", (data) =>{
        let chunk = testMap.chunks[data.cx+","+data.cy];
        if(chunk != undefined){
            for(let i = chunk.objects.length-1; i >= 0; i--){
                if(data.objName == "ExpOrb"){
                    if(data.z == chunk.objects[i].z && data.id == chunk.objects[i].id){
                        chunk.objects[i][data.update_name] = data.update_value;
                        chunk.objects[i].pos.x = data.pos.x;
                        chunk.objects[i].pos.y = data.pos.y;
                    }
                }
                else if(data.brainID != undefined){
                    if(data.z == chunk.objects[i].z && data.brainID == chunk.objects[i].brainID){
                        chunk.objects[i][data.update_name] = data.update_value;
                        chunk.objects[i].pos.x = data.pos.x;
                        chunk.objects[i].pos.y = data.pos.y;
                    }
                }
                else{
                    if(data.pos.x == chunk.objects[i].pos.x && data.pos.y == chunk.objects[i].pos.y && data.z == chunk.objects[i].z && data.objName == chunk.objects[i].objName){
                        chunk.objects[i][data.update_name] = data.update_value;
                    }
                }
            }
        }
    })

    socket.on("UPDATE_INV", (data) =>{
        let chunk = testMap.chunks[data.cx+","+data.cy];
        if(chunk != undefined){
            for(let i = chunk.objects.length-1; i >= 0; i--){
                if(data.pos.x == chunk.objects[i].pos.x && data.pos.y == chunk.objects[i].pos.y && data.z == chunk.objects[i].z && data.objName == chunk.objects[i].objName){
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
        if(testMap.chunks[data.cPos.x+','+data.cPos.y] != undefined){
            testMap.chunks[data.cPos.x+','+data.cPos.y].projectiles.push(proj);
        }
    });

    socket.on("DELETE_PROJ", (data) =>{
        let chunk = testMap.chunks[data.cPos.x+','+data.cPos.y];
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
        if(testMap.chunks[data.cPos.x+','+data.cPos.y] != undefined){
            testMap.chunks[data.cPos.x+','+data.cPos.y].soundObjs.push(sound);
        }
    });

    socket.on("GIVE_CHUNK", (data) => {
        testMap.chunks[data.x+","+data.y] = new Chunk(data.x, data.y);
        let keys = Object.keys(data.data);
        for(let i=0; i<keys.length; i++) testMap.chunks[data.x+","+data.y].data[keys[i]] = data.data[keys[i]];
        keys = Object.keys(data.iron_data);
        for(let i=0; i<keys.length; i++) testMap.chunks[data.x+","+data.y].iron_data[keys[i]] = data.iron_data[keys[i]];
        testMap.chunkBools[data.x+","+data.y] = true;
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

            testMap.chunks[data.x+","+data.y].objects.push(temp);
            testMap.chunks[data.x+","+data.y].objects.sort((a,b) => a.pos.y - b.pos.y);
            testMap.chunks[data.x+","+data.y].objects.sort((a,b) => a.z - b.z);
        }
        if(data.projectiles){
            for(let i=0; i<data.projectiles.length; i++){
                let temp = createProjectile(data.projectiles[i].name, data.projectiles[i].ownerName, data.projectiles[i].color, data.projectiles[i].pos.x, data.projectiles[i].pos.y, data.projectiles[i].flightPath.a);
                temp.id = data.projectiles[i].id;
                testMap.chunks[data.x+","+data.y].projectiles.push(temp);
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
                    testMap.chunks[data.x+","+data.y].objects.push(temp);
                    testMap.chunks[data.x+","+data.y].objects.sort((a,b) => a.pos.y - b.pos.y);
                    testMap.chunks[data.x+","+data.y].objects.sort((a,b) => a.z - b.z);
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
        if (typeof addTeamRequest === 'function') {
            addTeamRequest(data);
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
}