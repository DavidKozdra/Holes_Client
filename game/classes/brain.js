const PERSONALITY_BEHAVIORS = {
    aggressive: { visionMultiplier: 1.2, attackPlayers: true, attackEntities: true, taunts: ["Charge!", "For the clan!", "You're mine!"], cooldownMs: 6000 },
    territorial: { visionMultiplier: 1.0, attackPlayers: false, attackEntities: true, taunts: ["Leave now!", "Trespasser!"], cooldownMs: 8000 },
    cautious: { visionMultiplier: 0.9, attackPlayers: true, attackEntities: true, taunts: ["Keeping distance...", "I'll strike first."], cooldownMs: 9000 },
    swarm: { visionMultiplier: 1.1, attackPlayers: true, attackEntities: true, taunts: ["Swarm!", "Bite bite bite!"], cooldownMs: 7000 },
    default: { visionMultiplier: 1.0, attackPlayers: true, attackEntities: true, taunts: ["Spotted you."], cooldownMs: 8000 }
};

class Brain {
    constructor(vision, personality){
        this.state = "Wander";
        this.target = null; //pos to chase
        this.targetEntity = null;
        this.stateTimer = 0;
        this.obj = null; //obj to move and stuff
        this.id = random(10000);
        this.personality = personality || "default";
        const behavior = PERSONALITY_BEHAVIORS[this.personality] || PERSONALITY_BEHAVIORS.default;
        this.vision = (vision || 200) * behavior.visionMultiplier;
        this.deleteTag = false;
        this.lastChat = 0;
        this.ownerName = null; // Track the owner who summoned this entity
        this.teamId = null; // Track team affiliation
        this._lastMoveEmit = 0; // Throttle movement updates to ~10/sec
    }

    update(){
        if(this.obj != null){
            if(this.obj.deleteTag) return;

            this.stateTimer ++;
            if(this.state == "Wander"){
                this.wander();
                if (this.findTarget()){
                    this.stateTimer = 0;
                    this.state = "Chasing";
                }
            }
            if(this.state == "Chasing"){
                this.chase();
                if (!this.canSee(this.targetEntity.pos.x, this.targetEntity.pos.y)){
                    this.stateTimer = 0;
                    this.state = "Wander";
                    this.target = null;
                    this.targetEntity = null;
                }
            }
            if(this.state == "Space"){
                this.space();
            }
        }

    }

    wander(){
        // Improved wander: pick a random nearby point locally, only rarely request from server
        if (this.target == null || this.obj.pos.dist(this.target) < 6) {
            // 10% chance to request a new wander target from server for variety
            if (Math.random() < 0.1) {
                socket.emit("wander_request", {id: this.id, pos: {x: this.obj.pos.x, y: this.obj.pos.y}});
            } else {
                // Pick a random point within 80-160px in a random direction
                let angle = Math.random() * Math.PI * 2;
                let dist = 80 + Math.random() * 80;
                let tx = this.obj.pos.x + Math.cos(angle) * dist;
                let ty = this.obj.pos.y + Math.sin(angle) * dist;
                // Clamp to map bounds if needed (assume testMap has width/height or use chunk bounds)
                if (typeof testMap !== 'undefined' && testMap.width && testMap.height) {
                    tx = Math.max(0, Math.min(testMap.width * CHUNKSIZE * TILESIZE, tx));
                    ty = Math.max(0, Math.min(testMap.height * CHUNKSIZE * TILESIZE, ty));
                }
                this.target = createVector(tx, ty);
            }
            return;
        }
        this.moveObjTowards(this.target.x, this.target.y, 2);
    }



