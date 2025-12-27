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

        this.spells = {
            combustion: { cooldown: 0, cooldownMax: 20, manaCost: 30, flashTimer: 0, particles: [] },
            forceField: { active: false, timer: 0, duration: 1200, cooldown: 0, cooldownMax: 20, manaCost: 40, bonusMR: 3, regenPerSec: 2.5 },
            meditate: { active: false, timer: 0, duration: 600, cooldown: 0, cooldownMax: 20, manaCost: 5, manaPerSec: 2.5 }
        };
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

        // Update dash state
        if (this.isDashing) {
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }

        if (this.spells.combustion.cooldown > 0) this.spells.combustion.cooldown--;
        if (this.spells.combustion.flashTimer > 0) this.spells.combustion.flashTimer--;
        if (this.spells.forceField.cooldown > 0) this.spells.forceField.cooldown--;
        if (this.spells.meditate.cooldown > 0) this.spells.meditate.cooldown--;

        // Update combustion particles
        if (this.spells.combustion.particles) {
            for (let i = this.spells.combustion.particles.length - 1; i >= 0; i--) {
                this.spells.combustion.particles[i].life--;
                if (this.spells.combustion.particles[i].life <= 0) {
                    this.spells.combustion.particles.splice(i, 1);
                }
            }
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

        //console.log(this.vel.heading());
        if(this.vel.heading() >= -80 && this.vel.heading() < 80){ //right
            collisionChecks.push(this.newCollisionPoint(1, 1, "right"));
            if (this.holding.w) {
                collisionChecks.push(this.newCollisionPoint(1, 2, "right"));
            }
            else {
                collisionChecks.push(this.newCollisionPoint(1, 0, "right"));
            }
        }
        if(this.vel.heading() >= 10 && this.vel.heading() < 170){ //down
            collisionChecks.push(this.newCollisionPoint(0, 1, "down"));
            collisionChecks.push(this.newCollisionPoint(1, 1, "down"));
        }
        if((this.vel.heading() >= 100 && this.vel.heading() <= 180) || (this.vel.heading() >= -180 && this.vel.heading() <= -100)){ //left
            collisionChecks.push(this.newCollisionPoint(0, 1, "left"));
            if (this.holding.w) {
                collisionChecks.push(this.newCollisionPoint(0, 2, "left"));
            }
            else {
                collisionChecks.push(this.newCollisionPoint(0, 0, "left"));
            }
        }
        if(this.vel.heading() >= -170 && this.vel.heading() < -10){ //up
            collisionChecks.push(this.newCollisionPoint(0, 1, "up"));
            collisionChecks.push(this.newCollisionPoint(1, 1, "up"));
        }



        let oldPos = this.pos.copy();

        // Apply movement with continuous collision detection
        // Break large movements into smaller steps to prevent tunneling
        let movement = this.vel.copy().mult(deltaTime/33);
        const maxStepSize = TILESIZE * 0.25; // Maximum step size per iteration (smaller for dash/high stats)
        const movementMag = movement.mag();
        
        if (movementMag > maxStepSize) {
            // Break into smaller steps for fast movement
            const steps = Math.ceil(movementMag / maxStepSize);
            const stepVec = movement.copy().div(steps);
            
            for (let step = 0; step < steps; step++) {
                let testPos = this.pos.copy().add(stepVec);
                let collision = false;
                
                // Check collisions at test position
                let testChunkPos = testMap.globalToChunk(testPos.x, testPos.y);
                let testChunk = testMap.chunks[testChunkPos.x + "," + testChunkPos.y];
                
                if (testChunk) {
                    // Check object collisions
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
                    
                    // Check wall collisions at test position
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
                
                // Only apply movement if no collision
                if (!collision) {
                    this.pos = testPos;
                } else {
                    // Stop movement on collision
                    break;
                }
            }
        } else {
            // Small movement - use original single-step logic
            this.pos.add(movement);
            
            // Handle collisions
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

        // Update the current frame for animation
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
            this.currentFrame = 0; // Reset to standing frame when not moving
        }

        this.vel = createVector(0, 0);

        if (this.spells.forceField.active) {
            this.spells.forceField.timer--;
            let amt = this.spells.forceField.regenPerSec * (deltaTime/30);
            this.statBlock.regenHealth(amt);
            if (this.spells.forceField.timer <= 0) {
                this.endForceField();
            }
        }

        if (this.spells.meditate.active) {
            // cancel meditation immediately if moving
            if (this.moving) {
                this.endMeditate();
            } else {
                this.spells.meditate.timer--;
                let m = this.spells.meditate.manaPerSec * (deltaTime/30);
                this.statBlock.regenMana(m);
                if (this.spells.meditate.timer <= 0) {
                    this.endMeditate();
                }
            }
        }
    }

    render() {
        //dont render players not in your chunks
        let chunkPos = testMap.globalToChunk(this.pos.x, this.pos.y);
        if (testMap.chunks[chunkPos.x + "," + chunkPos.y] == undefined) return;
        push();
        // Move relative to the camera
        translate(-camera.pos.x + width / 2, -camera.pos.y + height / 2);

        // Draw dash effect if dashing
        if (this.isDashing) {
            push();
            // Pulsing glow effect
            let glowSize = 80 + Math.sin(frameCount * 0.5) * 10;
            fill(100, 200, 255, 50);
            noStroke();
            ellipse(this.pos.x, this.pos.y, glowSize, glowSize);
            
            // Speed lines in direction of movement
            stroke(100, 200, 255, 150);
            strokeWeight(2);
            let lineLength = 30;
            if (this.direction === 'right') {
                for (let i = 0; i < 3; i++) {
                    line(this.pos.x - lineLength - i*10, this.pos.y + (i-1)*8, 
                         this.pos.x - 10 - i*10, this.pos.y + (i-1)*8);
                }
            } else if (this.direction === 'left') {
                for (let i = 0; i < 3; i++) {
                    line(this.pos.x + 10 + i*10, this.pos.y + (i-1)*8, 
                         this.pos.x + lineLength + i*10, this.pos.y + (i-1)*8);
                }
            } else if (this.direction === 'up') {
                for (let i = 0; i < 3; i++) {
                    line(this.pos.x + (i-1)*8, this.pos.y + lineLength + i*10, 
                         this.pos.x + (i-1)*8, this.pos.y + 10 + i*10);
                }
            } else if (this.direction === 'down') {
                for (let i = 0; i < 3; i++) {
                    line(this.pos.x + (i-1)*8, this.pos.y - 10 - i*10, 
                         this.pos.x + (i-1)*8, this.pos.y - lineLength - i*10);
                }
            }
            pop();
        }

        // Auras render only when a spell is active

        if (this.spells.forceField.active) {
            push();
            noFill();
            stroke(100, 255, 100, 150);
            strokeWeight(4);
            ellipse(this.pos.x, this.pos.y, 120, 120);
            pop();
        }

        if (this.spells.meditate.active) {
            push();
            noFill();
            stroke(180, 100, 255, 140);
            strokeWeight(2);
            let s = 90 + Math.sin(frameCount * 0.2) * 8;
            ellipse(this.pos.x, this.pos.y, s, s);
            pop();
        }

        if (this.spells.combustion.flashTimer > 0) {
            push();
            noFill();
            stroke(255, 120, 60, map(this.spells.combustion.flashTimer, 0, 30, 0, 180));
            strokeWeight(6);
            let s = map(this.spells.combustion.flashTimer, 0, 30, 180, 60);
            ellipse(this.pos.x, this.pos.y, s, s);
            pop();
        }

        // Combustion particles
        if (this.spells.combustion.particles && this.spells.combustion.particles.length > 0) {
            for (let p of this.spells.combustion.particles) {
                push();
                translate(p.x - camera.pos.x + (width / 2), p.y - camera.pos.y + (height / 2));
                let alpha = map(p.life, 0, 25, 0, 200);
                fill(100, 255, 100, alpha);
                noStroke();
                square(0, 0, p.size);
                pop();
            }
        }

        // Decide how far above the character we want the label
        // For a "larger z" effect, increase this from 40 to e.g. 60 or 80
        const yOffset = 60;

        // Prepare text
        textSize(16);
        textAlign(CENTER, CENTER);
        let nameText = this.name + " lvl_" + this.statBlock.level;

        // Measure text width to draw a background rectangle around it
        let textW = textWidth(nameText) + 10;  // some padding
        let textH = 20;                        // approximate line height

        // Draw background box behind the text
        rectMode(CENTER);
        fill(0, 150);   // semi-transparent black
        noStroke();
        rect(this.pos.x, this.pos.y - yOffset, textW, textH, 4); // last param 4 = corner radius

        
        // Use custom team color if player is in a team
        let displayColor = teamColors[this.color];
        if (this.teamId && window.allTeams && window.allTeams[this.teamId]) {
            displayColor = window.allTeams[this.teamId].color;
        }
        fill(displayColor.r, displayColor.g, displayColor.b);
        //bold text
        textStyle(BOLD);
        text(nameText, this.pos.x, this.pos.y - yOffset);
        textStyle(NORMAL);
        let raceName = races[this.race]
        // Select the correct image based on the direction and frame
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

        // Draw the character's image
        image(imageToRender, this.pos.x - 33.2, this.pos.y - 44.2, 66.2, 88.3, 0, 0, 29, 29); // Adjust size as needed

        this.renderHealthBar(); // Render health bar
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

    // Activate dash ability`
    // Dash mechanic: Hold Shift while moving to dash
    // - Costs: 20 mana
    // - Speed: 2.5x normal movement speed
    // - Duration: 0.5 seconds (15 frames)
    // - Cooldown: 2 seconds (60 frames)`
    // - Requirements: Must be moving and have enough mana
    activateDash() {
        // Check if can dash (not on cooldown, has mana, is moving)
        if (this.dashCooldown <= 0 && 
            !this.isDashing && 
            this.statBlock.stats.mp >= this.dashManaCost &&
            this.moving) {
            
            // Consume mana
            this.statBlock.useMana(this.dashManaCost);
            
            // Activate dash
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldown = this.dashCooldownMax;
            
            // Emit to server
            socket.emit("update_player", {
                id: this.id,
                pos: this.pos,
                holding: this.holding,
                update_names: ["stats.mp"],
                update_values: [this.statBlock.stats.mp]
            });
            
            //console.log('[Dash] Activated! MP:', this.statBlock.stats.mp);
            return true;
        }
        return false;
    }

    activateCombustion() {
        if (this.spells.combustion.cooldown <= 0 && this.statBlock.stats.mp >= this.spells.combustion.manaCost) {
            this.statBlock.useMana(this.spells.combustion.manaCost);

            // Create explosion object with damage and damage to nearby objects
            let origin = {
                pos: this.pos.copy(),
                size: { w: 100, h: 100 }
            };
            createExplosion(origin);

            // Create animated explosion visual effect
            spawnExplosion(this.pos.x, this.pos.y, 100, 100);

            // Generate animated healing particles (green, shorter aura)
            const explosionRadius = 80;
            for (let i = 0; i < 60; i++) {
                let angle = random(0, TWO_PI);
                let distance = random(0, explosionRadius);
                let x = this.pos.x + cos(angle) * distance;
                let y = this.pos.y + sin(angle) * distance;
                let size = random(15, 40);
                this.spells.combustion.particles.push({
                    x: x,
                    y: y,
                    size: size,
                    life: 25
                });
            }

            this.spells.combustion.cooldown = this.spells.combustion.cooldownMax;
            this.spells.combustion.flashTimer = 30;

            socket.emit("update_player", {
                id: this.id,
                pos: this.pos,
                holding: this.holding,
                update_names: ["stats.mp"],
                update_values: [this.statBlock.stats.mp]
            });
            return true;
        }
        return false;
    }

    activateForceField() {
        if (!this.spells.forceField.active && this.spells.forceField.cooldown <= 0 && this.statBlock.stats.mp >= this.spells.forceField.manaCost) {
            this.statBlock.useMana(this.spells.forceField.manaCost);
            this.spells.forceField.active = true;
            this.spells.forceField.timer = this.spells.forceField.duration;
            this.spells.forceField.cooldown = this.spells.forceField.cooldownMax;
            this.statBlock.stats.magicResistance += this.spells.forceField.bonusMR;
            socket.emit("update_player", {
                id: this.id,
                pos: this.pos,
                holding: this.holding,
                update_names: ["stats.mp", "stats.magicResistance"],
                update_values: [this.statBlock.stats.mp, this.statBlock.stats.magicResistance]
            });
            return true;
        }
        return false;
    }

    endForceField() {
        if (this.spells.forceField.active) {
            this.spells.forceField.active = false;
            this.statBlock.stats.magicResistance -= this.spells.forceField.bonusMR;
            socket.emit("update_player", {
                id: this.id,
                pos: this.pos,
                holding: this.holding,
                update_names: ["stats.magicResistance"],
                update_values: [this.statBlock.stats.magicResistance]
            });
        }
    }

    activateMeditate() {
        if (!this.spells.meditate.active && this.spells.meditate.cooldown <= 0 && this.statBlock.stats.mp >= this.spells.meditate.manaCost) {
            this.statBlock.useMana(this.spells.meditate.manaCost);
            this.spells.meditate.active = true;
            this.spells.meditate.timer = this.spells.meditate.duration;
            this.spells.meditate.cooldown = this.spells.meditate.cooldownMax;
            socket.emit("update_player", {
                id: this.id,
                pos: this.pos,
                holding: this.holding,
                update_names: ["stats.mp"],
                update_values: [this.statBlock.stats.mp]
            });
            return true;
        }
        return false;
    }

    endMeditate() {
        this.spells.meditate.active = false;
    }
}