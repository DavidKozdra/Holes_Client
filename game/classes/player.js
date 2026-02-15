// Player.js

const BASE_SPEED = 5;

var curPlayer; //Your player
var players = {}; //other players

//player globals
var dirtInv = 0;
var maxDirtInv = 600;
var buildMode = false;
var renderGhost = false;
var wantRotate = true;
var ghostBuild;
var DIGSPEED = 0.04;

class Player {
    constructor(x, y, health, id, color, race, name) {
        this.id = id; // socket ID
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.holding = { w: false, a: false, s: false, d: false }; // Movement keys state
        this.race = race; // Race index
        this.name = name;
        this.color = color; //team color index
        this.statBlock = new StatBlock(this.race, health);
        this.invBlock = new InvBlock();
        this.alignment = 50;
        this.moving = false;
        this.kills = 0;

        // Animation properties
        this.currentFrame = 0; // Current frame for animation
        this.direction = 'down'; // Default direction
        this.animationFrame = 0;
        this.animationType = ""; // Name of current animation


        this.regenTimer = 0;         
        this.regenInterval = 3 

        this.attackingOBJ = {}

        // Dash mechanic properties
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDuration = 15; // frames (0.5 seconds at 30fps)
        this.dashCooldown = 0;
        this.dashCooldownMax = 60; // frames (2 seconds at 30fps)
        this.dashSpeedMultiplier = 2.5; // How much faster during dash
        this.dashManaCost = 20; // Mana cost per dash

        // All spell state is now managed in the magic system, not on the player object.
        this.spells = {};

        // Move slots (0-9) for spell/ability assignment
        this.movesSlots = [
            'forceField',
            'combustion',
            'meditate',
            'dash',
            null,
            null,
            null,
            null,
            null,
            null
        ];
    }
 newCollisionPoint(xOffset, yOffset, direction) {
        let chunkPos = testMap.globalToChunk(this.pos.x + (xOffset * TILESIZE), this.pos.y + (yOffset * TILESIZE));
        const chunkKey = chunkPos.key || getChunkKey(chunkPos.x, chunkPos.y);
        const chunk = testMap.chunks[chunkKey];

        if (chunk == undefined) { //if you dont have that chunk assume there is dirt in the way
            return {
                dir: direction,
                val: -1
            };
        }

        let x = floor(this.pos.x / TILESIZE) - (chunkPos.x * CHUNKSIZE) + xOffset;
        let y = floor(this.pos.y / TILESIZE) - (chunkPos.y * CHUNKSIZE) + yOffset;

        let x2 = floor(this.pos.x / TILESIZE) - (chunkPos.x * CHUNKSIZE) + xOffset;
        let y2 = floor(this.pos.y / TILESIZE) - (chunkPos.y * CHUNKSIZE) + yOffset;

        if (direction == "up") {
            y2 -= 1;
        }
        if (direction == "down") {
            y2 += 1;
        }
        if (direction == "left") {
            x2 -= 1;
        }
        if (direction == "right") {
            x2 += 1;
        }

        let chunkPos2 = {};
        chunkPos2.x = chunkPos.x;
        chunkPos2.y = chunkPos.y;
        if (x2 < 0) {
            chunkPos2.x -= 1;
            x2 = CHUNKSIZE - 1;
        }
        if (x2 >= CHUNKSIZE) {
            chunkPos2.x += 1;
            x2 = 0;
        }
        if (y2 < 0) {
            chunkPos2.y -= 1;
            y2 = CHUNKSIZE - 1;
        }
        if (y2 >= CHUNKSIZE) {
            chunkPos2.y += 1;
            y2 = 0;
        }

        const chunkKey2 = getChunkKey(chunkPos2.x, chunkPos2.y);
        const chunk2 = testMap.chunks[chunkKey2];

        if (chunk2 == undefined) { //if you dont have that chunk assume there is dirt in the way
            return {
                dir: direction,
                val: -1
            };
        }

        //MATH
        let val = chunk.data[x + y * CHUNKSIZE];
        let val2 = chunk2.data[x2 + y2 * CHUNKSIZE];

        if (val == -1 || val2 == -1) {
            return {
                dir: direction,
                val: -1
            };
        }

        val += 0.7;
        val2 += 0.7;

        let midpoint = { x: 0, y: 0 };
        let amt = 0;
        if (direction == "up" || direction == "down") {
            midpoint.x = x;
        }
        if (direction == "left" || direction == "right") {
            midpoint.y = y;
        }

        if (direction == "up") {
            amt = (1 - val) / (val2 - val);
            midpoint.y = lerp(y, y2, amt);
        }
        if (direction == "down") {
            amt = (1 - val) / (val2 - val);
            midpoint.y = lerp(y, y2, amt);
        }
        if (direction == "left") {
            amt = (1 - val2) / (val - val2);
            midpoint.x = lerp(x2, x, amt);
        }
        if (direction == "right") {
            amt = (1 - val2) / (val - val2);
            midpoint.x = lerp(x2, x, amt);
        }
        if(val == val2){
            amt = 0.5;
            if (direction == "up" || direction == "down") {
                midpoint.y = lerp(y, y2, amt);
            }
            if (direction == "left" || direction == "right") {
                midpoint.x = lerp(x2, x, amt);
            }
        }


        if (Debuging) {
            push();
            fill(255);
            circle(((x + (chunkPos.x * CHUNKSIZE)) * TILESIZE) - camera.pos.x + (width / 2), ((y + (chunkPos.y * CHUNKSIZE)) * TILESIZE) - camera.pos.y + (height / 2), 10);
            circle(((x2 + (chunkPos2.x * CHUNKSIZE)) * TILESIZE) - camera.pos.x + (width / 2), ((y2 + (chunkPos2.y * CHUNKSIZE)) * TILESIZE) - camera.pos.y + (height / 2), 10);

            fill(255, 0, 0);
            circle(((midpoint.x + (chunkPos2.x * CHUNKSIZE)) * TILESIZE) - camera.pos.x + (width / 2), ((midpoint.y + (chunkPos2.y * CHUNKSIZE)) * TILESIZE) - camera.pos.y + (height / 2), 10);
            pop();
        }

        return {
            val: chunk.data[x + y * CHUNKSIZE],
            val2: chunk2.data[x2 + y2 * CHUNKSIZE],
            iron_val: chunk.iron_data[x + y * CHUNKSIZE],
            iron_val2: chunk2.iron_data[x2 + y2 * CHUNKSIZE],
            x: (midpoint.x + (chunkPos2.x * CHUNKSIZE)) * TILESIZE,
            y: (midpoint.y + (chunkPos2.y * CHUNKSIZE)) * TILESIZE,
            dir: direction
        };

    }

