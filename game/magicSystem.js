// magicSystem.js
// Modular magic system for Holes Client


class MagicAbility {
    constructor(name, type, manaCost, cooldown, desc, requiredLevel = 1) {
        this.name = name;
        this.type = type; // e.g. 'projectile', 'buff', 'heal', etc.
        this.manaCost = manaCost;
        this.cooldown = cooldown; // in frames
        this.desc = desc;
        this.requiredLevel = requiredLevel;
    }
    canActivate(player) {
        return player.statBlock.stats.mp >= this.manaCost && !this.isOnCooldown(player) && player.statBlock.level >= this.requiredLevel;
    }
    isOnCooldown(player) {
        if (!player.magicCooldowns) return false;
        return player.magicCooldowns[this.name] > 0;
    }
    activate(player, ...args) {

        if (!this.canActivate(player)) return false;
        player.statBlock.useMana(this.manaCost);
        if (!player.magicCooldowns) player.magicCooldowns = {};
        player.magicCooldowns[this.name] = this.cooldown;
        this.onActivate(player, ...args);
        return true;
    }
    update(player) {}
    render(player) {}
    onActivate(player, ...args) {}
}
class GoblinModeAbility extends MagicAbility {
    constructor() {
        super('GoblinMode', 'buff', 100, 1800, 'Lose no HP and no mana for 5 seconds.', 20);
    }
    onActivate(player) {
        player.goblinModeActive = true;
        player.goblinModeTimer = 300; // 5 seconds at 60fps
        if (typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["goblinModeActive", "goblinModeTimer", "stats.mp"],
                update_values: [true, 300, player.statBlock.stats.mp]
            });
        }
    }
    update(player) {
        if (player.goblinModeActive) {
            player.goblinModeTimer--;
            if (player.goblinModeTimer <= 0) {
                player.goblinModeActive = false;
                player.goblinModeTimer = 0;
            }
            if (typeof socket !== 'undefined') {
                socket.emit("update_player", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding,
                    update_names: ["goblinModeActive", "goblinModeTimer"],
                    update_values: [player.goblinModeActive, player.goblinModeTimer]
                });
            }
        }
    }
    render(player) {
        if (player.goblinModeActive) {
            push();
            stroke(0,255,0,180);
            strokeWeight(6);
            noFill();
            ellipse(player.pos.x, player.pos.y, 140, 140);
            pop();
        }
    }
}

// God Mode: All cooldowns but this one fail for X seconds (level), requires level 25
class GodModeAbility extends MagicAbility {
    constructor() {
        super('GodMode', 'buff', 0, 3600, 'All cooldowns but this one fail for X seconds (level).', 25);
    }
    onActivate(player) {
        player.godModeActive = true;
        player.godModeTimer = player.statBlock.level * 60; // X seconds, X = level
        if (typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["godModeActive", "godModeTimer"],
                update_values: [true, player.godModeTimer]
            });
        }
    }
    update(player) {
        if (player.godModeActive) {
            player.godModeTimer--;
            if (player.godModeTimer <= 0) {
                player.godModeActive = false;
                player.godModeTimer = 0;
            }
            if (typeof socket !== 'undefined') {
                socket.emit("update_player", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding,
                    update_names: ["godModeActive", "godModeTimer"],
                    update_values: [player.godModeActive, player.godModeTimer]
                });
            }
        }
    }
    render(player) {
        if (player.godModeActive) {
            push();
            stroke(255,255,0,180);
            strokeWeight(8);
            noFill();
            ellipse(player.pos.x, player.pos.y, 160, 160);
            pop();
        }
    }
}