    chase(){
        //Move towards target
        let projType = projDic[this.obj.projName];
        let isRanged = projType && projType.type === "SimpleProj";
        let attackRange = isRanged ? projType.r * 6 : projType.sr; // Ranged entities attack from 6x projectile radius

        if(!this.targetEntity || this.targetEntity.hp <= 0){
            this.stateTimer = 0;
            this.state = "Wander";
            this.target = null;
            this.targetEntity = null;
            return;
        }

        if(this.obj.pos.dist(this.target) > attackRange){
            this.moveObjTowards(this.target.x,this.target.y, isRanged ? 4 : 6); // Ranged moves slower
        }
        else{ //if close enough spawn projectile and switch to space
            let chunkPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
            let toTarget = createVector(this.target.x,this.target.y).sub(this.obj.pos);

            // Use unique id or fallback to objName for owner
            let ownerId = this.obj.id || this.obj.objName;

            if(isRanged) {
                // Ranged projectile - fire straight at target
                let proj = createProjectile(this.obj.projName, ownerId, this.obj.color, this.obj.pos.x, this.obj.pos.y, toTarget.heading(), this.obj);
                if(testMap.chunks[chunkPos.x+','+chunkPos.y] != undefined){
                    testMap.chunks[chunkPos.x+','+chunkPos.y].projectiles.push(proj);
                    socket.emit("new_proj", proj);
                }
            } else {
                // Melee projectile - swing attack
                toTarget.setMag(50);
                let proj = createProjectile(this.obj.projName, ownerId, this.obj.color, this.obj.pos.x, this.obj.pos.y, toTarget.heading(), this.obj);
                if(testMap.chunks[chunkPos.x+','+chunkPos.y] != undefined){
                    testMap.chunks[chunkPos.x+','+chunkPos.y].projectiles.push(proj);
                    socket.emit("new_proj", proj);

                    let temp = new SoundObj("swing.wav", this.obj.pos.x, this.obj.pos.y);
                    testMap.chunks[chunkPos.x+','+chunkPos.y].soundObjs.push(temp);
                    socket.emit("new_sound", {sound: "swing.wav", cPos: chunkPos, pos: {x: this.obj.pos.x, y: this.obj.pos.y}, id: temp.id});
                }
            }

            this.stateTimer = 0;
            this.state = "Space";
        }
    }

    space(){
        // back up away from target until stateTimer == 120
        if(this.stateTimer < 120){
            this.target = this.obj.pos.copy().sub(this.targetEntity.pos).setMag(100).add(this.targetEntity.pos);
            if(this.obj.pos.dist(this.target) > 4){
                this.moveObjTowards(this.target.x, this.target.y, 4);
            }
            //If player gets too close, prolong retreat
            if(this.obj.pos.dist(this.targetEntity.pos) < 60){
                this.stateTimer = 0;
            }
            //If player gets too far, reduce retreat
            if(this.obj.pos.dist(this.targetEntity.pos) > 100){
                this.stateTimer += 5;
            }
        }
        else{
            this.target = this.targetEntity.pos;
            this.stateTimer = 0;
            this.state = "Chasing";
        }
    }

    findTarget(){
        if(this.obj == null) return;
        this.targetEntity = null;
        const behavior = PERSONALITY_BEHAVIORS[this.personality] || PERSONALITY_BEHAVIORS.default;

        // Collect candidates: players and nearby entities
        const candidates = [];

        // Players
        let playerArray = Object.values(players);
        if(curPlayer) playerArray.push(curPlayer);
        for(let i = 0; i < playerArray.length; i++){
            const p = playerArray[i];
            if(!p || !p.pos || p.statBlock?.stats?.hp <= 0) continue;
            candidates.push({ entity: p, isPlayer: true });
        }

        // Nearby entities (same and adjacent chunks)
        const cPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
        for(let dx = -1; dx <= 1; dx++){
            for(let dy = -1; dy <= 1; dy++){
                const key = (cPos.x + dx) + "," + (cPos.y + dy);
                const chunk = testMap.chunks[key];
                if(!chunk) continue;
                for(let j = 0; j < chunk.objects.length; j++){
                    const o = chunk.objects[j];
                    if(!o || o === this.obj || o.deleteTag) continue;
                    if(o.type === "Entity" && o.hp > 0){
                        candidates.push({ entity: o, isPlayer: false });
                    }
                }
            }
        }

        // Sort by distance to prefer closer targets
        candidates.sort((a, b) => {
            return this.obj.pos.dist(a.entity.pos) - this.obj.pos.dist(b.entity.pos);
        });

        for(let i = 0; i < candidates.length; i++){
            const candidate = candidates[i];
            const target = candidate.entity;
            if(!target || !target.pos) continue;

            // Don't attack owner (for summoned entities)
            if(this.ownerName && candidate.isPlayer && target.name === this.ownerName) continue;
            
            // Don't attack same team members
            if(this.teamId && target.teamId === this.teamId) continue;

            // Personality rules
            if(candidate.isPlayer && !behavior.attackPlayers) continue;
            if(!candidate.isPlayer && !behavior.attackEntities) continue;
            if(!candidate.isPlayer && !this.isHostileEntity(target)) continue;

            if(this.canSee(target.pos.x, target.pos.y)){
                this.targetEntity = target;
                this.target = target.pos;
                this.maybeTaunt(target, candidate.isPlayer);
                break;
            }
        }

        return this.targetEntity != null;
    }