    // --- Collision tuning (feel free to tweak) ---
getColliderRadius() {
    // Your old object check used "+ 29" as padding.
    // That implies ~14-15px radius-ish. Keep it consistent and stable.
    return 14.5;
}

getNeighborChunkKeysForWorldPos(wx, wy) {
    const c = testMap.globalToChunk(wx, wy);
    const keys = [];
    for (let cy = c.y - 1; cy <= c.y + 1; cy++) {
        for (let cx = c.x - 1; cx <= c.x + 1; cx++) {
            const k = getChunkKey(cx, cy);
            if (testMap.chunks[k]) keys.push(k);
        }
    }
    return keys;
}

isSolidTileAtWorld(wx, wy) {
    const chunkPos = testMap.globalToChunk(wx, wy);
    const chunkKey = chunkPos.key || getChunkKey(chunkPos.x, chunkPos.y);

    // Missing chunk = solid (your existing behavior)
    const chunk = testMap.chunks[chunkKey];
    if (!chunk) return true;

    // Local tile coords in chunk
    let tx = floor(wx / TILESIZE) - (chunkPos.x * CHUNKSIZE);
    let ty = floor(wy / TILESIZE) - (chunkPos.y * CHUNKSIZE);

    // Clamp safety
    if (tx < 0 || ty < 0 || tx >= CHUNKSIZE || ty >= CHUNKSIZE) return true;

    const idx = tx + ty * CHUNKSIZE;

    const dirt = chunk.data[idx];
    const iron = chunk.iron_data ? chunk.iron_data[idx] : 0;

    // Your code treated "-1" as blocked, and (val2>0 || iron_val2>0) as blocked.
    // So: -1 OR >0 => solid.
    if (dirt === -1) return true;
    if (dirt > 0) return true;
    if (iron > 0) return true;

    return false;
}

collidesWithTilesAt(pos) {
    const r = this.getColliderRadius();

    // Sample a few points around the circle collider.
    // This is fast + stable for tile grids.
    // (You can add more samples if your player is bigger.)
    const samples = [
        { x: pos.x + r, y: pos.y },
        { x: pos.x - r, y: pos.y },
        { x: pos.x, y: pos.y + r },
        { x: pos.x, y: pos.y - r },
        { x: pos.x + r, y: pos.y + r },
        { x: pos.x - r, y: pos.y + r },
        { x: pos.x + r, y: pos.y - r },
        { x: pos.x - r, y: pos.y - r },
    ];

    for (const p of samples) {
        if (this.isSolidTileAtWorld(p.x, p.y)) return true;
    }
    return false;
}

collidesWithObjectsAt(pos) {
    // Check objects in nearby chunks (handles border cases)
    const keys = this.getNeighborChunkKeysForWorldPos(pos.x, pos.y);
    const r = this.getColliderRadius();

    for (const key of keys) {
        const chunk = testMap.chunks[key];
        if (!chunk) continue;

        for (let j = 0; j < chunk.objects.length; j++) {
            const obj = chunk.objects[j];
            if (obj.z !== 2) continue;

            // Door exception
            if (obj.objName === "Door" && obj.alpha !== 255) continue;

            // Your existing collision was distance-based with a weird combined size.
            // We'll keep a similar effective radius but make it consistent.
            const objRadius = ((obj.size.w + obj.size.h) * 0.25) + r; // approx
            const d = obj.pos.dist(pos);

            if (d < objRadius) return true;
        }
    }

    return false;
}

collidesAt(pos) {
    // Missing chunk treated as solid tile by isSolidTileAtWorld checks
    if (this.collidesWithTilesAt(pos)) return true;
    if (this.collidesWithObjectsAt(pos)) return true;
    return false;
}
update() {
    const isLocal = (this === curPlayer);

    /* =========================
       INPUT / STATE
       ========================= */
    this.moving =
        this.holding.w ||
        this.holding.a ||
        this.holding.s ||
        this.holding.d;

    // Update magic cooldowns
    if (window.magicAbilities && this.magicCooldowns) {
        for (const ability of window.magicAbilities) {
            const key = ability.name;
            if (this.magicCooldowns[key] > 0) {
                this.magicCooldowns[key]--;
            }
        }
    }

    // Update active abilities
    const abilities = Array.isArray(this.magicAbilities)
        ? this.magicAbilities
        : (window.magicAbilities || []);

    for (const ability of abilities) {
        if (typeof ability.update === "function") {
            ability.update(this);
        }
    }

    // ─── Remote players: skip physics/chunk check, only interpolate + animate ───
    if (!isLocal) {
        this.updateRemote();
        return;
    }

    // Do not update local player if in unloaded space
    const chunkPos = testMap.globalToChunk(this.pos.x, this.pos.y);
    const chunkKey = chunkPos.key || getChunkKey(chunkPos.x, chunkPos.y);
    if (!testMap.chunks[chunkKey]) return;

    /* =========================
       VELOCITY BUILDUP  (local player only)
       ========================= */
    let speedMultiplier = this.isDashing ? this.dashSpeedMultiplier : 1;
    let accel =
        BASE_SPEED *
        this.statBlock.stats.runningSpeed *
        speedMultiplier *
        (deltaTime / 30);

    if (this.holding.w) { this.vel.y -= accel; this.direction = "up"; }
    if (this.holding.s) { this.vel.y += accel; this.direction = "down"; }
    if (this.holding.a) { this.vel.x -= accel; this.direction = "left"; }
    if (this.holding.d) { this.vel.x += accel; this.direction = "right"; }

    /* =========================
       STABLE COLLISION MOVEMENT  (local player only)
       (axis separated)
       ========================= */
    let movement = this.vel.copy().mult(deltaTime / 33);
    const maxStep = TILESIZE * 0.25;

    const moveAxis = (axis, amount) => {
        let remaining = amount;

        while (Math.abs(remaining) > 0.001) {
            let step = constrain(remaining, -maxStep, maxStep);

            let testPos = this.pos.copy();
            testPos[axis] += step;

            if (!this.collidesAt(testPos)) {
                this.pos = testPos;
                remaining -= step;
            } else {
                // Stop movement cleanly on collision
                break;
            }
        }
    };

    // X then Y prevents corner-locking
    moveAxis("x", movement.x);
    moveAxis("y", movement.y);

    /* =========================
       ANIMATION
       ========================= */
    if (this.moving) {
        this.animationFrame += 1 / 7;
        this.currentFrame = 1 + (this.animationFrame % 4);
        if (this.currentFrame >= 4) this.currentFrame = 2;
    } else if (this.animationType !== "") {
        if (this.animationType === "put") {
            this.currentFrame = 4;
        }
        this.animationFrame -= 1;
        if (this.animationFrame <= 0) {
            this.animationFrame = 0;
            this.animationType = "";
        }
    } else {
        this.animationFrame = 0;
        this.currentFrame = 0;
    }

    // Clear velocity each frame (intentional, input-driven movement)
    this.vel.set(0, 0);
    
    // Sync position to server only when actually moving or holding keys changed
    if (typeof playerStateBatcher !== 'undefined' && this.moving) {
        playerStateBatcher.setPosition(this.pos);
        playerStateBatcher.setHolding(this.holding);
    }
}

// Separate lightweight update for remote players — called from the main update()
// before the early-return so remote players still get interpolation + animation.
updateRemote() {
    // Infer facing direction from holding state (matches local player logic)
    if (this.holding.d) this.direction = 'right';
    if (this.holding.a) this.direction = 'left';
    if (this.holding.s) this.direction = 'down';
    if (this.holding.w) this.direction = 'up';

    // Smoothly interpolate towards target position from network updates
    if (this.targetPos) {
        const lerpSpeed = 0.4;
        this.pos.x = lerp(this.pos.x, this.targetPos.x, lerpSpeed);
        this.pos.y = lerp(this.pos.y, this.targetPos.y, lerpSpeed);
        
        const distToTarget = dist(this.pos.x, this.pos.y, this.targetPos.x, this.targetPos.y);
        this.moving = distToTarget > 1;

        // Fallback: infer direction from interpolation movement if no holding keys
        if (this.moving && !this.holding.w && !this.holding.a && !this.holding.s && !this.holding.d) {
            const dx = this.targetPos.x - this.pos.x;
            const dy = this.targetPos.y - this.pos.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
        }
    }

    // Animation for remote players
    if (this.moving) {
        this.animationFrame += 1 / 7;
        this.currentFrame = 1 + (this.animationFrame % 4);
        if (this.currentFrame >= 4) this.currentFrame = 2;
    } else if (this.animationType !== "") {
        if (this.animationType === "put") {
            this.currentFrame = 4;
        }
        this.animationFrame -= 1;
        if (this.animationFrame <= 0) {
            this.animationFrame = 0;
            this.animationType = "";
        }
    } else {
        this.animationFrame = 0;
        this.currentFrame = 0;
    }
}