// Life Drain: Heals you 1 mana per health taken, uses magic to make it stronger, requires level 10
class LifeDrainAbility extends MagicAbility {
    constructor() {
        super('LifeDrain', 'attack', 10, 120, 'Drain a little HP from an enemy and heal yourself for 1 mana per HP taken.', 10);
    }
    onActivate(player) {
        // Find nearest enemy player in range
        let best = null, bestDist = 120;
        if (typeof players !== 'undefined') {
            Object.values(players).forEach(p => {
                if (p && p.id !== player.id && p.pos && player.pos) {
                    let d = p.pos.dist(player.pos);
                    if (d < bestDist) {
                        best = p;
                        bestDist = d;
                    }
                }
            });
        }
        if (best) {
            let magic = player.statBlock.stats.magic || 1;
            let drain = Math.floor(3 + magic * 0.5);
            best.statBlock.stats.hp -= drain;
            if (best.statBlock.stats.hp < 0) best.statBlock.stats.hp = 0;
            player.statBlock.stats.mp += drain;
            if (typeof socket !== 'undefined') {
                socket.emit("update_player", {
                    id: best.id,
                    pos: best.pos,
                    holding: best.holding,
                    update_names: ["stats.hp"],
                    update_values: [best.statBlock.stats.hp]
                });
                socket.emit("update_player", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding,
                    update_names: ["stats.mp"],
                    update_values: [player.statBlock.stats.mp]
                });
            }
            if (typeof spawnFloatingText !== 'undefined') {
                spawnFloatingText(drain, best.pos.x, best.pos.y, "damage", false);
                spawnFloatingText(drain, player.pos.x, player.pos.y, "heal", false);
            }
        }
    }
}

// Cloak: Makes you invisible for 1 second per 2 mana, requires level 10
class CloakAbility extends MagicAbility {
    constructor() {
        super('Cloak', 'utility', 2, 300, 'Become invisible for 1 second per 2 mana spent.', 10);
    }
    onActivate(player) {
        let seconds = Math.floor(player.statBlock.stats.mp / 2);
        if (seconds < 1) seconds = 1;
        let manaCost = seconds * 2;
        if (player.statBlock.stats.mp < manaCost) return;
        player.statBlock.stats.mp -= manaCost;
        player.cloakActive = true;
        player.cloakTimer = seconds * 60;
        if (typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["cloakActive", "cloakTimer", "stats.mp"],
                update_values: [true, player.cloakTimer, player.statBlock.stats.mp]
            });
        }
    }
    update(player) {
        if (player.cloakActive) {
            player.cloakTimer--;
            if (player.cloakTimer <= 0) {
                player.cloakActive = false;
                player.cloakTimer = 0;
            }
            if (typeof socket !== 'undefined') {
                socket.emit("update_player", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding,
                    update_names: ["cloakActive", "cloakTimer"],
                    update_values: [player.cloakActive, player.cloakTimer]
                });
            }
        }
    }
    render(player) {
        if (player.cloakActive) {
            push();
            noFill();
            stroke(120,120,255,120);
            strokeWeight(3);
            ellipse(player.pos.x, player.pos.y, 100, 100);
            pop();
        }
    }
}

// Warp: Teleports you to a random chunk
class WarpAbility extends MagicAbility {
    constructor() {
        super('Warp', 'mobility', 30, 900, 'Teleport to a random place.', 1);
    }
    onActivate(player) {
        // Pick a random chunk in the map
        let maxChunkX = 5+player.statBlock.stats.magic, maxChunkY =  5+player.statBlock.stats.magic; // TODO: get from map size
        let cx = Math.floor(Math.random() * maxChunkX);
        let cy = Math.floor(Math.random() * maxChunkY);
        if (typeof teleportToChunk === 'function') {
            teleportToChunk(cx, cy);
        } else {
            // fallback: move player directly
            player.pos.x = cx * CHUNKSIZE * TILESIZE;
            player.pos.y = cy * CHUNKSIZE * TILESIZE;
            if (typeof socket !== 'undefined') {
                socket.emit("update_pos", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding
                });
            }
        }
        // Clear a small area around the player (safe zone)
        if (typeof dig === 'function' && typeof mine === 'function') {
            for (let y = -5; y < 5; y++) {
                for (let x = -5; x < 5; x++) {
                    dig(player.pos.x + x * TILESIZE, player.pos.y + y * TILESIZE, 1, false);
                    mine(player.pos.x + x * TILESIZE, player.pos.y + y * TILESIZE, 1, false);
                }
            }
        }
    }
}
// Dash Ability
class DashAbility extends MagicAbility {
    constructor() {
        super('Dash', 'mobility', 20, 60, 'Quickly dash in the direction you are moving.', 1);
    }
    onActivate(player) {
        player.isDashing = true;
        player.dashTimer = player.dashDuration;
        player.dashCooldown = player.dashCooldownMax;
        if (typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["stats.mp", "isDashing", "dashTimer", "dashCooldown"],
                update_values: [player.statBlock.stats.mp, true, player.dashTimer, player.dashCooldown]
            });
        }
    }
    update(player) {
        let changed = false;
        if (player.isDashing) {
            player.dashTimer--;
            if (player.dashTimer <= 0) {
                player.isDashing = false;
                changed = true;
            }
            changed = true;
        }
        if (player.dashCooldown > 0) {
            player.dashCooldown--;
            changed = true;
        }
        if (changed && typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["isDashing", "dashTimer", "dashCooldown"],
                update_values: [player.isDashing, player.dashTimer, player.dashCooldown]
            });
        }
    }
    render(player) {
        if (player.isDashing) {
            push();
            let glowSize = 80 + Math.sin(frameCount * 0.5) * 10;
            fill(100, 200, 255, 50);
            noStroke();
            ellipse(player.pos.x, player.pos.y, glowSize, glowSize);
            pop();
        }
    }
}

