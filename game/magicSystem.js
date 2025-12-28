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
        this.duration = 1200;
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
        this.duration = 600;
        this.manaPerSec = 2.5;
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
            // cancel meditation immediately if moving
            if (player.moving) {
                player.meditateActive = false;
                player.meditateTimer = 0;
            } else {
                player.meditateTimer--;
                let m = this.manaPerSec * (deltaTime/30);
                player.statBlock.regenMana(m);
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


const magicAbilities = [
    new DashAbility(),
    new CombustionAbility(),
    new ForceFieldAbility(),
    new MeditateAbility(),
    // Add more here
];

// Export for use in UI and player logic
window.magicAbilities = magicAbilities;
window.MagicAbility = MagicAbility;