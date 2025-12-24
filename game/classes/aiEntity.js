// AIEntity.js - AI-controlled Skizzards and Gnomes

const AINames = [
    "James", "Alexander", "Robert", "Michael", "William", "David", "Richard", "Joseph",
    "Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald",
    "Margaret", "Dorothy", "Elizabeth", "Jessica", "Jennifer", "Linda", "Barbara", "Susan",
    "Sarah", "Karen", "Nancy", "Alice", "Mary", "Catherine", "Helen", "Sandra"
];

const raceNames = {
    0: "Gnome",
    2: "Skizzard"
};

// AI Personalities
const AIPersonalities = [
    "aggressive",    // Attacks on sight, trash talks
    "cautious",      // Avoids conflict, friendly
    "curious",       // Investigates players, social
    "territorial"    // Defends areas, warns players
];

// Chat messages by personality and behavior
const AIChatMessages = {
    aggressive: {
        attack: ["Die SCUM!", "I'll crush you!", "Feel my wrath!", "Time to die!", "Come at me!"],
        idle: ["I'm waiting...", "Where is everyone?", "Boring...", "Need a fight!"],
        dig: ["Gotta get resources!", "Digging for treasure!", "This dirt won't mine itself!"],
        flee: ["You got lucky!", "I'll be back!", "Running for now...", "Retreat!"],
        encounter: ["Finally! A challenger!", "Let's fight!", "I see you there!"]
    },
    cautious: {
        attack: ["Please don't hurt me!", "Stop it!", "I don't want trouble!"],
        idle: ["Hello sir", "Nice day today...", "Just minding my business", "Peace to all"],
        dig: ["I'm just digging", "Mining some rocks", "Hard at work here"],
        flee: ["I'm outta here!", "See you later!", "Bye now!", "Gotta go!"],
        encounter: ["Oh, a traveler", "Hello there", "Nice to meet you"]
    },
    curious: {
        attack: ["Why are you attacking?", "That's not friendly!", "We could be friends!"],
        idle: ["Exploring around", "Wonder what's out there?", "Anybody home?", "Hello?"],
        dig: ["Found some materials!", "Digging is fun", "Precious metals!"],
        flee: ["That hurt!", "Okay okay, I'm leaving!", "My bad!"],
        encounter: ["Who are you?", "Want to chat?", "New friend?", "Heyyy!"]
    },
    territorial: {
        attack: ["This is MY territory!", "You shouldn't be here!", "Defend the area!"],
        idle: ["Patrolling the land", "All quiet here", "Keeping watch", "Mine to protect"],
        dig: ["Building up my base", "Strengthening defenses", "Gathering resources"],
        flee: ["Fall back! Fall back!", "Regroup!", "I'll return with reinforcements!"],
        encounter: ["You're trespassing!", "Leave this area!", "I'm watching you..."]
    }
};

// Global AI entities - MUST be defined before socket.js and sketch.js use it
var aiEntities = {};