// Combustion Ability
class CombustionAbility extends MagicAbility {
    constructor() {
        super('Combustion', 'attack', 30, 750, 'Ignite enemies around you with a burst of fire damage.', 8);
        this.flashTimer = 0;
        this.particles = [];
    }
    onActivate(player) {
        // Sync explosion to all clients
        if (typeof socket !== 'undefined') {
            socket.emit('EXPLOSION', {
                x: player.pos.x,
                y: player.pos.y,
                w: 200,
                h: 200
            });
        }
        // Local visual (for instant feedback)
        let origin = { pos: player.pos.copy(), size: { w: 100, h: 100 } };
        if (typeof createExplosion !== 'undefined') createExplosion(origin);
        if (typeof spawnExplosion !== 'undefined') spawnExplosion(player.pos.x, player.pos.y, 200, 200);
        const explosionRadius = 180;
        let particles = [];
        for (let i = 0; i < 60; i++) {
            let angle = random(0, TWO_PI);
            let distance = random(0, explosionRadius);
            let x = player.pos.x + cos(angle) * distance;
            let y = player.pos.y + sin(angle) * distance;
            let size = random(15, 40);
            particles.push({ x, y, size, life: 25 });
        }
        player.flashTimer = 30;
        player.particles = particles;
        // --- Damage players in radius ---
        if (typeof players !== 'undefined') {
            const casterId = player.id;
            const damage = 40; // Set combustion damage here
            Object.values(players).forEach(p => {
                if (p && p.id !== casterId && p.pos && player.pos && p.statBlock && p.statBlock.stats) {
                    const dist = p.pos.dist(player.pos);
                    if (dist <= explosionRadius) {
                        p.statBlock.stats.hp -= damage;
                        // Clamp HP to 0
                        if (p.statBlock.stats.hp < 0) p.statBlock.stats.hp = 0;
                        // Sync damage to server
                        if (typeof socket !== 'undefined') {
                            socket.emit("update_player", {
                                id: p.id,
                                pos: p.pos,
                                holding: p.holding,
                                update_names: ["stats.hp"],
                                update_values: [p.statBlock.stats.hp]
                            });
                        }
                        // Optional: show floating text
                        if (typeof spawnFloatingText !== 'undefined') {
                            spawnFloatingText(damage, p.pos.x, p.pos.y, "damage", false);
                        }
                    }
                }
            });
        }
        if (typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["stats.mp", "flashTimer", "particles"],
                update_values: [player.statBlock.stats.mp, player.flashTimer, player.particles]
            });
        }
    }
    update(player) {
        let changed = false;
        if (player.flashTimer > 0) {
            player.flashTimer--;
            changed = true;
        }
        if (Array.isArray(player.particles)) {
            for (let i = player.particles.length - 1; i >= 0; i--) {
                player.particles[i].life--;
                if (player.particles[i].life <= 0) {
                    player.particles.splice(i, 1);
                    changed = true;
                }
            }
        }
        if (changed && typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["flashTimer", "particles"],
                update_values: [player.flashTimer, player.particles]
            });
        }
    }
    render(player) {
        if (player.flashTimer > 0) {
            push();
            noFill();
            stroke(255, 120, 60, map(player.flashTimer, 0, 30, 0, 180));
            strokeWeight(6);
            let s = map(player.flashTimer, 0, 30, 180, 60);
            ellipse(player.pos.x, player.pos.y, s, s);
            pop();
        }
        if (Array.isArray(player.particles)) {
            for (let p of player.particles) {
                push();
                translate(p.x - camera.pos.x + (width / 2), p.y - camera.pos.y + (height / 2));
                let alpha = map(p.life, 0, 25, 0, 200);
                fill(100, 255, 100, alpha);
                noStroke();
                square(0, 0, p.size);
                pop();
            }
        }
    }
}

