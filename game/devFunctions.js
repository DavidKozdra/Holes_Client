function getPlayerChunk(){
    let temp = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
    return temp.key || getChunkKey(temp.x, temp.y);
}

function cleanChunk(cx,cy){  //removes all dirt in a chunk
    const chunkKey = getChunkKey(cx, cy);
    let chunk = testMap.chunks[chunkKey];
    for (let x = 0; x < CHUNKSIZE; x++){
        for (let y = 0; y < CHUNKSIZE; y++){
            let index = x + y * CHUNKSIZE;
            chunk.data[index] = 0; 
            //socket.emit("update_node", {chunkPos: chunkKey, index: index, val: 0});
        }
    }
}

function createTestChunk(cx, cy){ //makes the dirt in a specific way to test the rendering
    let testChunk = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,9,9,0,0,8,8,8,0,0,7,7,7,0,0,6,6,6,0,0,5,5,5,0,0,4,4,4,0,0,3,3,3,0,0,2,2,2,0,0,1,1,1,0,0,0,0],
        [0,0,0,9,9,9,0,0,8,8,8,0,0,7,7,7,0,0,6,6,6,0,0,5,5,5,0,0,4,4,4,0,0,3,3,3,0,0,2,2,2,0,0,1,1,1,0,0,0,0],
        [0,0,0,9,9,9,0,0,8,8,8,0,0,7,7,7,0,0,6,6,6,0,0,5,5,5,0,0,4,4,4,0,0,3,3,3,0,0,2,2,2,0,0,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,9,9,0,0,8,8,8,0,0,7,7,7,0,0,6,6,6,0,0,5,5,5,0,0,4,4,4,0,0,3,3,3,0,0,2,2,2,0,0,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,0,0,0,0,8,0,0,0,0,7,0,0,0,0,6,0,0,0,0,5,0,0,0,0,4,0,0,0,0,3,0,0,0,0,2,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,9,0,0,0,8,8,0,0,0,7,7,0,0,0,6,6,0,0,0,5,5,0,0,0,4,4,0,0,0,3,3,0,0,0,2,2,0,0,0,1,1,0,0,0,0,0],
        [0,0,0,9,0,0,0,0,8,0,0,0,0,7,0,0,0,0,6,0,0,0,0,5,0,0,0,0,4,0,0,0,0,3,0,0,0,0,2,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,9,0,0,0,0,8,0,0,0,0,7,0,0,0,0,6,0,0,0,0,5,0,0,0,0,4,0,0,0,0,3,0,0,0,0,2,0,0,0,0,1,0,0,0,0],
        [0,0,0,0,9,9,0,0,0,8,8,0,0,0,7,7,0,0,0,6,6,0,0,0,5,5,0,0,0,4,4,0,0,0,3,3,0,0,0,2,2,0,0,0,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ]
    const chunkKey = getChunkKey(cx, cy);
    let chunk = testMap.chunks[chunkKey];
    for (let x = 0; x < CHUNKSIZE; x++){
        for (let y = 0; y < CHUNKSIZE; y++){
            let index = x + y * CHUNKSIZE;
            chunk.data[index] = testChunk[y][x]/9; 
            socket.emit("update_node", {chunkPos: chunkKey, index: index, val: testChunk[y][x]/9});
        }
    }
}

function teleportToChunk(cx,cy){ //teleports you to the top left corner of a chunk
    curPlayer.pos.x = cx*CHUNKSIZE*TILESIZE;
    curPlayer.pos.y = cy*CHUNKSIZE*TILESIZE;
    socket.emit("update_pos", {
        id: curPlayer.id,
        pos: curPlayer.pos,
        holding: curPlayer.holding
    });
    return true;
}

function teleportToPlayer(name){ //teleports you to another player
    let keys = Object.keys(players);
    for(let i = 0; i < keys.length; i++){
        if(players[keys[i]].name === name){
            curPlayer.pos = players[keys[i]].pos.copy();
            socket.emit("update_pos", {
                id: curPlayer.id,
                pos: curPlayer.pos,
                holding: curPlayer.holding
            });
            return true;
        }
    }
    console.log(name + " not found");
    return false;
}

function giveAllItems() {
    // Add 100 of every item in the item dictionary
    for (let name in itemDic) {
        if (itemDic.hasOwnProperty(name)) {
            curPlayer.invBlock.addItem(name, 100, false);
        }
    }
}