class AIEntity {
    constructor(x, y, race, level, id, color = 0) {
        this.id = id; // Unique identifier from server
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.race = race; // 0 = gnome, 2 = skizzard
        // Generate name: "James the Gnome"
        let randomName = AINames[floor(random(AINames.length))];
        this.name = randomName + " the " + raceNames[race];
        this.color = color;
        this.statBlock = new StatBlock(this.race);
        this.statBlock.level = level;
        
        // Apply growth for current level
        for (let i = 1; i < level; i++) {
            const growth = BASE_STATS[this.race].growth;
            for (let key in growth) {
                if (this.statBlock.stats[key] !== undefined) {
                    this.statBlock.stats[key] += growth[key];
                }
            }
        }
        
        this.statBlock.stats.hp = this.statBlock.stats.mhp; // Full health on spawn
        
        // Inventory - AI entities have a starter kit
        this.invBlock = new InvBlock();
        this.initializeStarterKit();
        
        // Animation properties
        this.currentFrame = 0;
        this.direction = 'down';
        this.animationFrame = 0;
        this.animationType = "";
        
        // AI behavior properties - Goal-based system
        this.targetPlayer = null;
        this.targetPos = null;
        this.goal = null; // Long-term goal position
        this.behavior = "explore"; // explore, pursue_goal, chase, flee, attack, retreat
        this.behaviorTimer = 0;
        this.decisionInterval = random(60, 150); // Frames between behavior decisions
        this.visionRange = 2000; // How far AI can "see" players
        this.engageRange = 300; // Range to engage with combat
        this.shootInterval = random(45, 90); // Frames between shots (more aggressive)
        this.attackCooldown = 0;
        this.retreatTimer = 0; // Timer for retreat phase after attacking
        
        // Goal system
        this.goalReachDistance = 300; // Distance to consider goal reached
        this.goalChangeInterval = random(300, 600); // Frames before switching goals
        this.goalTimer = 0;
        
        // Flee behavior
        this.fleeThreshold = 0.25; // Flee if HP < 25%
        
        // Personality system
        this.personality = AIPersonalities[floor(random(AIPersonalities.length))];
        
        // Digging system
        this.digTimer = 0;
        this.digInterval = 0;
        this.isDigging = false;
        this.digCooldown = 0;
        this.digEnergy = 100;
        this.maxDigEnergy = 100;
        
        // Chat system
        this.lastChatTime = 0;
        this.chatCooldown = random(300, 800); // Frames between messages
        this.lastBehavior = "";
        
        // Complex behavior tracking
        this.recentEncounters = []; // Track recent player encounters
        this.fear = 0; // Fear level affects behavior
        this.aggression = this.personality === "aggressive" ? 1.5 : 0.8;
        this.regenTimer = 0;
        this.regenInterval = 3;
        
        // Shake effect
        this.shake = { intensity: 0, length: 0 };
        this.offset = createVector(0, 0);
        this.offVel = createVector(0, 0);
        
        // Moving state
        this.moving = false;
    }

    update(allPlayers) {
        // Don't update if player doesn't exist yet
        if (!curPlayer) return;

        // Update AI behavior
        this.updateBehavior(allPlayers);
        
        // Apply movement
        this.vel.mult(0.8); // Friction
        this.pos.add(this.vel);
        
        // Update animation
        this.updateAnimation();
        
        // Update regen
        this.updateRegen();
    }