// Force Field Ability
class ForceFieldAbility extends MagicAbility {
    constructor() {
        super('ForceField', 'buff', 40, 450, 'Create a protective barrier that blocks damage and projectiles.', 3);
        this.active = false;
        this.timer = 0;
        this.duration = 200;
        this.auraTimer = 0;
        this.bonusMR = 3;
    }
    onActivate(player) {
        if (!player.forcefieldActive) {
            this.active = true;
            this.timer = this.duration;
            this.auraTimer = this.duration;
            player.forcefieldActive = true;
            player.auraTimer = this.duration;
            player.statBlock.stats.magicResistance += this.bonusMR;
            if (typeof socket !== 'undefined') {
                socket.emit("update_player", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding,
                    update_names: ["stats.mp", "stats.magicResistance", "forcefieldActive", "auraTimer"],
                    update_values: [player.statBlock.stats.mp, player.statBlock.stats.magicResistance, true, this.duration]
                });
            }
        }
    }
    update(player) {
        if (player.forcefieldActive) {
            this.timer--;
            player.auraTimer = Math.max(0, player.auraTimer - 1);
            if (this.timer % 10 === 0) {
                let amt = ((player.statBlock.stats.magic * (deltaTime/30)) / 5) + 1;
                player.statBlock.regenHealth(amt);
            }
            if (this.timer <= 0) {
                this.active = false;
                player.forcefieldActive = false;
                player.auraTimer = 0;
                player.statBlock.stats.magicResistance -= this.bonusMR;
                if (typeof socket !== 'undefined') {
                    socket.emit("update_player", {
                        id: player.id,
                        pos: player.pos,
                        holding: player.holding,
                        update_names: ["stats.magicResistance", "forcefieldActive", "auraTimer"],
                        update_values: [player.statBlock.stats.magicResistance, false, 0]
                    });
                }
            }
        }
    }
    render(player) {
        if (player.forcefieldActive && player.auraTimer > 0) {
            push();
            noFill();
            stroke(100, 255, 100, 150);
            strokeWeight(4);
            ellipse(player.pos.x, player.pos.y, 120, 120);
            pop();
        }
    }
}

// Meditate Ability
class MeditateAbility extends MagicAbility {
    constructor() {
        super('Meditate', 'regen', 5, 1200, 'Channel magic to restore mana over time.', 14);
        this.active = false;
        this.timer = 0;
        this.duration = 300; // Halved duration
        this.manaPerSec = 2.5;
        // Listen for global cancel_magic event
        if (typeof window !== 'undefined') {
            window.addEventListener('cancel_magic', () => {
                if (window.curPlayer && window.curPlayer.meditateActive) {
                    window.curPlayer.meditateActive = false;
                    window.curPlayer.meditateTimer = 0;
                    window.curPlayer.meditateCancelFlag = false;
                }
            });
        }
    }
    onActivate(player) {
        if (!player.meditateActive) {
            player.meditateActive = true;
            player.meditateTimer = this.duration;
            if (typeof socket !== 'undefined') {
                socket.emit("update_player", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding,
                    update_names: ["stats.mp", "meditateActive", "meditateTimer"],
                    update_values: [player.statBlock.stats.mp, true, this.duration]
                });
            }
        }
    }
    update(player) {
        if (player.meditateActive) {
            // cancel meditation if moving or cancel flag set (input or damage)
            if (player.moving || player.meditateCancelFlag) {
                player.meditateActive = false;
                player.meditateTimer = 0;
                player.meditateCancelFlag = false;
            } else {
                player.meditateTimer--;
                let m = (this.manaPerSec * (deltaTime/30));
                player.statBlock.regenMana(m/5);
                if (player.meditateTimer <= 0) {
                    player.meditateActive = false;
                    player.meditateTimer = 0;
                }
            }
            if (typeof socket !== 'undefined') {
                socket.emit("update_player", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding,
                    update_names: ["meditateActive", "meditateTimer"],
                    update_values: [player.meditateActive, player.meditateTimer]
                });
            }
        }
    }
    render(player) {
        if (player.meditateActive) {
            push();
            noFill();
            stroke(180, 100, 255, 140);
            strokeWeight(2);
            let s = 90 + Math.sin(frameCount * 0.2) * 8;
            ellipse(player.pos.x, player.pos.y, s, s);
            pop();
        }
    }
}



