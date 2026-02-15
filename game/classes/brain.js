// ═══════════════════════════════════════════════════════════
// AI Brain System — Dynamic Entity Behavior
// ═══════════════════════════════════════════════════════════

// ── Personality Behavior Table ──
// Each personality defines real behavioral differences
const PERSONALITY_BEHAVIORS = {
    aggressive: {
        visionMultiplier: 1.2, attackPlayers: true, attackEntities: true,
        taunts: ["Charge!", "For the clan!", "You're mine!", "No mercy!"],
        cooldownMs: 6000,
        fleeThreshold: 0,         // never flee
        retreatTicks: 60,         // short retreat before re-engaging
        chaseSpeed: 6, wanderSpeed: 2.5,
        idleChance: 0.15,         // rarely stops
        alertRange: 0.9,          // transitions straight to chase
        preferAttacker: true,     // prioritize last entity that hit them
    },
    territorial: {
        visionMultiplier: 1.0, attackPlayers: true, attackEntities: true,
        taunts: ["Leave now!", "Trespasser!", "This is MY ground!", "Back off!"],
        cooldownMs: 8000,
        fleeThreshold: 0.15,
        retreatTicks: 90,
        chaseSpeed: 5, wanderSpeed: 1.8,
        idleChance: 0.35,         // pauses often to "guard"
        alertRange: 0.7,          // wider alert zone before aggro
        preferAttacker: false,
        patrolRadius: 250,        // stays near spawn
        territoryAggroBuff: 1.5,  // vision buff when enemy in territory
        leashRadius: 400,         // de-aggro beyond this from spawn
    },
    cautious: {
        visionMultiplier: 0.9, attackPlayers: true, attackEntities: true,
        taunts: ["Keeping distance...", "I'll strike first.", "Don't push me.", "Hmph."],
        cooldownMs: 9000,
        fleeThreshold: 0.4,       // flee at 40% HP
        retreatTicks: 150,        // long retreat
        chaseSpeed: 4, wanderSpeed: 2,
        idleChance: 0.3,
        alertRange: 0.6,          // long alert phase before engaging
        preferAttacker: false,
        preferDistractedTargets: true,
        maintainRange: true,      // tries to stay at max attack range (kiting)
    },
    swarm: {
        visionMultiplier: 1.1, attackPlayers: true, attackEntities: true,
        taunts: ["Swarm!", "Bite bite bite!", "Skitter!", "For the colony!"],
        cooldownMs: 7000,
        fleeThreshold: 0.2,
        retreatTicks: 40,         // very short retreat — re-engage fast
        chaseSpeed: 5.5, wanderSpeed: 2,
        idleChance: 0.1,
        alertRange: 0.85,
        preferAttacker: true,
        swarmRadius: 300,         // radius to alert nearby swarm allies
        swarmSpeedBoost: 0.5,     // extra speed per nearby ally
        swarmMaxBoost: 1.5,
    },
    defensive: {
        visionMultiplier: 1.0, attackPlayers: false, attackEntities: true,
        taunts: ["Guarding.", "Stay close.", "Protecting."],
        cooldownMs: 8000,
        fleeThreshold: 0.1,
        retreatTicks: 80,
        chaseSpeed: 5, wanderSpeed: 2,
        idleChance: 0.4,
        alertRange: 0.7,
        preferAttacker: false,
        leashToOwner: true,
        ownerLeashRadius: 200,
    },
    default: {
        visionMultiplier: 1.0, attackPlayers: true, attackEntities: true,
        taunts: ["Spotted you.", "..."],
        cooldownMs: 8000,
        fleeThreshold: 0.2,
        retreatTicks: 100,
        chaseSpeed: 5, wanderSpeed: 2,
        idleChance: 0.25,
        alertRange: 0.75,
        preferAttacker: false,
    }
};

// ── Brain Ownership ──
// Only one client drives each brain to prevent multi-client jitter.
// The client whose curPlayer is closest claims the brain.
// NOTE: Use globalThis.Map to avoid shadowing by the game's Map class (map.js).
const _brainOwnership = new globalThis.Map();
const OWNERSHIP_CHECK_INTERVAL = 500;

function _shouldOwnBrain(brain) {
    if (!brain.obj || !curPlayer || !curPlayer.pos) return false;
    const now = Date.now();
    let entry = _brainOwnership.get(brain.id);
    if (entry && (now - entry.lastCheck) < OWNERSHIP_CHECK_INTERVAL) return entry.owned;

    const myDist = curPlayer.pos.dist(brain.obj.pos);
    let closest = true;
    const playerArr = Object.values(players);
    for (let i = 0; i < playerArr.length; i++) {
        const p = playerArr[i];
        if (!p || !p.pos) continue;
        if (p.pos.dist(brain.obj.pos) < myDist) { closest = false; break; }
    }
    _brainOwnership.set(brain.id, { owned: closest, lastCheck: now });
    return closest;
}

// Garbage-collect stale ownership entries
setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of _brainOwnership) {
        if (now - entry.lastCheck > 5000) _brainOwnership.delete(id);
    }
}, 10000);

// ═══════════════════════════════════════════════════════════
// Brain Class — 6-State FSM
// States: Idle → Wander → Alert → Chasing → Space → Flee
// ═══════════════════════════════════════════════════════════

