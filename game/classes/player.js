// Player.js

const BASE_SPEED = 5;

var curPlayer; // Your player
var players = {}; // Other players

// Player globals
var dirtInv = 0;
var maxDirtInv = 600;
var buildMode = false;
var renderGhost = false;
var wantRotate = true;
var ghostBuild;
var DIGSPEED = 0.04;

class Player {
    constructor(x, y, health, id, color, race, name) {
        this.id = id;
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.holding = { w: false, a: false, s: false, d: false };
        this.race = race;
        this.name = name;
        this.color = color;

        this.statBlock = new StatBlock(this.race, health);
        this.invBlock = new InvBlock();

        this.alignment = 50;
        this.moving = false;
        this.kills = 0;

        // Animation
        this.currentFrame = 0;
        this.direction = 'down';
        this.animationFrame = 0;
        this.animationType = "";

        // Regen
        this.regenTimer = 0;
        this.regenInterval = 3;

        this.attackingOBJ = {};

        // Dash
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDuration = 15;
        this.dashCooldown = 0;
        this.dashCooldownMax = 60;
        this.dashSpeedMultiplier = 2.5;
        this.dashManaCost = 20;

        this.spells = {};

        this.movesSlots = [
            'forceField',
            'combustion',
            'meditate',
            'dash',
            null, null, null, null, null, null
        ];
    }

    /* ===============================
       COLLISION HELPERS (STABLE)
       =============================== */

    getColliderRadius() {
        return 14.5;
    }

    getNeighborChunkKeys(wx, wy) {
        const c = testMap.globalToChunk(wx, wy);
        const keys = [];
        for (let y = c.y - 1; y <= c.y + 1; y++) {
            for (let x = c.x - 1; x <= c.x + 1; x++) {
                const k = x + "," + y;
                if (testMap.chunks[k]) keys.push(k);
            }
        }
        return keys;
    }

    isSolidTile(wx, wy) {
        const c = testMap.globalToChunk(wx, wy);
        const chunk = testMap.chunks[c.x + "," + c.y];

        // Missing chunk = solid (your original behavior)
        if (!chunk) return true;

        let tx = floor(wx / TILESIZE) - c.x * CHUNKSIZE;
        let ty = floor(wy / TILESIZE) - c.y * CHUNKSIZE;

        if (tx < 0 || ty < 0 || tx >= CHUNKSIZE || ty >= CHUNKSIZE) return true;

        const idx = tx + ty * CHUNKSIZE;

        const dirt = chunk.data[idx];
        const iron = chunk.iron_data ? chunk.iron_data[idx] : 0;

        if (dirt === -1) return true;
        if (dirt > 0) return true;
        if (iron > 0) return true;

        return false;
    }

    collidesWithTiles(pos) {
        const r = this.getColliderRadius();
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
            if (this.isSolidTile(p.x, p.y)) return true;
        }
        return false;
    }

    collidesWithObjects(pos) {
        const r = this.getColliderRadius();
        const keys = this.getNeighborChunkKeys(pos.x, pos.y);

        for (const key of keys) {
            const chunk = testMap.chunks[key];
            if (!chunk) continue;

            for (const obj of chunk.objects) {
                if (obj.z !== 2) continue;

                if (obj.objName === "Door" && obj.alpha !== 255) continue;

                const objRadius = ((obj.size.w + obj.size.h) * 0.25) + r;
                if (obj.pos.dist(pos) < objRadius) return true;
            }
        }
        return false;
    }

    collidesAt(pos) {
        if (this.collidesWithTiles(pos)) return true;
        if (this.collidesWithObjects(pos)) return true;
        return false;
    }

    /* ===============================
       UPDATE
       =============================== */

    update() {
        const chunkPos = testMap.globalToChunk(this.pos.x, this.pos.y);
        if (!testMap.chunks[chunkPos.x + "," + chunkPos.y]) return;

        this.moving = this.holding.w || this.holding.a || this.holding.s || this.holding.d;

        let speedMul = this.isDashing ? this.dashSpeedMultiplier : 1;
        let accel = BASE_SPEED * this.statBlock.stats.runningSpeed * speedMul * (deltaTime / 30);

        if (this.holding.w) { this.vel.y -= accel; this.direction = 'up'; }
        if (this.holding.s) { this.vel.y += accel; this.direction = 'down'; }
        if (this.holding.a) { this.vel.x -= accel; this.direction = 'left'; }
        if (this.holding.d) { this.vel.x += accel; this.direction = 'right'; }

        let movement = this.vel.copy().mult(deltaTime / 33);
        const maxStep = TILESIZE * 0.25;

        const moveAxis = (axis, amount) => {
            let remaining = amount;
            while (abs(remaining) > 0.001) {
                let step = constrain(remaining, -maxStep, maxStep);
                let testPos = this.pos.copy();
                testPos[axis] += step;

                if (!this.collidesAt(testPos)) {
                    this.pos = testPos;
                    remaining -= step;
                } else {
                    break;
                }
            }
        };

        moveAxis("x", movement.x);
        moveAxis("y", movement.y);

        // Animation
        if (this.moving) {
            this.animationFrame += 1 / 7;
            this.currentFrame = 1 + (this.animationFrame % 4);
            if (this.currentFrame >= 4) this.currentFrame = 2;
        } else {
            this.animationFrame = 0;
            this.currentFrame = 0;
        }

        this.vel.set(0, 0);
    }


    render() {
        //dont render players not in your chunks
        let chunkPos = testMap.globalToChunk(this.pos.x, this.pos.y);
        if (testMap.chunks[chunkPos.x + "," + chunkPos.y] == undefined) return;
        push();
        // Move relative to the camera
        translate(-camera.pos.x + width / 2, -camera.pos.y + height / 2);

        // Render all magic abilities (auras, particles, etc)
        const abilities = Array.isArray(this.magicAbilities) ? this.magicAbilities : (window.magicAbilities || []);
        for (const ability of abilities) {
            if (typeof ability.render === 'function') ability.render(this);
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
        let displayColor = teamColors[this.color];
        if (this.teamId && window.allTeams && window.allTeams[this.teamId]) {
            displayColor = window.allTeams[this.teamId].color;
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
        fill(255, 0, 0);
        rect(
            this.pos.x,
            this.pos.y + 40,
            32,       // width 
            6,        // height
            3         // corner radius
        );

        // Calculate current health width
        let healthWidth = constrain(
            map(this.statBlock.stats.hp, 0, this.statBlock.stats.mhp, 0, 32),
            0,
            32
        );

        // Draw the health bar foreground
        // Switch to noStroke if you want the green bar to have no outline
        noStroke();
        fill(0, 255, 0);
        rect(
            this.pos.x,
            this.pos.y + 40,
            healthWidth,
            6,
            3  // same radius so the corners match up
        );

        pop();
    }


    animationCreate(anim) {
        switch (anim) {
            case "put": { this.animationFrame = 4; } break;
        }
        this.animationType = anim;
    }

}