    updateBehavior(allPlayers) {
        this.behaviorTimer++;
        this.goalTimer++;
        this.lastChatTime++;
        this.digCooldown--;
        
        // Regenerate dig energy slowly
        if (this.digEnergy < this.maxDigEnergy) {
            this.digEnergy += 0.1;
        }
        
        // Find closest target within vision range (players OR other AI entities)
        let closestTarget = null;
        let closestDist = this.visionRange;
        
        // Check all players
        for (let id in allPlayers) {
            let player = allPlayers[id];
            if (!player || !player.pos) continue;
            
            let dist = this.pos.dist(player.pos);
            if (dist < closestDist) {
                closestDist = dist;
                closestTarget = player;
            }
        }
        
        // Check all other AI entities
        for (let aiId in aiEntities) {
            let otherAI = aiEntities[aiId];
            if (!otherAI || !otherAI.pos || otherAI.id === this.id) continue;
            
            let dist = this.pos.dist(otherAI.pos);
            if (dist < closestDist) {
                closestDist = dist;
                closestTarget = otherAI;
            }
        }
        
        this.targetPlayer = closestTarget;
        
        // Update fear based on health
        let hpPercent = this.statBlock.stats.hp / this.statBlock.stats.mhp;
        this.fear = lerp(this.fear, max(0, (1 - hpPercent) * 2), 0.1);
        
        // Personality affects aggression
        if (this.personality === "aggressive") {
            this.fleeThreshold = 0.1; // More willing to fight
        } else if (this.personality === "cautious") {
            this.fleeThreshold = 0.6; // Flees earlier
        } else if (this.personality === "territorial") {
            this.fleeThreshold = 0.2; // Defends territory
        }
        
        // Priority-based behavior system with personality influence
        if (this.fear > 0.7 && this.targetPlayer) {
            // PRIORITY 1: Flee if very scared and can see enemy
            this.behavior = "flee";
            this.sayMessage("flee");
        } else if (this.targetPlayer && this.pos.dist(this.targetPlayer.pos) < this.engageRange) {
            // PRIORITY 2: Attack if player within engagement range (close-range attack phase)
            if (this.behavior !== "retreat" || this.retreatTimer <= 0) {
                this.behavior = "attack";
                if (this.lastBehavior !== "attack") {
                    this.sayMessage("attack");
                }
            }
        } else if (this.targetPlayer) {
            // PRIORITY 3: Chase player if visible
            this.behavior = "chase";
            if (this.lastBehavior !== "chase") {
                this.sayMessage("encounter");
            }
        } else {
            // PRIORITY 4: Explore or dig
            // Sometimes dig instead of just wandering - increased chance since AI is slower
            if (random() < 0.25 && this.digEnergy > 20 && this.digCooldown <= 0) {
                this.behavior = "dig";
                this.sayMessage("dig");
            } else {
                // Explore with goal-seeking
                if (!this.goal || this.goalTimer > this.goalChangeInterval || this.pos.dist(this.goal) < this.goalReachDistance) {
                    let angle = random(TWO_PI);
                    let distance = random(400, 800);
                    this.goal = p5.Vector.fromAngle(angle).mult(distance).add(this.pos);
                    this.goalTimer = 0;
                    this.goalChangeInterval = random(300, 600);
                }
                this.behavior = "pursue_goal";
                if (this.lastBehavior !== "pursue_goal" && random() < 0.05) {
                    this.sayMessage("idle");
                }
            }
        }
        
        // Execute behavior
        switch (this.behavior) {
            case "attack":
                this.executeAttackBehavior();
                break;
            case "retreat":
                this.executeRetreatBehavior();
                break;
            case "chase":
                this.executeChaseBehavior();
                break;
            case "flee":
                this.executeFleeBehavior();
                break;
            case "pursue_goal":
                this.pursuteGoal();
                break;
            case "dig":
                this.executeDigBehavior();
                break;
        }
        
        this.lastBehavior = this.behavior;
    }
    
    executeDigBehavior() {
        // Find ground nearby to dig
        let chunkPos = testMap.globalToChunk(this.pos.x, this.pos.y);
        
        if (testMap.chunks[chunkPos.x + "," + chunkPos.y] == undefined) return;
        
        // Pick a random spot nearby to dig
        if (this.digTimer <= 0) {
            let offsetX = floor(random(-2, 2));
            let offsetY = floor(random(-2, 2));
            this.digTimer = 30 + random(-10, 10);
            
            let digX = floor(this.pos.x / TILESIZE) - (chunkPos.x * CHUNKSIZE) + offsetX;
            let digY = floor(this.pos.y / TILESIZE) - (chunkPos.y * CHUNKSIZE) + offsetY;
            
            // Validate dig position
            if (digX >= 0 && digX < CHUNKSIZE && digY >= 0 && digY < CHUNKSIZE) {
                let dirtVal = testMap.chunks[chunkPos.x + "," + chunkPos.y].data[digX + digY * CHUNKSIZE];
                
                if (dirtVal > 0.3) {
                    // Dig this tile
                    let digAmount = 0.02 * this.statBlock.stats.digging * (this.digEnergy / this.maxDigEnergy);
                    testMap.chunks[chunkPos.x + "," + chunkPos.y].data[digX + digY * CHUNKSIZE] -= digAmount;
                    this.digEnergy -= 5;
                    
                    // Emit dig event to server
                    socket.emit("dig", {
                        cx: chunkPos.x,
                        cy: chunkPos.y,
                        x: digX,
                        y: digY,
                        amount: digAmount,
                        id: this.id
                    });
                }
            }
        } else {
            this.digTimer--;
        }
        
        // Stop digging if out of energy or enough time has passed
        if (this.digEnergy < 10 || this.digTimer < 0) {
            this.behavior = "pursue_goal";
            this.digCooldown = random(200, 400);
        }
        
        this.moving = false;
    }
    
