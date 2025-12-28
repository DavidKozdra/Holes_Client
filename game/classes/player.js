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

        if (testMap.chunks[chunkPos.x + "," + chunkPos.y] == undefined) { //if you dont have that chunk assume there is dirt in the way
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

        if (testMap.chunks[chunkPos2.x + "," + chunkPos2.y] == undefined) { //if you dont have that chunk assume there is dirt in the way
            return {
                dir: direction,
                val: -1
            };
        }

        //MATH
        let val = testMap.chunks[chunkPos.x + "," + chunkPos.y].data[x + y * CHUNKSIZE];
        let val2 = testMap.chunks[chunkPos2.x + "," + chunkPos2.y].data[x2 + y2 * CHUNKSIZE];

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
            val: testMap.chunks[chunkPos.x + "," + chunkPos.y].data[x + y * CHUNKSIZE],
            val2: testMap.chunks[chunkPos2.x + "," + chunkPos2.y].data[x2 + y2 * CHUNKSIZE],
            iron_val: testMap.chunks[chunkPos.x + "," + chunkPos.y].iron_data[x + y * CHUNKSIZE],
            iron_val2: testMap.chunks[chunkPos2.x + "," + chunkPos2.y].iron_data[x2 + y2 * CHUNKSIZE],
            x: (midpoint.x + (chunkPos2.x * CHUNKSIZE)) * TILESIZE,
            y: (midpoint.y + (chunkPos2.y * CHUNKSIZE)) * TILESIZE,
            dir: direction
        };

    }

    update() {
        //dont update players not in your chunks
        let chunkPos = testMap.globalToChunk(this.pos.x, this.pos.y);
        if (testMap.chunks[chunkPos.x + "," + chunkPos.y] == undefined) return;

        let collisionChecks = [];
        this.moving = (this.holding.w || this.holding.a || this.holding.s || this.holding.d);

        // Decrement magic cooldowns for all abilities by name
        if (window.magicAbilities && this.magicCooldowns) {
            for (const ability of window.magicAbilities) {
                const key = ability.name;
                if (this.magicCooldowns[key] > 0) {
                    this.magicCooldowns[key]--;
                }
            }
        }

        // Update all magic abilities (active or equipped)
        const abilities = Array.isArray(this.magicAbilities) ? this.magicAbilities : (window.magicAbilities || []);
        for (const ability of abilities) {
            if (typeof ability.update === 'function') ability.update(this);
        }

        // Calculate speed multiplier based on dash state
        let speedMultiplier = this.isDashing ? this.dashSpeedMultiplier : 1;

        if (this.holding.w) {
            this.vel.y += -BASE_SPEED * this.statBlock.stats.runningSpeed * speedMultiplier * (deltaTime/30);
            this.direction = 'up';
        }
        if (this.holding.a) {
            this.vel.x += -BASE_SPEED * this.statBlock.stats.runningSpeed * speedMultiplier * (deltaTime/30);
            this.direction = 'left';
        }
        if (this.holding.s) {
            this.vel.y += BASE_SPEED * this.statBlock.stats.runningSpeed * speedMultiplier * (deltaTime/30);
            this.direction = 'down';
        }
        if (this.holding.d) {
            this.vel.x += BASE_SPEED * this.statBlock.stats.runningSpeed * speedMultiplier * (deltaTime/30);
            this.direction = 'right';
        }

        // ...existing code for movement/collision/animation...
        let oldPos = this.pos.copy();
        let movement = this.vel.copy().mult(deltaTime/33);
        const maxStepSize = TILESIZE * 0.25;
        const movementMag = movement.mag();
        if (movementMag > maxStepSize) {
            const steps = Math.ceil(movementMag / maxStepSize);
            const stepVec = movement.copy().div(steps);
            for (let step = 0; step < steps; step++) {
                let testPos = this.pos.copy().add(stepVec);
                let collision = false;
                let testChunkPos = testMap.globalToChunk(testPos.x, testPos.y);
                let testChunk = testMap.chunks[testChunkPos.x + "," + testChunkPos.y];
                if (testChunk) {
                    for (let j = 0; j < testChunk.objects.length; j++) {
                        if (testChunk.objects[j].z == 2) {
                            let d = testChunk.objects[j].pos.dist(testPos);
                            if (d * 2 < (testChunk.objects[j].size.w + testChunk.objects[j].size.h) / 2 + 29) {
                                if (testChunk.objects[j].objName == "Door") {
                                    if (testChunk.objects[j].alpha == 255) {
                                        collision = true;
                                        break;
                                    }
                                } else {
                                    collision = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!collision) {
                        for (let i = 0; i < collisionChecks.length; i++) {
                            let check = collisionChecks[i];
                            if (check.val == -1) {
                                collision = true;
                                break;
                            }
                            if (check.val2 > 0 || check.iron_val2 > 0) {
                                if (check.dir == "up" || check.dir == "down") {
                                    if (createVector(check.x, testPos.y).dist(createVector(check.x, check.y)) < TILESIZE) {
                                        collision = true;
                                        break;
                                    }
                                }
                                if (check.dir == "left" || check.dir == "right") {
                                    if (createVector(testPos.x, check.y).dist(createVector(check.x, check.y)) < TILESIZE) {
                                        collision = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                if (!collision) {
                    this.pos = testPos;
                } else {
                    break;
                }
            }
        } else {
            this.pos.add(movement);
            let chunk = testMap.chunks[chunkPos.x + "," + chunkPos.y];
            for (let j = 0; j < chunk.objects.length; j++) {
                if (chunk.objects[j].z == 2) {
                    let d = chunk.objects[j].pos.dist(this.pos);
                    if (d * 2 < (chunk.objects[j].size.w + chunk.objects[j].size.h) / 2 + 29) {
                        if (chunk.objects[j].objName == "Door") {
                            if (chunk.objects[j].alpha == 255) {
                                this.pos = oldPos;
                            }
                        } else {
                            this.pos = oldPos;
                        }
                    }
                }
            }
            for (let i = 0; i < collisionChecks.length; i++) {
                let check = collisionChecks[i];
                if (check.val == -1) this.pos = oldPos;
                if (check.val2 > 0 || check.iron_val2 > 0) {
                    if (check.dir == "up" || check.dir == "down") {
                        if (createVector(check.x, this.pos.y).dist(createVector(check.x, check.y)) < TILESIZE) this.pos.y = oldPos.y;
                    }
                    if (check.dir == "left" || check.dir == "right") {
                        if (createVector(this.pos.x, check.y).dist(createVector(check.x, check.y)) < TILESIZE) this.pos.x = oldPos.x;
                    }
                }
            }
        }
        if (this.moving) {
            this.animationFrame += (1 / 7);
            this.currentFrame = 1 + (this.animationFrame) % 4;
            if (this.currentFrame >= 4) this.currentFrame = 2;
        } else if (this.animationType != "") {
            switch (this.animationType) {
                case "put": { this.currentFrame = 4; } break;
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
        this.vel = createVector(0, 0);
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