class Brain {
    constructor(vision, personality){
        this.state = "Wander";
        this.target = null;
        this.targetEntity = null;
        this.stateTimer = 0;
        this.obj = null;
        this.id = random(10000);
        this.personality = personality || "default";
        const behavior = PERSONALITY_BEHAVIORS[this.personality] || PERSONALITY_BEHAVIORS.default;
        this.vision = (vision || 200) * behavior.visionMultiplier;
        this.deleteTag = false;
        this.lastChat = 0;
        this.ownerName = null;
        this.teamId = null;
        this._lastMoveEmit = 0;

        // Threat Memory (aggro table)
        this.threatMemory = [];
        this.threatMemoryMax = 5;
        this.threatForgetMs = 15000;

        // Spawn Anchor (for territorial patrol)
        this.spawnPos = null;

        // Idle state internals
        this._idleDuration = 0;
        this._idleLookTimer = 0;

        // Alert state internals
        this._alertEntity = null;

        // Velocity smoothing — makes movement organic instead of robotic
        this._velocity = null;       // current smoothed velocity vector
        this._headingBlend = 0.12;   // how fast heading blends toward desired (0=frozen, 1=instant)

        // Stuck detection — dig out when trapped in terrain
        this._lastPos = null;        // position snapshot for stuck check
        this._stuckFrames = 0;       // consecutive frames with negligible movement
        this._lastDigTime = 0;       // throttle dig actions (ms)
        this._digCooldownMs = 200;   // min ms between dig actions
    }

    // ══════════════════════════════
    // Main Update Tick
    // ══════════════════════════════
    update(){
        if(this.obj == null || this.obj.deleteTag) return;
        if(!_shouldOwnBrain(this)) return;

        this.stateTimer++;
        this._cleanThreatMemory();

        // ── Stuck Detection — dig out when actually trapped in terrain ──
        if(this._lastPos){
            const moved = this.obj.pos.dist(this._lastPos);
            // Only count as stuck if barely moving AND actually blocked by solid terrain
            const standingInSolid = this._isSolidAt(this.obj.pos.x, this.obj.pos.y);
            const headingBlocked = this.target ? this._isSolidAt(
                this.obj.pos.x + Math.cos(this.obj.rot || 0) * TILESIZE,
                this.obj.pos.y + Math.sin(this.obj.rot || 0) * TILESIZE
            ) : false;
            if(moved < 1.5 && (standingInSolid || headingBlocked)){
                this._stuckFrames++;
            } else {
                this._stuckFrames = Math.max(0, this._stuckFrames - 3);
            }
            // Require 20 frames stuck before digging (prevents false positives on slow frames)
            if(this._stuckFrames >= 20){
                this._digOut();
            }
        } else if(this.obj.pos && this._isSolidAt(this.obj.pos.x, this.obj.pos.y)){
            // First frame: if spawned inside terrain, dig immediately
            this._stuckFrames = 20;
            this._digOut();
        }
        this._lastPos = this.obj.pos.copy();

        switch(this.state){
            case "Idle":    this._updateIdle(); break;
            case "Wander":  this._updateWander(); break;
            case "Alert":   this._updateAlert(); break;
            case "Chasing": this._updateChasing(); break;
            case "Space":   this._updateSpace(); break;
            case "Flee":    this._updateFlee(); break;
            default:        this.state = "Wander"; break;
        }
    }

    // ─── IDLE: pause, look around naturally ───
    _updateIdle(){
        if(this._scanForAlert()) return;
        if(this.findTarget()){ this._transitionTo("Chasing"); return; }

        // Gradual look-around — only rotate to adjacent directions, never 180° snap
        this._idleLookTimer--;
        if(this._idleLookTimer <= 0){
            if(this.obj.direction !== undefined){
                const adjacentDirs = {
                    'up': ['left','right','up'],
                    'down': ['left','right','down'],
                    'left': ['up','down','left'],
                    'right': ['up','down','right']
                };
                const options = adjacentDirs[this.obj.direction] || ['up','down','left','right'];
                this.obj.direction = options[Math.floor(Math.random()*options.length)];
            }
            this._idleLookTimer = 40 + Math.floor(Math.random()*80);
        }
        // Slow velocity to zero during idle (decelerate, don't snap-stop)
        if(this._velocity){
            this._velocity.mult(0.85);
            if(this._velocity.mag() < 0.1) this._velocity = null;
        }
        if(this.stateTimer >= this._idleDuration) this._transitionTo("Wander");
    }

    // ─── WANDER: move to random point ───
    _updateWander(){
        const behavior = this._behavior();
        if(this._scanForAlert()) return;
        if(this.findTarget()){ this._transitionTo("Chasing"); return; }

        // Pick a new target on arrival (or first tick) — NO early return
        // so the entity starts moving toward the new target on the same frame
        if(this.target == null || this.obj.pos.dist(this.target) < 20){
            // Small chance to idle on arrival — makes entities feel like they're surveying
            if(Math.random() < (behavior.idleChance || 0.2)){
                this._idleDuration = 60 + Math.floor(Math.random()*120);
                this._idleLookTimer = 0;
                this._transitionTo("Idle");
                return; // only return when actually going idle
            }
            if(Math.random() < 0.1){
                socket.emit("wander_request", {id: this.id, pos: {x: this.obj.pos.x, y: this.obj.pos.y}});
            }
            // Always pick a local target (server target arrives async and will overwrite if needed)
            this.target = this._pickWanderTarget();
            // Validate target is not inside solid terrain — re-roll up to 3 times
            for(let tries = 0; tries < 3 && this.target && this._isSolidAt(this.target.x, this.target.y); tries++){
                this.target = this._pickWanderTarget();
            }
        }
        // Move toward target — no freeze frame
        if(this.target){
            this.moveObjTowards(this.target.x, this.target.y, behavior.wanderSpeed || 2);
        }
    }

