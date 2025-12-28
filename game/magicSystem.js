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
        // Emit to server
        if (typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["stats.mp"],
                update_values: [player.statBlock.stats.mp]
            });
        }
    }
    update(player) {
        if (player.isDashing) {
            player.dashTimer--;
            if (player.dashTimer <= 0) player.isDashing = false;
        }
        if (player.dashCooldown > 0) player.dashCooldown--;
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
        // Create explosion object with damage and damage to nearby objects
        let origin = { pos: player.pos.copy(), size: { w: 100, h: 100 } };
        if (typeof createExplosion !== 'undefined') createExplosion(origin);
        if (typeof spawnExplosion !== 'undefined') spawnExplosion(player.pos.x, player.pos.y, 200, 200);
        const explosionRadius = 180;
        for (let i = 0; i < 60; i++) {
            let angle = random(0, TWO_PI);
            let distance = random(0, explosionRadius);
            let x = player.pos.x + cos(angle) * distance;
            let y = player.pos.y + sin(angle) * distance;
            let size = random(15, 40);
            this.particles.push({ x, y, size, life: 25 });
        }
        this.flashTimer = 30;
        if (typeof socket !== 'undefined') {
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["stats.mp"],
                update_values: [player.statBlock.stats.mp]
            });
        }
    }
    update(player) {
        if (this.flashTimer > 0) this.flashTimer--;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].life--;
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
    }
    render(player) {
        if (this.flashTimer > 0) {
            push();
            noFill();
            stroke(255, 120, 60, map(this.flashTimer, 0, 30, 0, 180));
            strokeWeight(6);
            let s = map(this.flashTimer, 0, 30, 180, 60);
            ellipse(player.pos.x, player.pos.y, s, s);
            pop();
        }
        for (let p of this.particles) {
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
        if (!this.active) {
            this.active = true;
            this.timer = this.duration;
            this.auraTimer = this.duration;
            player.statBlock.stats.magicResistance += this.bonusMR;
            if (typeof socket !== 'undefined') {
                socket.emit("update_player", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding,
                    update_names: ["stats.mp", "stats.magicResistance"],
                    update_values: [player.statBlock.stats.mp, player.statBlock.stats.magicResistance]
                });
            }
        }
    }
    update(player) {
        if (this.active) {
            this.timer--;
            if (this.timer % 10 === 0) {
                let amt = ((player.statBlock.stats.magic * (deltaTime/30)) / 5) + 1;
                player.statBlock.regenHealth(amt);
            }
            if (this.timer <= 0) {
                this.active = false;
                player.statBlock.stats.magicResistance -= this.bonusMR;
                if (typeof socket !== 'undefined') {
                    socket.emit("update_player", {
                        id: player.id,
                        pos: player.pos,
                        holding: player.holding,
                        update_names: ["stats.magicResistance"],
                        update_values: [player.statBlock.stats.magicResistance]
                    });
                }
            }
            if (this.auraTimer > 0) this.auraTimer--;
        }
    }
    render(player) {
        if (this.active && this.auraTimer > 0) {
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
        if (!this.active) {
            this.active = true;
            this.timer = this.duration;
            if (typeof socket !== 'undefined') {
                socket.emit("update_player", {
                    id: player.id,
                    pos: player.pos,
                    holding: player.holding,
                    update_names: ["stats.mp"],
                    update_values: [player.statBlock.stats.mp]
                });
            }
        }
    }
    update(player) {
        if (this.active) {
            // cancel meditation immediately if moving
            if (player.moving) {
                this.active = false;
            } else {
                this.timer--;
                let m = this.manaPerSec * (deltaTime/30);
                player.statBlock.regenMana(m);
                if (this.timer <= 0) {
                    this.active = false;
                }
            }
        }
    }
    render(player) {
        if (this.active) {
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