// Arrow Circle Ability
class ArrowCircleAbility extends MagicAbility {
    constructor() {
        super('ArrowCircle', 'attack', 25, 600, 'Spawn a circle of arrows around you 3 times.', 8);
        this.repeatCount = 3;
        this.interval = 12; // frames between each circle
    }
    onActivate(player) {
        this._startArrowCircle(player);
    }
    _startArrowCircle(player) {
        player.arrowCircleActive = true;
        player.arrowCircleTimer = 0;
        player.arrowCircleRepeats = this.repeatCount;
        player.arrowCircleInterval = this.interval;
        player.arrowCircleOrigin = player.pos.copy();
        this._spawnArrowCircle(player);
        if (typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["arrowCircleActive", "arrowCircleTimer", "arrowCircleRepeats", "arrowCircleOrigin"],
                update_values: [true, 0, this.repeatCount, {x: player.pos.x, y: player.pos.y}]
            });
        }
    }
    _spawnArrowCircle(player) {
        const numArrows = 12;
        const radius = 40;
        for (let i = 0; i < numArrows; i++) {
            // arrows go outward from the circle in all directions
            let angle = (2 * Math.PI * i) / numArrows;
            let px = player.pos.x + Math.cos(angle) * radius;
            let py = player.pos.y + Math.sin(angle) * radius;
            let a = angle; // point outward (no + Math.PI)

            if (typeof createProjectile !== 'undefined') {
                let proj = createProjectile("Arrow", player.name || player.id, player.color, px, py, a, player);
                if (typeof projectiles !== 'undefined') projectiles.push(proj);
                // Add to correct chunk for rendering and updates
                if (typeof testMap !== 'undefined' && typeof testMap.globalToChunk === 'function' && typeof testMap.chunks === 'object') {
                    let chunkPos = testMap.globalToChunk(px, py);
                    let chunkKey = chunkPos.x + ',' + chunkPos.y;
                    if (testMap.chunks[chunkKey] && Array.isArray(testMap.chunks[chunkKey].projectiles)) {
                        testMap.chunks[chunkKey].projectiles.push(proj);
                    }
                }
            }
            if (typeof socket !== 'undefined') {
                socket.emit("new_proj", {
                    name: "Arrow",
                    ownerName: player.name || player.id,
                    color: player.color,
                    x: px,
                    y: py,
                    a: a
                });
            }
        }
    }
    update(player) {
        if (player.arrowCircleActive) {
            player.arrowCircleTimer++;
            if (player.arrowCircleTimer >= player.arrowCircleInterval) {
                player.arrowCircleTimer = 0;
                player.arrowCircleRepeats--;
                this._spawnArrowCircle(player);
                if (typeof socket !== 'undefined') {
                    socket.emit("update_player", {
                        id: player.id,
                        pos: player.pos,
                        holding: player.holding,
                        update_names: ["arrowCircleRepeats", "arrowCircleTimer"],
                        update_values: [player.arrowCircleRepeats, 0]
                    });
                }
            }
            if (player.arrowCircleRepeats <= 1) {
                player.arrowCircleActive = false;
                player.arrowCircleTimer = 0;
                player.arrowCircleRepeats = 0;
                if (typeof socket !== 'undefined') {
                    socket.emit("update_player", {
                        id: player.id,
                        pos: player.pos,
                        holding: player.holding,
                        update_names: ["arrowCircleActive", "arrowCircleRepeats", "arrowCircleTimer"],
                        update_values: [false, 0, 0]
                    });
                }
            }
        }
    }
    render(player) {
        if (player.arrowCircleActive) {
            push();
            noFill();
            stroke(120, 180, 255, 120);
            strokeWeight(2);
            ellipse(player.pos.x, player.pos.y, 90, 90);
            pop();
        }
    }
}

const magicAbilities = [
    new DashAbility(),
    new CombustionAbility(),
    new ForceFieldAbility(),
    new MeditateAbility(),
    new GoblinModeAbility(),
    new GodModeAbility(),
    new LifeDrainAbility(),
    new CloakAbility(),
    new WarpAbility(),
    new ArrowCircleAbility()
];

// Export for use in UI and player logic
window.magicAbilities = magicAbilities;
window.MagicAbility = MagicAbility;