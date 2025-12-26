const BASE_STATS = [
    {
        "name": "gnome",
        "hp": 100,
        "mhp": 100,
        "healthRegen": 0.2,
        "attack": 2,
        "magic": 1,
        "mp": 100,
        "mmp": 100,
        "magicResistance": 2,
        "luck": 10,
        "credit": 1,
        "hearing": 1,
        "speakingRange": 2,
        "Fear": 1,
        "powerLevel": 1,
        "handDigSpeed": 0.05,
        "runningSpeed": 1.3,
        "growth": {
            "hp": 10,
            "mhp": 10,
            "attack": 2,
            "magic": 0.5,
            "healthRegen": 0.05,
            "mp": 1,
            "mmp": 1,
            "magicResistance": 0.2,
            "luck": 1,
            "runningSpeed":.05
        }
    },
    {
        "name": "aylah",
        "hp": 100,
        "mhp": 100,
        "healthRegen": 0.1,
        "attack": 1,
        "magic": 5,
        "mp": 150,
        "mmp": 150,
        "magicResistance": 5,
        "luck": 1,
        "credit": 1,
        "hearing": 5,
        "speakingRange": 1,
        "Fear": 1,
        "powerLevel": 1,
        "handDigSpeed": 0.07,
        "runningSpeed": 1,
        "growth": {
            "hp": 5,
            "mhp": 5,
            "attack": 0.5,
            "magic": 2,
            "healthRegen": 0.02,
            "mp": 20,
            "mmp": 20,
            "magicResistance": 0.25,
            "luck": 0.5,
            "runningSpeed":.2
        }
    },
    {
        "name": "skizzard",
        "hp": 100,
        "mhp": 100,
        "healthRegen": 5,
        "attack": 1,
        "magic": 1,
        "mp": 100,
        "mmp": 100,
        "magicResistance": 1,
        "luck": 1,
        "credit": 1,
        "hearing": 5,
        "speakingRange": 1,
        "Fear": 2,
        "powerLevel": 1,
        "handDigSpeed": 0.08,
        "runningSpeed": 1.2,
        "growth": {
            "hp": 8,
            "mhp": 8,
            "attack": 0.5,
            "magic": 0.5,
            "healthRegen": 0.06,
            "mp": 10,
            "mmp": 10,
            "magicResistance": 0.1,
            "luck": 0.5,
            "runningSpeed":.11
        }
    }
];

class StatBlock{
    constructor(race, health){
        this.race = race;
        this.stats = JSON.parse(JSON.stringify(BASE_STATS[this.race]));
        if(health != undefined) this.stats.hp = health;
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 10;
    }

    setXP(amount) {
        this.xp += amount;

        while(this.xp >= this.xpNeeded) {
            //console.log("level up")

            this.xpNeeded = Math.floor(this.xpNeeded * 1.5);
            this.level++;
            this.xp =0
            socket.emit("update_player", {
                id: curPlayer.id,
                pos: curPlayer.pos,
                holding: curPlayer.holding,
                update_names: ["statBlock.level"],
                update_values: [curPlayer.statBlock.level]
            });


            // Apply growth per level
            const growth = BASE_STATS[this.race].growth;
            for (let key in growth) {
                if (this.stats[key] !== undefined) {
                    this.stats[key] += growth[key];

                    socket.emit("update_player", {
                        id: curPlayer.id,
                        pos: curPlayer.pos,
                        holding: curPlayer.holding,
                        update_names: ["stats." + key],
                        update_values: [curPlayer.statBlock.stats[key]]
                    });
                }
            }
        }

        //console.log("my xp currently", this.xp, "xp required", this.xpNeeded)
    }

    heal(amount) {
        this.stats.hp = this.stats.hp + amount;

        if(this.stats.hp > this.stats.mhp) {
            this.stats.hp = this.stats.mhp;
        }

        socket.emit("update_player", {
            id: curPlayer.id,
            pos: curPlayer.pos,
            holding: curPlayer.holding,
            update_names: ["stats.hp"],
            update_values: [this.stats.hp]
        });
    }

    // Regenerate mana over time
    regenMana(amount) {
        this.stats.mp = Math.min(this.stats.mp + amount, this.stats.mmp);
    }

    // Regenerate health over time
    regenHealth(amount) {
        this.stats.hp = Math.min(this.stats.hp + amount, this.stats.mhp);
    }
}