    // ─── ALERT: noticed something, watching ───
    _updateAlert(){
        if(!this._alertEntity || !this._alertEntity.pos){
            this._transitionTo("Wander"); return;
        }
        if(this.obj.direction !== undefined){
            const dx = this._alertEntity.pos.x - this.obj.pos.x;
            const dy = this._alertEntity.pos.y - this.obj.pos.y;
            const ang = (Math.atan2(dy,dx)*180/Math.PI+360)%360;
            if(ang>=315||ang<45) this.obj.direction='right';
            else if(ang>=45&&ang<135) this.obj.direction='down';
            else if(ang>=135&&ang<225) this.obj.direction='left';
            else this.obj.direction='up';
        }
        const dist = this.obj.pos.dist(this._alertEntity.pos);
        const aggroRange = this.vision * (this._behavior().alertRange || 0.75);
        if(dist < aggroRange){
            this.targetEntity = this._alertEntity;
            this.target = this._alertEntity.pos.copy(); // snapshot — avoid live reference
            this._alertEntity = null;
            this.maybeTaunt(this.targetEntity, true);
            this._transitionTo("Chasing"); return;
        }
        if(dist > this.vision*1.2){ this._alertEntity=null; this._transitionTo("Wander"); return; }
        if(this.stateTimer > 150){ this._alertEntity=null; this._transitionTo("Wander"); }
    }

    // ─── CHASING: pursue & attack ───
    _updateChasing(){
        const behavior = this._behavior();
        if(!this.targetEntity || this.targetEntity.hp <= 0 ||
           (this.targetEntity.statBlock && this.targetEntity.statBlock.stats && this.targetEntity.statBlock.stats.hp <= 0)){
            this._transitionTo("Wander"); this.target=null; this.targetEntity=null; return;
        }
        if(!this.canSee(this.targetEntity.pos.x, this.targetEntity.pos.y)){
            if(behavior.leashRadius && this.spawnPos && this.obj.pos.dist(this.spawnPos) > behavior.leashRadius){
                this._transitionTo("Wander"); this.target=this.spawnPos.copy(); this.targetEntity=null; return;
            }
            this._transitionTo("Wander"); this.target=null; this.targetEntity=null; return;
        }
        if(behavior.leashToOwner && this.ownerName && curPlayer && curPlayer.name === this.ownerName){
            if(this.obj.pos.dist(curPlayer.pos) > (behavior.ownerLeashRadius||200)){
                this.target=curPlayer.pos.copy(); this.targetEntity=null; this._transitionTo("Wander"); return;
            }
        }
        if(this._shouldFlee()){ this._transitionTo("Flee"); return; }

        // Re-snapshot target position each frame (detached copy).
        // A live reference causes spiraling when the player moves laterally.
        this.target = this.targetEntity.pos.copy();
        let projType = projDic[this.obj.projName];
        let isRanged = projType && projType.type === "SimpleProj";
        let attackRange = isRanged ? projType.r * 6 : projType.sr;
        let speedBoost = behavior.swarmRadius ? this._getSwarmSpeedBoost() : 0;
        let chaseSpeed = (behavior.chaseSpeed||5) + speedBoost;

        // Cautious kiting
        if(behavior.maintainRange && isRanged){
            const dist = this.obj.pos.dist(this.target);
            const idealRange = attackRange * 0.85;
            if(dist < idealRange*0.6){
                let awayDir = this.obj.pos.copy().sub(this.targetEntity.pos).setMag(idealRange);
                let retreatTarget = this.targetEntity.pos.copy().add(awayDir);
                this.moveObjTowards(retreatTarget.x, retreatTarget.y, chaseSpeed*0.8);
                return;
            }
        }
        if(this.obj.pos.dist(this.target) > attackRange){
            this.moveObjTowards(this.target.x, this.target.y, isRanged ? chaseSpeed*0.7 : chaseSpeed);
        } else {
            this._attack(isRanged, projType);
            this._transitionTo("Space");
        }
    }

    // ─── SPACE: retreat after attacking ───
    _updateSpace(){
        const behavior = this._behavior();
        const maxRetreat = behavior.retreatTicks || 100;
        if(!this.targetEntity || this.targetEntity.hp <= 0){
            this._transitionTo("Wander"); this.target=null; this.targetEntity=null; this._retreatTarget=null; return;
        }
        if(this.stateTimer < maxRetreat){
            // Compute retreat target ONCE on entry, then reuse.
            // Recalculating from a live reference each frame caused oscillation.
            if(!this._retreatTarget){
                this._retreatTarget = this.obj.pos.copy().sub(this.targetEntity.pos).setMag(120).add(this.obj.pos);
            }
            if(this.obj.pos.dist(this._retreatTarget) > 8) this.moveObjTowards(this._retreatTarget.x, this._retreatTarget.y, 4);
            if(this.targetEntity.pos && this.obj.pos.dist(this.targetEntity.pos) < 60) this.stateTimer = Math.max(0, this.stateTimer-5);
            if(this.targetEntity.pos && this.obj.pos.dist(this.targetEntity.pos) > 120) this.stateTimer += 5;
        } else {
            this._retreatTarget = null;
            this.target = this.targetEntity.pos.copy();
            this._transitionTo("Chasing");
        }
    }

    // ─── FLEE: low HP, run away ───
    _updateFlee(){
        const behavior = this._behavior();
        if(this.stateTimer > 150){
            this._transitionTo("Wander"); this.target=null; this.targetEntity=null; return;
        }
        const threat = this._getTopThreat();
        let fleeFrom = (threat && threat.pos) ? threat :
                        (this.targetEntity && this.targetEntity.pos) ? this.targetEntity : null;
        if(fleeFrom){
            let awayDir = this.obj.pos.copy().sub(fleeFrom.pos).setMag(200);
            let fleeTarget = this.obj.pos.copy().add(awayDir);
            this.moveObjTowards(fleeTarget.x, fleeTarget.y, (behavior.chaseSpeed||5)*1.2);
        } else {
            if(!this.target){
                let angle = Math.random()*Math.PI*2;
                this.target = createVector(this.obj.pos.x+Math.cos(angle)*300, this.obj.pos.y+Math.sin(angle)*300);
            }
            this.moveObjTowards(this.target.x, this.target.y, (behavior.chaseSpeed||5)*1.2);
        }
    }