    sayMessage(context) {
        // Send a chat message based on personality and behavior
        if (this.lastChatTime < this.chatCooldown) return;
        
        const messages = AIChatMessages[this.personality]?.[context] || AIChatMessages["cautious"][context];
        if (!messages || messages.length === 0) return;
        
        const message = messages[floor(random(messages.length))];
        this.lastChatTime = 0;
        this.chatCooldown = random(400, 1000);
        
        // Emit chat message to server with AI name in format: "x,y,name,message"
        socket.emit("send_message", `${this.pos.x},${this.pos.y},${this.name},${message}`);
    }
    
    executeAttackBehavior() {
        if (!this.targetPlayer) return;
        
        let distToTarget = this.pos.dist(this.targetPlayer.pos);
        let dirToTarget = p5.Vector.sub(this.targetPlayer.pos, this.pos);
        
        // Update direction
        if (abs(dirToTarget.x) > abs(dirToTarget.y)) {
            this.direction = dirToTarget.x > 0 ? 'right' : 'left';
        } else {
            this.direction = dirToTarget.y > 0 ? 'down' : 'up';
        }
        
        // Brain-like behavior: Move towards target to get in range
        if (distToTarget > this.engageRange * 0.8) {
            // Move closer to shooting range
            if (checkAICollision(this, this.direction)) {
                dirToTarget.setMag(BASE_SPEED * this.statBlock.stats.runningSpeed * 0.55 * (deltaTime / 30));
                this.vel.add(dirToTarget);
            }
            this.moving = true;
        } else {
            // In range - shoot and immediately switch to retreat
            this.attackCooldown--;
            if (this.attackCooldown <= 0) {
                // Occasionally taunt before attacking
                if (random() < 0.15) {
                    this.sayMessage("attack");
                }
                
                this.shootAtTarget();
                this.attackCooldown = this.shootInterval;
                
                // Switch to retreat after shooting (like Brain's "Space" state)
                this.behavior = "retreat";
                this.retreatTimer = 120; // Retreat for 120 frames
            }
            this.moving = false;
        }
    }

    executeRetreatBehavior() {
        if (!this.targetPlayer) {
            this.behavior = "pursue_goal";
            return;
        }
        
        this.retreatTimer--;
        
        let dirFromTarget = p5.Vector.sub(this.pos, this.targetPlayer.pos);
        let distToTarget = this.pos.dist(this.targetPlayer.pos);
        
        // Update direction to face away
        if (abs(dirFromTarget.x) > abs(dirFromTarget.y)) {
            this.direction = dirFromTarget.x > 0 ? 'right' : 'left';
        } else {
            this.direction = dirFromTarget.y > 0 ? 'down' : 'up';
        }
        
        // Back away from target (like Brain's space behavior)
        if (distToTarget < 100) {
            // Too close, back away faster
            if (checkAICollision(this, this.direction)) {
                dirFromTarget.setMag(BASE_SPEED * this.statBlock.stats.runningSpeed * 0.5 * (deltaTime / 30));
                this.vel.add(dirFromTarget);
            }
            // Prolong retreat if player gets too close
            this.retreatTimer = 60;
        } else if (distToTarget < 150) {
            // Keep moderate distance
            if (checkAICollision(this, this.direction)) {
                dirFromTarget.setMag(BASE_SPEED * this.statBlock.stats.runningSpeed * 0.4 * (deltaTime / 30));
                this.vel.add(dirFromTarget);
            }
        } else {
            // Far enough, reduce retreat timer faster
            this.retreatTimer -= 4;
        }
        
        this.moving = true;
        
        // When retreat timer expires, go back to attack/chase
        if (this.retreatTimer <= 0) {
            if (distToTarget < this.engageRange * 1.5) {
                this.behavior = "attack";
            } else {
                this.behavior = "chase";
            }
        }
    }