    render() {
        // Only require chunk to be loaded for local player rendering;
        // remote players render based on RENDER_DISTANCE check in sketch.js
        if (this === curPlayer) {
            let chunkPos = testMap.globalToChunk(this.pos.x, this.pos.y);
            const chunkKey = chunkPos.key || getChunkKey(chunkPos.x, chunkPos.y);
            if (testMap.chunks[chunkKey] == undefined) return;
        }
        push();
        // Move relative to the camera
        translate(-camera.pos.x + width / 2, -camera.pos.y + height / 2);

        // Render all magic abilities (auras, particles, etc)
        const abilities = Array.isArray(this.magicAbilities) ? this.magicAbilities : (window.magicAbilities || []);
        for (const ability of abilities) {
            if (typeof ability.render === 'function') {
                // Skip local-only effects for other players
                if (ability.renderLocalOnly && this !== curPlayer) continue;
                ability.render(this);
            }
        }

        // ...existing code for name, health bar, and sprite...
        const yOffset = 60;
        textSize(16);
        textAlign(CENTER, CENTER);
        let nameText = this.name + " lvl_" + this.statBlock.level;
        let textW = textWidth(nameText) + 10;
        let textH = 20;
        rectMode(CENTER);
        fill(0, 150);
        noStroke();
        rect(this.pos.x, this.pos.y - yOffset, textW, textH, 4);
        
        // Determine display color: use team color if available, otherwise use index-based color
        let displayColor;
        if (typeof this.color === 'object' && this.color !== null && this.color.r !== undefined) {
            // Team color (RGB object)
            displayColor = this.color;
        } else if (this.teamId && window.allTeams && window.allTeams[this.teamId]) {
            // Fall back to team data if color is an index
            displayColor = window.allTeams[this.teamId].color;
        } else {
            // Use index-based color
            displayColor = teamColors[this.color] || teamColors[0];
        }
        
        fill(displayColor.r, displayColor.g, displayColor.b);
        textStyle(BOLD);
        text(nameText, this.pos.x, this.pos.y - yOffset);
        textStyle(NORMAL);
        let raceName = races[this.race]
        let imageToRender;
        if (this.direction === 'up') {
            imageToRender = raceImages[raceName].back[floor(this.currentFrame)]
        } else if (this.direction === 'down') {
            imageToRender = raceImages[raceName].front[floor(this.currentFrame)]
        } else if (this.direction === 'left') {
            imageToRender = raceImages[raceName].left[floor(this.currentFrame)]
        } else if (this.direction === 'right') {
            imageToRender = raceImages[raceName].right[floor(this.currentFrame)]
        }
        image(imageToRender, this.pos.x - 33.2, this.pos.y - 44.2, 66.2, 88.3, 0, 0, 29, 29);
        this.renderHealthBar();
        pop();
    }