    // ══════════════════════════════
    // Combat — Fire Projectile
    // ══════════════════════════════
    _attack(isRanged, projType){
        let chunkPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
        let toTarget = createVector(this.target.x, this.target.y).sub(this.obj.pos);
        let ownerId = this.obj.id || this.obj.objName;
        const chunkKey = chunkPos.x+','+chunkPos.y;

        if(isRanged){
            let proj = createProjectile(this.obj.projName, ownerId, this.obj.color, this.obj.pos.x, this.obj.pos.y, toTarget.heading(), this.obj);
            if(testMap.chunks[chunkKey] != undefined){
                testMap.chunks[chunkKey].projectiles.push(proj);
                socket.emit("new_proj", proj);
            }
        } else {
            toTarget.setMag(50);
            let proj = createProjectile(this.obj.projName, ownerId, this.obj.color, this.obj.pos.x, this.obj.pos.y, toTarget.heading(), this.obj);
            if(testMap.chunks[chunkKey] != undefined){
                testMap.chunks[chunkKey].projectiles.push(proj);
                socket.emit("new_proj", proj);
                let temp = new SoundObj("swing.wav", this.obj.pos.x, this.obj.pos.y);
                testMap.chunks[chunkKey].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "swing.wav", cPos: chunkPos, pos: {x: this.obj.pos.x, y: this.obj.pos.y}, id: temp.id});
            }
        }
    }

    // ══════════════════════════════
    // Targeting — Find & Evaluate
    // ══════════════════════════════
    findTarget(){
        if(this.obj == null) return false;
        this.targetEntity = null;
        const behavior = this._behavior();

        // Aggressive: prefer whoever last attacked us
        if(behavior.preferAttacker && this.threatMemory.length > 0){
            const topThreat = this._getTopThreat();
            if(topThreat && topThreat.pos && this.canSee(topThreat.pos.x, topThreat.pos.y)){
                const hp = topThreat.statBlock?.stats?.hp ?? topThreat.hp ?? 1;
                if(hp > 0){
                    this.targetEntity = topThreat;
                    this.target = topThreat.pos.copy(); // snapshot
                    return true;
                }
            }
        }

        const candidates = [];
        let playerArray = Object.values(players);
        if(curPlayer) playerArray.push(curPlayer);
        for(let i = 0; i < playerArray.length; i++){
            const p = playerArray[i];
            if(!p || !p.pos || (p.statBlock?.stats?.hp ?? 1) <= 0) continue;
            candidates.push({ entity: p, isPlayer: true });
        }
        const cPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
        for(let dx = -1; dx <= 1; dx++){
            for(let dy = -1; dy <= 1; dy++){
                const key = (cPos.x + dx) + "," + (cPos.y + dy);
                const chunk = testMap.chunks[key];
                if(!chunk) continue;
                for(let j = 0; j < chunk.objects.length; j++){
                    const o = chunk.objects[j];
                    if(!o || o === this.obj || o.deleteTag) continue;
                    if(o.type === "Entity" && o.hp > 0) candidates.push({ entity: o, isPlayer: false });
                }
            }
        }

        candidates.sort((a, b) => this.obj.pos.dist(a.entity.pos) - this.obj.pos.dist(b.entity.pos));

        // Cautious: prefer distracted targets
        if(behavior.preferDistractedTargets){
            candidates.sort((a, b) => {
                const aD = this._isDistracted(a.entity) ? 0 : 1;
                const bD = this._isDistracted(b.entity) ? 0 : 1;
                if(aD !== bD) return aD - bD;
                return this.obj.pos.dist(a.entity.pos) - this.obj.pos.dist(b.entity.pos);
            });
        }

        for(let i = 0; i < candidates.length; i++){
            const candidate = candidates[i];
            const target = candidate.entity;
            if(!target || !target.pos) continue;
            if(this.ownerName && candidate.isPlayer && target.name === this.ownerName) continue;
            if(this.teamId && target.teamId === this.teamId) continue;
            if(candidate.isPlayer && !behavior.attackPlayers) continue;
            if(!candidate.isPlayer && !behavior.attackEntities) continue;
            if(!candidate.isPlayer && !this.isHostileEntity(target)) continue;

            if(this.canSee(target.pos.x, target.pos.y)){
                this.targetEntity = target;
                this.target = target.pos.copy(); // snapshot — avoid live reference spiraling
                this.maybeTaunt(target, candidate.isPlayer);
                // Swarm: alert nearby allies
                if(behavior.swarmRadius) this._alertSwarm(target);
                return true;
            }
        }
        return false;
    }

    canSee(x,y){
        if(this.obj == null) return false;
        return createVector(x,y).dist(this.obj.pos) < this.vision;
    }

    isHostileEntity(target){
        if(!target || target === this.obj) return false;
        if(target.type !== "Entity") return false;
        if(this.teamId){
            if(!target.teamId) return true;
            if(target.teamId !== this.teamId) return true;
            return false;
        }
        if(target.objName && this.obj.objName && target.objName === this.obj.objName && target.race === this.obj.race) return false;
        return true;
    }

    // ══════════════════════════════
    // Alert Scan — between Idle/Wander and Chase
    // ══════════════════════════════
    _scanForAlert(){
        if(this.obj == null) return false;
        const behavior = this._behavior();
        const alertVision = this.vision * 1.1;
        let playerArray = Object.values(players);
        if(curPlayer) playerArray.push(curPlayer);

        for(let i = 0; i < playerArray.length; i++){
            const p = playerArray[i];
            if(!p || !p.pos || (p.statBlock?.stats?.hp ?? 1) <= 0) continue;
            if(this.ownerName && p.name === this.ownerName) continue;
            if(this.teamId && p.teamId === this.teamId) continue;
            if(!behavior.attackPlayers) continue;

            const dist = this.obj.pos.dist(p.pos);
            const aggroRange = this.vision * (behavior.alertRange || 0.75);
            if(dist < aggroRange){
                this.targetEntity = p; this.target = p.pos.copy(); // snapshot
                this._transitionTo("Chasing"); return true;
            }
            if(dist < alertVision && dist >= aggroRange){
                this._alertEntity = p;
                this._transitionTo("Alert"); return true;
            }
        }
        return false;
    }

    // ══════════════════════════════
    // Threat Memory (Aggro Table)
    // ══════════════════════════════
    addThreat(attackerId, damage){
        const existing = this.threatMemory.find(t => t.id === attackerId);
        if(existing){ existing.damage += damage; existing.timestamp = Date.now(); }
        else {
            this.threatMemory.push({ id: attackerId, damage: damage, timestamp: Date.now() });
            if(this.threatMemory.length > this.threatMemoryMax) this.threatMemory.shift();
        }
    }

    _cleanThreatMemory(){
        const now = Date.now();
        this.threatMemory = this.threatMemory.filter(t => (now - t.timestamp) < this.threatForgetMs);
    }

    _getTopThreat(){
        if(this.threatMemory.length === 0) return null;
        const sorted = this.threatMemory.slice().sort((a, b) => b.timestamp - a.timestamp);
        const topId = sorted[0].id;
        if(curPlayer && (curPlayer.name === topId || curPlayer.id === topId)) return curPlayer;
        const playerArr = Object.values(players);
        for(let i = 0; i < playerArr.length; i++){
            if(playerArr[i] && (playerArr[i].name === topId || playerArr[i].id === topId)) return playerArr[i];
        }
        return null;
    }

    _isDistracted(entity){
        if(!testMap || !testMap.brains) return false;
        for(let i = 0; i < testMap.brains.length; i++){
            const b = testMap.brains[i];
            if(b === this || b.deleteTag) continue;
            if(b.state === "Chasing" && b.targetEntity === entity) return true;
        }
        return false;
    }

    _shouldFlee(){
        const behavior = this._behavior();
        if(!behavior.fleeThreshold || behavior.fleeThreshold <= 0) return false;
        const hp = this.obj.hp || (this.obj.statBlock?.stats?.hp ?? 100);
        const mhp = this.obj.mhp || (this.obj.statBlock?.stats?.mhp ?? 100);
        return (hp / mhp) < behavior.fleeThreshold;
    }

    // ══════════════════════════════
    // Swarm Coordination
    // ══════════════════════════════
    _alertSwarm(target){
        if(!testMap || !testMap.brains) return;
        const behavior = this._behavior();
        const radius = behavior.swarmRadius || 300;
        for(let i = 0; i < testMap.brains.length; i++){
            const b = testMap.brains[i];
            if(b === this || b.deleteTag || !b.obj) continue;
            if(b.personality !== "swarm") continue;
            if(b.state === "Chasing" || b.state === "Space") continue;
            if(b.obj.pos.dist(this.obj.pos) < radius){
                b.targetEntity = target;
                b.target = target.pos.copy(); // snapshot
                b._transitionTo("Chasing");
            }
        }
    }

    _getSwarmSpeedBoost(){
        const behavior = this._behavior();
        if(!testMap || !testMap.brains || !this.targetEntity) return 0;
        let allyCount = 0;
        for(let i = 0; i < testMap.brains.length; i++){
            const b = testMap.brains[i];
            if(b === this || b.deleteTag || !b.obj) continue;
            if(b.personality !== "swarm") continue;
            if(b.state !== "Chasing" || b.targetEntity !== this.targetEntity) continue;
            if(b.obj.pos.dist(this.obj.pos) < (behavior.swarmRadius||300)) allyCount++;
        }
        return Math.min(allyCount * (behavior.swarmSpeedBoost||0.5), behavior.swarmMaxBoost||1.5);
    }

    // ══════════════════════════════
    // Wander Target Selection
    // ══════════════════════════════
    _pickWanderTarget(){
        const behavior = this._behavior();

        // Territorial: bias toward spawn point
        if(behavior.patrolRadius && this.spawnPos){
            const distFromSpawn = this.obj.pos.dist(this.spawnPos);
            if(distFromSpawn > behavior.patrolRadius){
                let toSpawn = this.spawnPos.copy().sub(this.obj.pos).setMag(150 + Math.random()*150);
                return createVector(this.obj.pos.x + toSpawn.x, this.obj.pos.y + toSpawn.y);
            }
        }
        // Defensive: orbit around owner
        if(behavior.leashToOwner && this.ownerName){
            let owner = null;
            if(curPlayer && curPlayer.name === this.ownerName) owner = curPlayer;
            else {
                const pArr = Object.values(players);
                for(let i = 0; i < pArr.length; i++){
                    if(pArr[i] && pArr[i].name === this.ownerName){ owner = pArr[i]; break; }
                }
            }
            if(owner && owner.pos){
                let angle = Math.random()*Math.PI*2;
                let dist = 80 + Math.random()*150;
                return createVector(owner.pos.x + Math.cos(angle)*dist, owner.pos.y + Math.sin(angle)*dist);
            }
        }
        // Default random wander — long, purposeful paths (200–400px)
        let angle = Math.random()*Math.PI*2;
        let dist = 200 + Math.random()*200;
        return createVector(this.obj.pos.x + Math.cos(angle)*dist, this.obj.pos.y + Math.sin(angle)*dist);
    }

    // ══════════════════════════════
    // Taunting
    // ══════════════════════════════
    maybeTaunt(target, isPlayer){
        if(!this.obj) return;
        const behavior = this._behavior();
        const now = Date.now();
        if(now - this.lastChat < (behavior.cooldownMs || 8000)) return;
        const lines = behavior.taunts || PERSONALITY_BEHAVIORS.default.taunts;
        const line = lines[Math.floor(Math.random() * lines.length)];
        if(!line) return;
        this.lastChat = now;
        socket.emit("entity_chat", {
            user: this.obj.objName || "Entity",
            message: line,
            pos: { x: this.obj.pos.x, y: this.obj.pos.y },
            speakingRange: isPlayer ? 1.2 : 1
        });
    }

    // ══════════════════════════════
    // Movement with Obstacle Avoidance
    // ══════════════════════════════
    moveObjTowards(x,y,speed){
        let oldChunkPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
        const oldChunkKey = oldChunkPos.key || getChunkKey(oldChunkPos.x, oldChunkPos.y);
        const oldChunk = testMap.chunks[oldChunkKey];

        // Terrain slowdown — only on actually solid tiles (>0.5), not partial remnants
        let xTile = floor(this.obj.pos.x / TILESIZE) - (oldChunkPos.x * CHUNKSIZE);
        let yTile = floor(this.obj.pos.y / TILESIZE) - (oldChunkPos.y * CHUNKSIZE);
        if(oldChunk && oldChunk.data[xTile + yTile * CHUNKSIZE] > 0.5){
            speed = speed/2;
        }

        // ── Obstacle Avoidance ──
        // Raycast 2 tiles ahead; if solid terrain, steer ±45°/±90° to slide around.
        let moveVec = createVector(x,y).sub(this.obj.pos);
        let desiredHeading = moveVec.heading();
        let heading = desiredHeading;

        {
            const lookAhead = 2;
            for(let d = 1; d <= lookAhead; d++){
                let probeX = this.obj.pos.x + Math.cos(heading)*TILESIZE*d;
                let probeY = this.obj.pos.y + Math.sin(heading)*TILESIZE*d;
                if(this._isSolidAt(probeX, probeY)){
                    // Solid terrain — try steering ±30° ±60° ±90° (finer increments = smoother arcs)
                    let steered = false;
                    for(let sa of [PI/6, -PI/6, PI/3, -PI/3, PI/2, -PI/2]){
                        let nh = heading + sa;
                        let sx = this.obj.pos.x + Math.cos(nh)*TILESIZE*d;
                        let sy = this.obj.pos.y + Math.sin(nh)*TILESIZE*d;
                        if(!this._isSolidAt(sx, sy)){
                            heading = nh; steered = true; break;
                        }
                    }
                    if(steered) break;
                    speed *= 0.3; break; // all blocked
                }
            }
        }

        // ── Velocity Smoothing ──
        // Blend toward desired heading instead of snapping — produces organic curved paths
        let desiredVel = p5.Vector.fromAngle(heading).setMag(speed);
        if(!this._velocity){
            this._velocity = desiredVel.copy();
        } else {
            // Blend factor: higher when chasing (responsive), lower when wandering (smooth)
            let blend = this._headingBlend;
            if(this.state === 'Chasing' || this.state === 'Flee') blend = 0.25;
            this._velocity.lerp(desiredVel, blend);
        }

        // Apply smoothed velocity with deltaTime normalization
        let dt = Math.min(deltaTime, 50) / 30; // cap to prevent huge jumps on lag spikes
        moveVec = this._velocity.copy().mult(dt);
        let smoothedHeading = this._velocity.heading();
        this.obj.rot = smoothedHeading;

        if(this.obj.direction !== undefined){
            let angle = (smoothedHeading * 180 / PI + 360) % 360;
            if(angle>=315||angle<45) this.obj.direction='right';
            else if(angle>=45&&angle<135) this.obj.direction='down';
            else if(angle>=135&&angle<225) this.obj.direction='left';
            else this.obj.direction='up';
        }

        this.obj.pos.add(moveVec);

        // Throttle movement syncs to ~10/sec
        const _now = Date.now();
        if(_now - this._lastMoveEmit >= 100){
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

        // ── Chunk Migration ──
        let newChunkPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
        if(oldChunkPos.x != newChunkPos.x || oldChunkPos.y != newChunkPos.y){
            let oldHp = this.obj.hp+0;
            this.obj.deleteTag = true;
            socket.emit("delete_obj", {
                cx: oldChunkPos.x,
                cy: oldChunkPos.y,
                objName: this.obj.objName,
                pos: {x: this.obj.pos.x, y: this.obj.pos.y},
                z: this.obj.z,
                brainID: this.id
            });

            let temp = createObject(
                this.obj.objName,
                this.obj.pos.x, this.obj.pos.y,
                this.obj.rot, this.obj.color,
                this.obj.id, this.obj.ownerName,
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
                });
                this.obj = temp;
            } else {
                this.obj = null;
            }
        }
    }

    // ══════════════════════════════
    // Dig Out — free entity from terrain
    // ══════════════════════════════

    /** Dig a 3-wide path to escape terrain. Seeks nearest air when no target. */
    _digOut(){
        const now = Date.now();
        if(now - this._lastDigTime < this._digCooldownMs) return;
        if(!this.obj || !this.obj.pos) return;

        // ── Determine best dig direction ──
        let heading;
        if(this.target){
            heading = createVector(this.target.x, this.target.y).sub(this.obj.pos).heading();
        } else {
            // No target — scan nearby tiles for the nearest air pocket and dig toward it
            heading = this._findNearestAirHeading();
        }

        const digAmount = 0.7; // aggressive dig — clears a 1.3 tile in ~2 ticks
        let dug = false;

        // Always dig the tile we're standing in first
        if(this._isSolidAt(this.obj.pos.x, this.obj.pos.y)){
            if(this._digTileAt(this.obj.pos.x, this.obj.pos.y, digAmount)) dug = true;
        }

        // Probe 1-2 tiles ahead in the dig direction
        for(let d = 1; d <= 2; d++){
            const probeX = this.obj.pos.x + Math.cos(heading) * TILESIZE * d;
            const probeY = this.obj.pos.y + Math.sin(heading) * TILESIZE * d;
            if(this._digTileAt(probeX, probeY, digAmount)) dug = true;

            // Dig a 3-wide path (perpendicular neighbors) so the entity can walk through
            const perpX = Math.cos(heading + PI/2) * TILESIZE;
            const perpY = Math.sin(heading + PI/2) * TILESIZE;
            this._digTileAt(probeX + perpX, probeY + perpY, digAmount);
            this._digTileAt(probeX - perpX, probeY - perpY, digAmount);
        }

        if(dug){
            this._lastDigTime = now;
            // Keep stuckFrames at threshold so continuous digging happens every cooldown
            this._stuckFrames = 20;
        }
    }

    /** Scan a ring of tiles around the entity to find the nearest air pocket.
     *  Returns a heading (radians) toward it, or a random heading if none found. */
    _findNearestAirHeading(){
        let bestDist = Infinity;
        let bestX = 0, bestY = 0;
        const ox = this.obj.pos.x;
        const oy = this.obj.pos.y;
        // Scan in expanding rings: 1, 2, 3, 4 tiles out
        for(let r = 1; r <= 4; r++){
            for(let dx = -r; dx <= r; dx++){
                for(let dy = -r; dy <= r; dy++){
                    if(Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // ring only
                    const wx = ox + dx * TILESIZE;
                    const wy = oy + dy * TILESIZE;
                    if(!this._isSolidAt(wx, wy)){
                        const d = dx*dx + dy*dy;
                        if(d < bestDist){ bestDist = d; bestX = wx; bestY = wy; }
                    }
                }
            }
            if(bestDist < Infinity) break; // found air at this ring, stop
        }
        if(bestDist < Infinity){
            return Math.atan2(bestY - oy, bestX - ox);
        }
        // Totally enclosed — random direction
        return Math.random() * Math.PI * 2;
    }

    /**
     * Dig a single tile at world coords (wx, wy) by the given amount.
     * Updates client terrain optimistically and batches the server update.
     * Returns true if a solid tile was actually dug.
     */
    _digTileAt(wx, wy, amt){
        const cp = testMap.globalToChunk(wx, wy);
        const ck = cp.key || getChunkKey(cp.x, cp.y);
        const chunk = testMap.chunks[ck];
        if(!chunk) return false;

        let tx = floor(wx / TILESIZE) - (cp.x * CHUNKSIZE);
        let ty = floor(wy / TILESIZE) - (cp.y * CHUNKSIZE);
        if(tx < 0 || ty < 0 || tx >= CHUNKSIZE || ty >= CHUNKSIZE) return false;

        const idx = tx + ty * CHUNKSIZE;
        const val = chunk.data[idx];

        // Only dig breakable solid tiles (skip unbreakable -1 and air 0)
        if(val <= 0 || val === -1) return false;

        // Optimistic client-side update (same logic as player dig)
        chunk.data[idx] -= amt;
        if(chunk.data[idx] < 0.3 && chunk.data[idx] !== -1) chunk.data[idx] = 0;

        // Also dig iron layer if present
        if(chunk.iron_data && chunk.iron_data[idx] > 0){
            chunk.iron_data[idx] -= amt;
            if(chunk.iron_data[idx] < 0.3 && chunk.iron_data[idx] !== -1) chunk.iron_data[idx] = 0;
            // Batch iron update to server
            if(typeof _batchIronUpdate === 'function'){
                _batchIronUpdate(ck, idx, amt);
            }
        }

        // Batch terrain update to server
        if(typeof _batchNodeUpdate === 'function'){
            _batchNodeUpdate(ck, idx, amt);
        }
        return true;
    }

    // ══════════════════════════════
    // Helpers
    // ══════════════════════════════
    _behavior(){
        return PERSONALITY_BEHAVIORS[this.personality] || PERSONALITY_BEHAVIORS.default;
    }

    _transitionTo(newState){
        this.state = newState;
        this.stateTimer = 0;
        if(newState !== "Space") this._retreatTarget = null;
        // Don't hard-reset velocity — let it decelerate naturally for smooth transitions
        // Exception: entering Idle should start decelerating (handled in _updateIdle)
    }

    /** Check if a world-space position is blocked (terrain OR placed objects).
     *  Thresholds tuned to match visual solidity — partial remnants (<0.7) are walkable. */
    _isSolidAt(wx, wy){
        // 1. Terrain check
        const cp = testMap.globalToChunk(wx, wy);
        const ck = cp.key || getChunkKey(cp.x, cp.y);
        const chunk = testMap.chunks[ck];
        if(!chunk) return true; // missing chunk = solid
        let tx = floor(wx / TILESIZE) - (cp.x * CHUNKSIZE);
        let ty = floor(wy / TILESIZE) - (cp.y * CHUNKSIZE);
        if(tx < 0 || ty < 0 || tx >= CHUNKSIZE || ty >= CHUNKSIZE) return true;
        const idx = tx + ty * CHUNKSIZE;
        const d = chunk.data[idx];
        if(d === -1 || d > 0.7) return true;
        const ir = chunk.iron_data ? chunk.iron_data[idx] : 0;
        if(ir > 0.3) return true;

        // 2. Placed object check (trees, walls, chests, turrets, etc.)
        if(this._isBlockedByObject(wx, wy)) return true;

        return false;
    }

    /** Check if a world position overlaps any solid placed object (z===2).
     *  Mirrors the player's collidesWithObjectsAt() — same distance formula, same door exception. */
    _isBlockedByObject(wx, wy){
        const probePos = createVector(wx, wy);
        const entityRadius = this.obj ? ((this.obj.size?.w || 32) + (this.obj.size?.h || 32)) * 0.125 : 8;
        const cp = testMap.globalToChunk(wx, wy);

        // Check objects in 3×3 chunk neighborhood
        for(let dx = -1; dx <= 1; dx++){
            for(let dy = -1; dy <= 1; dy++){
                const key = (cp.x + dx) + "," + (cp.y + dy);
                const chunk = testMap.chunks[key];
                if(!chunk) continue;
                for(let j = 0; j < chunk.objects.length; j++){
                    const obj = chunk.objects[j];
                    if(!obj || obj === this.obj || obj.deleteTag) continue;
                    // Only z-level 2 objects are solid (walls, trees, chests, etc.)
                    if(obj.z !== 2) continue;
                    // Open doors are walkable
                    if(obj.objName === "Door" && obj.alpha !== 255) continue;
                    // Same distance formula as player collision
                    const objRadius = ((obj.size.w + obj.size.h) * 0.25) + entityRadius;
                    if(probePos.dist(obj.pos) < objRadius) return true;
                }
            }
        }
        return false;
    }

    giveBody(obj){
        this.obj = obj;
        this.obj.brainID = this.id;
        if(!this.spawnPos && obj.pos) this.spawnPos = obj.pos.copy();
    }

    debugRender(){
        if(this.obj == null) return;
        push();
        let col;
        switch(this.state){
            case "Idle":    col=[100,100,255,80]; break;
            case "Wander":  col=[100,255,100,80]; break;
            case "Alert":   col=[255,255,0,80]; break;
            case "Chasing": col=[255,100,0,100]; break;
            case "Space":   col=[255,0,255,80]; break;
            case "Flee":    col=[255,0,0,100]; break;
            default:        col=[200,200,200,80]; break;
        }
        fill(col[0],col[1],col[2],col[3]);
        noStroke();
        circle(this.obj.pos.x-camera.pos.x+width/2, this.obj.pos.y-camera.pos.y+height/2, this.vision*2);
        if(this.target){
            fill(255,0,0,150);
            circle(this.target.x-camera.pos.x+width/2, this.target.y-camera.pos.y+height/2, 8);
            stroke(255,0,0,80); strokeWeight(1);
            line(this.obj.pos.x-camera.pos.x+width/2, this.obj.pos.y-camera.pos.y+height/2,
                 this.target.x-camera.pos.x+width/2, this.target.y-camera.pos.y+height/2);
        }
        noStroke(); fill(255); textSize(10); textAlign(CENTER);
        text(this.state, this.obj.pos.x-camera.pos.x+width/2, this.obj.pos.y-camera.pos.y+height/2-50);
        pop();
    }
}