    executeChaseBehavior() {
        if (!this.targetPlayer) return;
        
        let dirToTarget = p5.Vector.sub(this.targetPlayer.pos, this.pos);
        let distToTarget = dirToTarget.mag();
        
        // Update direction
        if (abs(dirToTarget.x) > abs(dirToTarget.y)) {
            this.direction = dirToTarget.x > 0 ? 'right' : 'left';
        } else {
            this.direction = dirToTarget.y > 0 ? 'down' : 'up';
        }
        
        // Chase aggressively toward player - AI moves 55% of player speed
        if (checkAICollision(this, this.direction)) {
            dirToTarget.setMag(BASE_SPEED * this.statBlock.stats.runningSpeed * 0.55 * (deltaTime / 30));
            this.vel.add(dirToTarget);
        } else {
            // Path blocked, trigger digging instead of just slowing
            this.behavior = "dig";
            this.digCooldown = 0;
        }
        this.moving = true;
    }
    
    pursuteGoal() {
        if (!this.goal) return;
        
        let dirToGoal = p5.Vector.sub(this.goal, this.pos);
        let distToGoal = dirToGoal.mag();
        
        // Update direction
        if (abs(dirToGoal.x) > abs(dirToGoal.y)) {
            this.direction = dirToGoal.x > 0 ? 'right' : 'left';
        } else {
            this.direction = dirToGoal.y > 0 ? 'down' : 'up';
        }
        
        // Move toward goal if path is passable - AI moves 45% of player speed
        if (checkAICollision(this, this.direction)) {
            dirToGoal.setMag(BASE_SPEED * this.statBlock.stats.runningSpeed * 0.45 * (deltaTime / 30));
            this.vel.add(dirToGoal);
        } else {
            // Path blocked, try digging instead of immediately picking new goal
            if (this.digCooldown <= 0) {
                this.behavior = "dig";
                this.digCooldown = 0;
            } else {
                this.goal = null;
                this.goalTimer = 0;
            }
        }
        
        this.moving = distToGoal > 50; // Only mark as moving if not very close to goal
    }

    executeFleeBehavior() {
        if (!this.targetPlayer) return;
        
        let dirFromTarget = p5.Vector.sub(this.pos, this.targetPlayer.pos);
        
        if (dirFromTarget.mag() > 0) {
            // Update direction to face away
            if (abs(dirFromTarget.x) > abs(dirFromTarget.y)) {
                this.direction = dirFromTarget.x > 0 ? 'right' : 'left';
            } else {
                this.direction = dirFromTarget.y > 0 ? 'down' : 'up';
            }
            
            // Flee aggressively away from target - AI moves 60% of player speed when fleeing
            if (checkAICollision(this, this.direction)) {
                dirFromTarget.setMag(BASE_SPEED * this.statBlock.stats.runningSpeed * 0.6 * (deltaTime / 30));
                this.vel.add(dirFromTarget);
            } else {
                // Path blocked, try digging through wall or random direction
                if (this.digCooldown <= 0) {
                    this.behavior = "dig";
                    this.digCooldown = 0;
                } else {
                    let randAngle = random(TWO_PI);
                    let randDir = p5.Vector.fromAngle(randAngle);
                    dirFromTarget = randDir;
                    
                    if (checkAICollision(this, this.direction)) {
                        dirFromTarget.setMag(BASE_SPEED * this.statBlock.stats.runningSpeed * 0.45 * (deltaTime / 30));
                        this.vel.add(dirFromTarget);
                    } else {
                        this.vel.mult(0.5);
                    }
                }
            }
            
            this.moving = true;
        }
    }