    canSee(x,y){
        if(this.obj == null) return false;
        //check if there are any objects imbetween this.obj and x,y
        return createVector(x,y).dist(this.obj.pos) < this.vision;
    }

    isHostileEntity(target){
        if(!target || target === this.obj) return false;
        if(target.type !== "Entity") return false;
        
        // If this entity has a team, check team affiliation
        if(this.teamId) {
            // Target server-spawned entities (no teamId or teamId is null)
            if(!target.teamId) return true;
            
            // Target entities from other teams
            if(target.teamId !== this.teamId) return true;
            
            // Don't target same team entities
            return false;
        }
        
        // Original logic for server-spawned entities: don't attack same type/race
        if(target.objName && this.obj.objName && target.objName === this.obj.objName && target.race === this.obj.race) return false;
        
        return true;
    }

    maybeTaunt(target, isPlayer){
        if(!this.obj) return;
        const behavior = PERSONALITY_BEHAVIORS[this.personality] || PERSONALITY_BEHAVIORS.default;
        const now = Date.now();
        if(now - this.lastChat < (behavior.cooldownMs || 8000)) return;

        const lines = behavior.taunts || PERSONALITY_BEHAVIORS.default.taunts;
        const line = lines[floor(random(lines.length))];
        if(!line) return;

        this.lastChat = now;
        socket.emit("entity_chat", {
            user: this.obj.objName || "Entity",
            message: line,
            pos: { x: this.obj.pos.x, y: this.obj.pos.y },
            speakingRange: isPlayer ? 1.2 : 1
        });
    }

    moveObjTowards(x,y,speed){
        //TODO: collishion
        let oldChunkPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
        const oldChunkKey = oldChunkPos.key || getChunkKey(oldChunkPos.x, oldChunkPos.y);
        const oldChunk = testMap.chunks[oldChunkKey];
        let xTile = floor(this.obj.pos.x / TILESIZE) - (oldChunkPos.x * CHUNKSIZE);
        let yTile = floor(this.obj.pos.y / TILESIZE) - (oldChunkPos.y * CHUNKSIZE);
        if(oldChunk && oldChunk.data[xTile + yTile * CHUNKSIZE] > 0){
            speed = speed/2;
        }
        
        // Calculate movement vector and update rotation
        let moveVec = createVector(x,y).sub(this.obj.pos);
        this.obj.rot = moveVec.heading();
        
        // Update direction for entities with race (for animation)
        if (this.obj.direction !== undefined) {
            let angle = (this.obj.rot * 180 / PI + 360) % 360;
            if (angle >= 315 || angle < 45) {
                this.obj.direction = 'right';
            } else if (angle >= 45 && angle < 135) {
                this.obj.direction = 'down';
            } else if (angle >= 135 && angle < 225) {
                this.obj.direction = 'left';
            } else {
                this.obj.direction = 'up';
            }
        }
        
        this.obj.pos.add(moveVec.setMag(speed*(deltaTime/30)));

        // Throttle movement syncs to ~10/sec per entity to avoid flooding the server
        const _now = Date.now();
        if (_now - this._lastMoveEmit >= 100) {
            this._lastMoveEmit = _now;
            socket.emit("update_obj", {
                cx: oldChunkPos.x, cy: oldChunkPos.y,
                objName: this.obj.objName,
                pos: {x: this.obj.pos.x, y: this.obj.pos.y},
                z: this.obj.z,
                id: this.obj.id,
                brainID: this.id,
                update_name: "hp",
                update_value: this.obj.hp
            });
        }

        let newChunkPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
        if(oldChunkPos.x != newChunkPos.x || oldChunkPos.y != newChunkPos.y){
            let oldHp = this.obj.hp+0;
            this.obj.deleteTag = true;
            //console.log("trying to delete obj from brainID: ", this.id);
            socket.emit("delete_obj", {
                cx: oldChunkPos.x, 
                cy: oldChunkPos.y, 
                objName: this.obj.objName, 
                pos: {x: this.obj.pos.x, y: this.obj.pos.y}, 
                z: this.obj.z,
                brainID: this.id
            });

            // Preserve entity type/race when moving across chunks to avoid morphing into Ant
            let temp = createObject(
                this.obj.objName,
                this.obj.pos.x,
                this.obj.pos.y,
                this.obj.rot,
                this.obj.color,
                this.obj.id,
                this.obj.ownerName,
                this.id,
                this.obj.statBlock?.level,
                this.obj.statBlock?.xp
            );
            temp.hp = oldHp;

            const newChunkKey = newChunkPos.key || getChunkKey(newChunkPos.x, newChunkPos.y);
            let newChunk = testMap.chunks[newChunkKey];
            if(newChunk != undefined){
                newChunk.objects.push(temp);
                socket.emit("new_object", {
                    cx: newChunkPos.x, 
                    cy: newChunkPos.y, 
                    obj: temp
                })
                this.obj = temp;
            }
            else{
                this.obj = null;
            }
        }
    }