// ═══════════════════════════════════════════════════════════
// scareBrain — called when a projectile hits an entity
// Now feeds the threat memory / aggro table
// ═══════════════════════════════════════════════════════════
function scareBrain(brainID, proj){
    if(brainID == undefined) return;
    let scarer;
    let scarerName;

    for(let i=0; i<testMap.brains.length; i++){
        if(brainID == testMap.brains[i].id){
            if(proj.flightPath != undefined){
                let chunkPos = testMap.globalToChunk(proj.flightPath.origin.x, proj.flightPath.origin.y);
                const chunkKey = chunkPos.key || getChunkKey(chunkPos.x, chunkPos.y);
                let chunk = testMap.chunks[chunkKey];
                if(chunk != undefined){
                    for(let j=0; j<chunk.objects.length; j++){
                        if(chunk.objects[j].objName == "Turret"){
                            if(chunk.objects[j].pos.dist(proj.flightPath.origin) < 70){
                                scarer = chunk.objects[j];
                                scarerName = "Turret";
                                break;
                            }
                        }
                    }
                }
                if(curPlayer && proj.ownerName == curPlayer.name){
                    scarer = curPlayer;
                    scarerName = curPlayer.name;
                }
                let keys = Object.keys(players);
                for(let j=0; j<keys.length; j++){
                    if(proj.ownerName == players[keys[j]].name){
                        scarer = players[keys[j]];
                        scarerName = players[keys[j]].name;
                        break;
                    }
                }
            }

            if(scarer != undefined){
                const brain = testMap.brains[i];
                const dmg = proj.damage || 10;
                brain.addThreat(scarerName || proj.ownerName, dmg);

                // Aggressive: don't retreat, just switch target
                const behavior = brain._behavior();
                if(behavior.fleeThreshold <= 0 && brain.state === "Chasing"){
                    brain.targetEntity = scarer;
                    brain.target = scarer.pos.copy(); // snapshot
                } else {
                    brain.targetEntity = scarer;
                    brain._retreatTarget = null; // reset so Space recomputes retreat direction
                    brain.state = "Space";
                    brain.stateTimer = 0;
                }
            }
            break;
        }
    }
}

// Listen for WANDER_TARGET from server and update AI target
// Only accept when brain is in Wander/Idle with no important target to prevent mid-walk snaps
if (typeof socket !== 'undefined') {
    socket.on("WANDER_TARGET", data => {
        if (!data || typeof data.id === 'undefined' || !data.target) return;
        if (window.testMap && Array.isArray(window.testMap.brains)) {
            for (let i = 0; i < window.testMap.brains.length; i++) {
                let brain = window.testMap.brains[i];
                if (brain && brain.id === data.id) {
                    // Only accept if wandering/idle — don't interrupt chase/flee/space
                    if(brain.state !== 'Wander' && brain.state !== 'Idle') break;
                    // Only accept if we don't have a target or are near arrival
                    if(brain.target && brain.obj && brain.obj.pos.dist(brain.target) > 30) break;
                    brain.target = createVector(data.target.x, data.target.y);
                    break;
                }
            }
        }
    });
}