    shootAtTarget() {
        if (!this.targetPlayer) return;
        
        // Determine which projectile to shoot based on race
        let projectileName = "Rock"; // Default
        if (this.race === 0) {
            // Gnome - uses ranged attack
            projectileName = random() < 0.5 ? "Rock" : "Fire Ball";
        } else if (this.race === 2) {
            // Skizzard - uses fire
            projectileName = "Fire Ball";
        }
        
        let dirToTarget = p5.Vector.sub(this.targetPlayer.pos, this.pos);
        
        // Create projectile using the standard createProjectile function
        let proj = createProjectile(
            projectileName,
            this.name,
            this.color,
            this.pos.x,
            this.pos.y,
            dirToTarget.heading()
        );
        
        // Add to appropriate chunk
        let chunkPos = testMap.globalToChunk(this.pos.x, this.pos.y);
        if (testMap.chunks[chunkPos.x + "," + chunkPos.y]) {
            testMap.chunks[chunkPos.x + "," + chunkPos.y].projectiles.push(proj);
        }
        
        // Emit to server
        socket.emit("new_proj", proj);
    }

    updateAnimation() {
        if (this.moving) {
            this.animationFrame += (1 / 7);
            this.currentFrame = 1 + (this.animationFrame) % 4;
            if (this.currentFrame >= 4) this.currentFrame = 2;
        } else if (this.animationType != "") {
            switch (this.animationType) {
                case "put": {
                    this.currentFrame = 4;
                }
                break;
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

    updateRegen() {
        this.regenTimer += 0.05;
        
        if (this.regenTimer >= this.regenInterval) {
            // HP Regen
            let mhp = this.statBlock.stats.mhp;
            if (this.statBlock.stats.hp < mhp) {
                let regenAmount = this.statBlock.stats.regen || 1;
                this.statBlock.stats.hp = Math.min(this.statBlock.stats.hp + regenAmount, mhp);
            }
            
            // MP Regen
            let mmp = this.statBlock.stats.mmp;
            if (this.statBlock.stats.mp < mmp) {
                let mpRegen = this.statBlock.stats.magic || 1;
                this.statBlock.stats.mp = Math.min(this.statBlock.stats.mp + mpRegen, mmp);
            }
            
            this.regenTimer = 0;
            this.regenInterval = random(4, 5);
        }
    }

    render() {
        // Skip rendering if player doesn't exist
        if (!curPlayer) return;
        
        push();
        
        // Handle shake effect
        if (this.shake.length > 0) {
            if (this.offVel.mag() < 1) {
                this.offVel.x = this.shake.intensity;
            }
            this.offVel.setMag(this.offVel.mag() + this.shake.intensity);
            if (this.offVel.mag() > this.shake.intensity * 5) {
                this.offVel.setMag(this.shake.intensity * 5);
            }
            this.offVel.rotate(random(0, 360));
            this.shake.length -= 1;
        } else {
            this.shake.intensity = 0;
            this.offVel.x = -1 * this.offset.x;
            this.offVel.y = -1 * this.offset.y;
            this.offVel.setMag(this.offVel.mag() / 10);
        }
        this.offset.add(this.offVel);
        
        // Translate to screen position
        translate(-camera.pos.x + width / 2, -camera.pos.y + height / 2);
        
        // Render name and level with personality indicator
        const yOffset = 60;
        textSize(16);
        textAlign(CENTER, CENTER);
        
        // Add personality emoji to name
        let personalityEmoji = this.personality === "aggressive" ? "⚔️" :
                              this.personality === "cautious" ? "🛡️" :
                              this.personality === "curious" ? "👁️" :
                              "🚩"; // territorial
        
        let nameText = personalityEmoji + " " + this.name + " lvl_" + this.statBlock.level;
        let textW = textWidth(nameText) + 10;
        let textH = 20;
        
        // Color code by personality
        let nameColor = this.personality === "aggressive" ? { r: 255, g: 0, b: 0 } :
                       this.personality === "cautious" ? { r: 100, g: 200, b: 255 } :
                       this.personality === "curious" ? { r: 255, g: 200, b: 0 } :
                       { r: 180, g: 0, b: 180 }; // territorial
        
        rectMode(CENTER);
        fill(0, 150);
        noStroke();
        rect(this.pos.x, this.pos.y - yOffset, textW, textH, 4);
        
        // Name text with personality color
        stroke(0);
        strokeWeight(2);
        fill(nameColor.r, nameColor.g, nameColor.b);
        text(nameText, this.pos.x, this.pos.y - yOffset);
        
        // Get sprite image
        let raceName = races[this.race];
        let imageToRender;
        
        if (this.direction === 'up') {
            imageToRender = raceImages[raceName].back[floor(this.currentFrame)];
        } else if (this.direction === 'down') {
            imageToRender = raceImages[raceName].front[floor(this.currentFrame)];
        } else if (this.direction === 'left') {
            imageToRender = raceImages[raceName].left[floor(this.currentFrame)];
        } else if (this.direction === 'right') {
            imageToRender = raceImages[raceName].right[floor(this.currentFrame)];
        }
        
        // Draw sprite with offset
        image(imageToRender, this.pos.x + this.offset.x - 33.2, this.pos.y + this.offset.y - 44.2, 66.2, 88.3, 0, 0, 29, 29);
        
        // Render health bar
        this.renderHealthBar();
        
        pop();
    }

    renderHealthBar() {
        push();
        
        // Set stroke and stroke weight for the outline
        stroke(0);
        strokeWeight(2);
        
        // Draw the health bar background with rounded corners
        fill(255, 0, 0);
        rect(
            this.pos.x,
            this.pos.y + 40,
            32,
            6,
            3
        );
        
        // Calculate current health width
        let healthWidth = constrain(
            map(this.statBlock.stats.hp, 0, this.statBlock.stats.mhp, 0, 32),
            0,
            32
        );
        
        // Draw the health bar foreground
        noStroke();
        fill(0, 255, 0);
        rect(
            this.pos.x,
            this.pos.y + 40,
            healthWidth,
            6,
            3
        );
        
        // Draw dig energy bar if digging
        if (this.behavior === "dig") {
            fill(139, 90, 43); // Brown for dirt
            rect(
                this.pos.x,
                this.pos.y + 50,
                32,
                4,
                2
            );
            
            let digWidth = constrain(
                map(this.digEnergy, 0, this.maxDigEnergy, 0, 32),
                0,
                32
            );
            
            noStroke();
            fill(210, 180, 140); // Light brown
            rect(
                this.pos.x,
                this.pos.y + 50,
                digWidth,
                4,
                2
            );
        }
        
        // Draw fear indicator if scared
        if (this.fear > 0.3) {
            fill(255, 100, 100); // Red for fear
            rect(
                this.pos.x,
                this.pos.y + 55,
                32 * this.fear,
                3,
                1
            );
        }
        
        pop();
    }

    // Called when AI takes damage
    takeDamage(amount) {
        this.statBlock.stats.hp -= amount;
        this.shake.intensity = 5;
        this.shake.length = 10;
        
        if (this.statBlock.stats.hp <= 0) {
            this.die();
        }
    }

    die() {
        let chunkPos = testMap.globalToChunk(this.pos.x, this.pos.y);
        
        // Drop XP orb (larger, more visible)
        let xpAmount = floor(10 + (this.statBlock.level * 5)); // Scale XP by level
        let expOrb = createObject(
            "ExpOrb",
            this.pos.x + random(-20, 20),
            this.pos.y + random(-20, 20),
            0,
            0,
            `xp_orb_${Date.now()}_${random(1000000)}`,
            this.name
        );
        expOrb.id = random(1000000);
        
        // Set XP orb size based on XP amount - 2.5x larger for visibility
        expOrb.size.w = (xpAmount / 2);
        expOrb.size.h = (xpAmount / 2);
        
        if (testMap.chunks[chunkPos.x + "," + chunkPos.y]) {
            testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.push(expOrb);
            testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.sort((a,b) => a.z - b.z);
            
            socket.emit("new_object", {
                cx: chunkPos.x,
                cy: chunkPos.y,
                obj: expOrb
            });
        }
        
        // Drop inventory items in a single ItemBag
        let hasItems = false;
        let itemBag = null;
        
        for (let itemName in this.invBlock.items) {
            let item = this.invBlock.items[itemName];
            if (item && item.amount && item.amount > 0) {
                // Create ItemBag on first item
                if (!itemBag) {
                    itemBag = createObject(
                        "ItemBag",
                        this.pos.x + random(-30, 30),
                        this.pos.y + random(-30, 30),
                        0,
                        0,
                        `item_bag_${Date.now()}_${random(1000000)}`
                    );
                    hasItems = true;
                }
                
                // Add item to bag
                itemBag.invBlock.addItem(itemName, item.amount, false);
            }
        }
        
        // Drop the ItemBag if it has items
        if (hasItems && itemBag && testMap.chunks[chunkPos.x + "," + chunkPos.y]) {
            testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.push(itemBag);
            testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.sort((a,b) => a.z - b.z);
            
            socket.emit("new_object", {
                cx: chunkPos.x,
                cy: chunkPos.y,
                obj: itemBag
            });
        }
        
        // Notify server of AI death
        socket.emit("ai_entity_died", {
            id: this.id,
            pos: { x: this.pos.x, y: this.pos.y }
        });
    }
    
    initializeStarterKit() {
        // Give AI entities a basic starter kit
        if (this.race === 0) {
            // Gnome starter kit
            this.invBlock.addItem("Rock", 10, false);
            this.invBlock.addItem("Log", 3, false);
            this.invBlock.addItem("Basic Sword", 1, false);
        } else if (this.race === 2) {
            // Skizzard starter kit
            this.invBlock.addItem("Rock", 15, false);
            this.invBlock.addItem("Mushroom", 5, false);
            this.invBlock.addItem("Basic Sword", 1, false);
        }
    }
}

// Helper function for AI collision checking
function checkAICollision(entity, direction) {
    let chunkPos = testMap.globalToChunk(entity.pos.x, entity.pos.y);
    
    if (testMap.chunks[chunkPos.x + "," + chunkPos.y] == undefined) {
        return false; // Can't move, no chunk
    }

    let x = floor(entity.pos.x / TILESIZE) - (chunkPos.x * CHUNKSIZE);
    let y = floor(entity.pos.y / TILESIZE) - (chunkPos.y * CHUNKSIZE);
    
    let x2 = x;
    let y2 = y;

    if (direction == "up") {
        y2 -= 1;
    } else if (direction == "down") {
        y2 += 1;
    } else if (direction == "left") {
        x2 -= 1;
    } else if (direction == "right") {
        x2 += 1;
    }

    let chunkPos2 = { x: chunkPos.x, y: chunkPos.y };
    
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

    if (testMap.chunks[chunkPos2.x + "," + chunkPos2.y] == undefined) {
        return false; // Can't move, no chunk
    }

    let val = testMap.chunks[chunkPos.x + "," + chunkPos.y].data[x + y * CHUNKSIZE];
    let val2 = testMap.chunks[chunkPos2.x + "," + chunkPos2.y].data[x2 + y2 * CHUNKSIZE];

    // Can move if both values are below passable threshold (0.7)
    return (val < 0.7 && val2 < 0.7);
}