// Level the player up until reaching a target level by feeding the exact XP needed each step
function levelUpTo(targetLevel) {
    if (!curPlayer || !curPlayer.statBlock) return false;

    const goal = Math.max(1, Math.floor(targetLevel || 0));
    if (!Number.isFinite(goal) || curPlayer.statBlock.level >= goal) return false;

    let safety = 0;
    while (curPlayer.statBlock.level < goal && safety < 200) {
        const xpNeeded = Math.max(0, curPlayer.statBlock.xpNeeded - curPlayer.statBlock.xp);
        if (xpNeeded <= 0) break; // guard against malformed XP state
        curPlayer.statBlock.setXP(xpNeeded);
        safety++;
    }

    return curPlayer.statBlock.level >= goal;
}


function giveDefaultItems(){
    curPlayer.invBlock.addItem("Basic Shovel", 1, false);
    curPlayer.invBlock.addItem("Basic Sword", 1, false);
    curPlayer.invBlock.addItem("Basic SlingShot", 1, false);
    curPlayer.invBlock.addItem("Mushroom Seed", 5, false);
    curPlayer.invBlock.addItem("Rock", 20, false);
    curPlayer.invBlock.addItem("Log", 5, false);
    curPlayer.invBlock.addItem("Apple", 5, false);
    curPlayer.invBlock.addItem("Bomb", 5, false);

    curPlayer.invBlock.hotbarItem("Basic Shovel", 0);
    curPlayer.invBlock.hotbarItem("Basic Sword", 1);
    curPlayer.invBlock.hotbarItem("Basic SlingShot", 2);
    curPlayer.invBlock.hotbarItem("Apple", 3);
    curPlayer.invBlock.hotbarItem("Bomb", 4);
}

function spawnObj(name, x, y, rot = 0, color = 0, id = "", ownerName = ""){
    let chunkPos = testMap.globalToChunk(x,y);
    const chunkKey = chunkPos.key || getChunkKey(chunkPos.x, chunkPos.y);
    const chunk = testMap.chunks[chunkKey];
    let temp = createObject(name, x, y, rot, color, id, ownerName);
    chunk.objects.push(temp);
    chunk.objects.sort((a,b) => a.z - b.z);
    socket.emit("new_object", {
        cx: chunkPos.x, 
        cy: chunkPos.y, 
        obj: temp
    });
}

// Test function to spawn all race entities at origin
function spawnRaceEntities() {
    console.log("Spawning race entities at origin...");
    
    // Spawn Hostile Gnome at 0,0
    let gnomeEntity = createObject("Hostile Gnome", 0, 0, 0, 0, "", "", -1, 1, 0);
    let gnomeChunk = testMap.globalToChunk(0, 0);
    testMap.chunks[gnomeChunk.x + "," + gnomeChunk.y].objects.push(gnomeEntity);
    testMap.chunks[gnomeChunk.x + "," + gnomeChunk.y].objects.sort((a,b) => a.z - b.z);
    socket.emit("new_object", { cx: gnomeChunk.x, cy: gnomeChunk.y, obj: gnomeEntity });
    
    // Spawn Wild Aylah at 100,0
    let aylahEntity = createObject("Wild Aylah", 100, 0, 0, 0, "", "", -1, 1, 0);
    let aylahChunk = testMap.globalToChunk(100, 0);
    testMap.chunks[aylahChunk.x + "," + aylahChunk.y].objects.push(aylahEntity);
    testMap.chunks[aylahChunk.x + "," + aylahChunk.y].objects.sort((a,b) => a.z - b.z);
    socket.emit("new_object", { cx: aylahChunk.x, cy: aylahChunk.y, obj: aylahEntity });
    
    // Spawn Feral Skizzard at 200,0
    let skizzardEntity = createObject("Feral Skizzard", 200, 0, 0, 0, "", "", -1, 1, 0);
    let skizzardChunk = testMap.globalToChunk(200, 0);
    testMap.chunks[skizzardChunk.x + "," + skizzardChunk.y].objects.push(skizzardEntity);
    testMap.chunks[skizzardChunk.x + "," + skizzardChunk.y].objects.sort((a,b) => a.z - b.z);
    socket.emit("new_object", { cx: skizzardChunk.x, cy: skizzardChunk.y, obj: skizzardEntity });
    
    console.log("Race entities spawned! Use teleportToChunk(0,0) to see them.");
}

// Helper function to go see the race entities
function goToRaceEntities() {
    console.log("Teleporting to race entities near spawn...");
    curPlayer.pos.x = 200;
    curPlayer.pos.y = 200;
    camera.pos.x = 200;
    camera.pos.y = 200;
    socket.emit("update_pos", {
        id: curPlayer.id,
        pos: curPlayer.pos,
        holding: curPlayer.holding
    });
    console.log("✅ At spawn area! Look around for Hostile Gnome, Wild Aylah, Feral Skizzard, and Ant.");
}