    renderHealthBar() {
        push();

        // Set stroke and stroke weight for the outline
        stroke(0);        // Black stroke
        strokeWeight(2);  // Slightly thicker outline

        // Draw the health bar background with rounded corners
        fill(60, 60, 60); // dark background
        rect(
            this.pos.x,
            this.pos.y + 40,
            32,       // width 
            6,        // height
            3         // corner radius
        );

        // Calculate current health width
        let hp = this.statBlock.stats.hp;
        let mhp = this.statBlock.stats.mhp;
        let pct = hp / mhp;
        let healthWidth = constrain(
            map(hp, 0, mhp, 0, 32),
            0,
            32
        );

        // Determine bar color and pulse
        let barColor;
        let doPulse = false;
        if (pct > 0.6) {
            barColor = color(0, 200, 40); // green
        } else if (pct > 0.3) {
            barColor = color(255, 200, 0); // yellow
        } else {
            barColor = color(220, 40, 0); // red
            doPulse = true;
        }

        // Draw the health bar foreground
        noStroke();
        fill(barColor);
        rect(
            this.pos.x,
            this.pos.y + 40,
            healthWidth,
            6,
            3  // same radius so the corners match up
        );

        // White pulsing highlight for red bar
        if (doPulse && healthWidth > 0) {
            let pulse = 120 + 80 * sin(millis() / 200);
            fill(255, 255, 255, pulse);
            rect(
                this.pos.x,
                this.pos.y + 40,
                healthWidth,
                6,
                2
            );
        }

        pop();
    }


    animationCreate(anim) {
        switch (anim) {
            case "put": { this.animationFrame = 4; } break;
        }
        this.animationType = anim;
    }

}