    giveBody(obj){
        this.obj = obj;
        this.obj.brainID = this.id;
    }

    debugRender(){
        if(this.target == null) return;
        push();
        fill(255,0,0,100);
        noStroke();
        circle(this.target.x-camera.pos.x + width / 2, this.target.y-camera.pos.y + height / 2, 6);
        pop();
    }
}

function scareBrain(brainID, proj){
    if(brainID == undefined) return;
    let scarer;

    for(let i=0; i<testMap.brains.length; i++){
        if(brainID == testMap.brains[i].id){
            if(proj.flightPath != undefined){
                //check if turret is at proj.flightPath.origin
                let chunkPos = testMap.globalToChunk(proj.flightPath.origin.x, proj.flightPath.origin.y);
                    const chunkKey = chunkPos.key || getChunkKey(chunkPos.x, chunkPos.y);
                    let chunk = testMap.chunks[chunkKey];
                if(chunk != undefined){
                    for(let j=0; j<chunk.objects.length; j++){
                        if(chunk.objects[j].objName == "Turret"){

                            if(chunk.objects[j].pos.dist(proj.flightPath.origin) < 70){
                                scarer = chunk.objects[j];
                                j = chunk.objects.length;
                            }
                        }
                    }
                }

                //check if proj.ownerName is curPlayer.name
                if(proj.ownerName == curPlayer.name){
                    scarer = curPlayer;
                }
                //check if proj.ownerName belongs to another player
                let keys = Object.keys(players);
                for(let j=0; j<keys.length; j++){
                    if(proj.ownerName == players[keys[j]].name){
                        scarer = players[keys[j]];
                        j = keys.length;
                    }
                }

            }
            
            if(scarer != undefined){
                testMap.brains[i].targetEntity = scarer;
                testMap.brains[i].state = "Space";
                testMap.brains[i].stateTimer = 0;
                i = testMap.brains.length;
            }
        }
    }
}

// Listen for WANDER_TARGET from server and update AI target
if (typeof socket !== 'undefined') {
    socket.on("WANDER_TARGET", data => {
        if (!data || typeof data.id === 'undefined' || !data.target) return;
        // Find the brain with this id and set its target
        if (window.testMap && Array.isArray(window.testMap.brains)) {
            for (let i = 0; i < window.testMap.brains.length; i++) {
                let brain = window.testMap.brains[i];
                if (brain && brain.id === data.id) {
                    brain.target = createVector(data.target.x, data.target.y);
                    break;
                }
            }
        }
    });
}