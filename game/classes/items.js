/*
Item Dic is a full dictanary of every item that can exist, falling into one of these types:
    Simple - just an item
    Shovel - digs dirt
    Melee - does some slash
    Ranged - shoots some projectile
    Food - eat, and only heals
    Potion - eat, and does special things
    Equipment - wearables like armor and clothes
    Seed - makes a plant obj
*/

var itemImgPaths = [];
var itemImgCords = [];
var itemDic = {};
var craftOptions = [];

// Rarity labeling and colors (central enum + palette)
// white - basic wood, mushrooms, rocks
// blue  - easy to craft but time-gated (e.g., apple, basic sword/shovel)
// green - gems and hard-to-find resources
// gold  - philosopher's stone and super-rares (e.g., wizard staff)
const ItemRarity = Object.freeze({
    WHITE: 'white',
    BLUE: 'blue',
    GREEN: 'green',
    GOLD: 'gold'
});

const RARITY_RGB = {
    'white': [235, 235, 235],
    'blue':  [110, 180, 255],
    'green': [90, 220, 140],
    'gold':  [255, 205, 80]
};

function getItemRarity(name){
    return ITEM_RARITY[name] || ItemRarity.WHITE;
}
function getItemRarityRGB(rarity){
    return RARITY_RGB[rarity] || RARITY_RGB[ItemRarity.WHITE];
}
function rarityToCSS(rarity){
    const rgb = getItemRarityRGB(rarity);
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
function getItemRarityCSSByName(name){
    return rarityToCSS(getItemRarity(name));
}
// Expose for UI usage
if (typeof window !== 'undefined') {
    window.ItemRarity = ItemRarity;
    window.getItemRarity = getItemRarity;
    window.getItemRarityRGB = getItemRarityRGB;
    window.getItemRarityCSSByName = getItemRarityCSSByName;
}

// Explicit item → rarity overrides (defaults to white if not listed)
const ITEM_RARITY = {
    // Common basics
    "Rock": ItemRarity.WHITE,
    "Raw Metal": ItemRarity.WHITE,
    "Metal": ItemRarity.WHITE,
    "Log": ItemRarity.WHITE,
    "Arrow": ItemRarity.WHITE,
    "Mushroom": ItemRarity.WHITE,
    "Mushroom Fiber": ItemRarity.WHITE,
    "Acorn": ItemRarity.WHITE,
    "Mushroom Seed": ItemRarity.WHITE,
    "Dirt Ball": ItemRarity.WHITE,
    "Skizzard Tail": ItemRarity.WHITE,

    // Time-gated / early craftables
    "Apple": ItemRarity.BLUE,
    "Salad": ItemRarity.BLUE,
    "Roasted Tail": ItemRarity.BLUE,
    "Red Acorn": ItemRarity.BLUE,
    "Basic Shovel": ItemRarity.BLUE,
    "Better Shovel": ItemRarity.BLUE,
    "Pickaxe": ItemRarity.BLUE,
    "Basic Sword": ItemRarity.BLUE,
    "Bow": ItemRarity.BLUE,
    "CrossBow": ItemRarity.BLUE,
    "TriSling": ItemRarity.BLUE,
    "DirtBomb": ItemRarity.BLUE,
    "Map": ItemRarity.BLUE,

    // Hard to find
    "Gem": ItemRarity.GREEN,
    "Black Gem": ItemRarity.GREEN,
    "Tech": ItemRarity.GREEN,
    "Better Sword": ItemRarity.GREEN,
    "Scythe": ItemRarity.GREEN,
    "Laser Gun": ItemRarity.GREEN,
    "Compass": ItemRarity.GREEN,
    "Bomb": ItemRarity.GREEN,

    // Super rare / legendary
    "Philosopher's Stone": ItemRarity.GOLD,
    "Fire Staff": ItemRarity.GOLD,
    "Gem Sword": ItemRarity.GOLD,
    "Teleport Receiver": ItemRarity.GOLD,
    "Dirt Bag Upgrade": ItemRarity.GOLD,
    "God Shovel": ItemRarity.GOLD,
    "God's Scythe": ItemRarity.GOLD,
    "Evil Apple on Stick": ItemRarity.GOLD
};

defineShovel("Basic Shovel", [[4,4]], [1,["Log",1],["Rock",1]], 1, 100, 0.12, 3, 1, "A basic shovel for digging dirt",true);
defineShovel("Better Shovel", [[5,4]], [1,["Log",1],["Gem",2]], 1, 100, 0.18, 3, 1, "A better shovel for digging dirt",true);
defineShovel("God Shovel", [[6,4]], [1,["Rock",2],["Philosopher's Stone",2]], 1, 100, 0.3, 3, 1, "A godly shovel for digging dirt",true);
defineShovel("Pickaxe", [[1,4]], [1,["Log",2],["Rock",3]], 1, 100, 0.2, 3, 1, "A basic pickaxe for mining iron",true);

defineMelee("Mush Knife", [[4,3]], [1,["Mushroom",1],["Rock",1],["Mushroom Fiber",1]], 1, 100, 25, 5, 50, 60, 90, 30, false, "A basic knife",true);
defineMelee("Basic Sword", [[1,5]], [1,["Log",1],["Rock",3],["Mushroom Fiber",2]], 1, 100, 25, 5, 50, 60, 90, 30, false, "A basic sword for slashing",true);
defineMelee("Better Sword", [[2,5]], [1,["Log",2],["Rock",2],["Gem",5],["Mushroom Fiber", 3]], 1, 100, 10, 5, 50, 60, 90, 10, false, "A better sword for slashing",true);
defineMelee("Gem Sword", [[2,2]], [1,["Gem",3],["Philosopher's Stone",1],["Black Gem",2],["Tech",4]], 1, 100, 10, 5, 50, 60, 90, 10, false, "A Green sword for slashing, really really green",true);
defineMelee("Evil Apple on Stick", [[5,1]], [1,["Bad Apple",1],["Log",1]], 1, 100, 10, 5, 100, 60, 20, 10, false, "Now it'll bite your opponets",true);
defineMelee("Scythe", [[3,4]], [1,["Log",2],["Rock",4],["Mushroom Fiber",1]], 1, 100, 25, 5, 50, 150, 150, 120, false, "Just gotta make sure they are on the blade",true);
defineMelee("God's Scythe", [[3,4]], [], 1, 100, 200, 0, 100, 60, 150, 10, false, "Just gotta make sure they are on the blade",false);

defineRanged("Basic SlingShot", [[0,5]], [1,["Mushroom", 2]], 1, 100, 5, "Rock", "Rock", 10, 10, 60, false, "A basic slingshot for shooting",true);
defineRanged("Better SlingShot", [[0,5]], [1,["Mushroom", 2], ["Gem", 1]], 1, 100, 5, "Rock", "Rock", 10, 10, 60, false, "A better slingshot for shooting",true);
defineRanged("Dirt Ball", [[4,1]], [1,["Dirt", 5]], 1, 1, 5, "Dirt", "Dirt Ball", 10, 10, 60, false, "A ball of dirt to push people around",true);
defineRanged("Bomb", [[451,66]], [1,["Rock", 2], ["Black Gem", 2]], 1, 1, 5, "Bomb", "Bomb", 10, 10, 60, false, "A bomb you can throw",true);
defineRanged("DirtBomb", [[471,66]], [1,["Dirt", 5], ["Bomb", 1]], 1, 1, 5, "Dirt Bomb", "DirtBomb", 10, 10, 60, false, "A bomb that just makes dirt",true);
defineRanged("Fire Staff", [[6,1]], [1,["Log", 3],["Black Gem", 1],["Philosopher's Stone",1]], 1, 100, 5, "Fire Ball", "mana25", 20, 10, 60, true, "A staff that shoots fire",true);
defineRanged("Laser Gun", [[5,2]], [1,["Metal",3],["Rock",2], ["Tech", 2]], 1, 100, 5, "Laser", "mana15", 10, 10, 60, false, "A gun that shoots lasers",true);
defineRanged("Bow", [[6,0]], [1,["Log", 5],["Mushroom Fiber", 2]], 1, 100, 5, "Arrow", "Arrow", 3, 3, 30, false, "A bow",true);
defineRanged("CrossBow", [[2,1]], [1,["Log", 5], ["Rock", 1],["Mushroom Fiber", 1]], 1, 100, 5, "Arrow", "Arrow", 15, 10, 60, false, "A Cross bow",true);
defineRanged("TriSling", [[4,5]], [1,["Better SlingShot", 3]], 1, 100, 5, "Rock", "Rock", 3, 30, 60, false, "A handful of slingshots",true);

defineSimpleItem("Rock", [[2,4]], [], 1, "A rock for your slingshot",false);
defineSimpleItem("Raw Metal", [[1,3]], [], 1, "A cluster of metal, still needs to be heated",false);
defineSimpleItem("Metal", [[2,3]], [1,["Raw Metal", 1]], 1, "Some metalic scraps, good enough for crafting",false);
defineSimpleItem("Gem", [[1,2]], [], 1, "A pretty gem",false);
defineSimpleItem("Black Gem", [[5,0]], [], 1, "An explosive gem",false);
defineSimpleItem("Philosopher's Stone", [[0,4]], [], 1, "A gem with immense power flowing out of it",false);
defineSimpleItem("Log", [[6,2]], [], 1, "A wooden log",false);
defineSimpleItem("Tech", [[0,1]], [1,["Metal",1],["Gem",1]], 1, "Some piece of technology",true);
defineSimpleItem("Arrow", [[3,0]], [2,["Log", 1], ["Rock", 1]], 1, "An arrow",true);

defineFood("Apple", [[2,0]], [], 1, 100, 10, 0, "A juicy apple",false);
defineFood("Bad Apple", [[4,0]], [], 1, 100, 5, 5, "Looks like this apple would bite back",false);
defineFood("Mushroom", [[458,47]], [], 1, 100, 5, 10, "A tasty mushroom",false);
defineFood("Salad", [[5,5]], [1,["Mushroom",1],["Apple",1],["Log",1]], 1, 100, 20, 10, "A salad",true);
defineFood("Skizzard Tail", [[6,5]], [], 1, 100, 5, 5, "A raw tail",false);
defineFood("Roasted Tail", [[7,5]], [1,["Skizzard Tail", 1]], 1, 100, 30, 15, "A roasted tail",false);

defineSeed("Red Acorn", [[1,0]], [1,["Apple", 1]], 1, "AppleTree", 0.5, "Will grow into an apple tree",true);
defineSeed("Acorn", [[0,0]], [2,["Log", 1],["Mushroom Fiber",2]], 1, "Tree", 0.5, "Will grow into a tree",true);
defineSeed("Mushroom Seed", [[5,3]], [1,["Mushroom", 1]], 1, "Mushroom", 0.5, "Some mushroom spores",true);
defineSimpleItem("Mushroom Fiber", [[3,3]], [3,["Mushroom",1]], 1, "A stringy component of many tools",true);

function compassUse(x,y,mouseButton){}
defineCustomItem("Compass", [[1,1]], [1,["Metal", 1],["Tech", 1]], 1, 1, "A compass that points to the nearest player", compassUse, true);

function mapUse(x,y,mouseButton){}
defineCustomItem("Map", [[0,3]], [1,["Mushroom Fiber", 3],["Gem", 1]], 1, 1, "A map that shows where you are in x y cords", mapUse, true);

function teleportReceiverUse(x,y,mouseButton){
    if(gameState == "playing"){
        if(curPlayer.invBlock.useTimer <= 0){
            gameState = "teleport";
            knownPortals = [];
            socket.emit("get_portals", {cPos: testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y)});

            curPlayer.invBlock.useTimer = 10;
        }
    }
}
defineCustomItem("Teleport Receiver", [[3,5]], [1,["Metal", 1],["Tech", 2],["Philosopher's Stone",1]], 1, 1, "A teleport receiver that teleports you to any portals with a range", teleportReceiverUse, true);

function dirtBagUpgradeUse(x,y,mouseButton){
    if(curPlayer.invBlock.useTimer <= 0){
        maxDirtInv += 150;
        curPlayer.invBlock.decreaseAmount("Dirt Bag Upgrade", 1);
        curPlayer.invBlock.useTimer = 30;
    }
}
defineCustomItem("Dirt Bag Upgrade", [[3,1]], [1,["Mushroom Fiber", 7],["Philosopher's Stone", 1]], 1, 1, "+150 to dirt bag capacity", dirtBagUpgradeUse, true);


class SimpleItem{
    constructor(itemName, weight, durability, imgNum, desc){
        this.itemName = itemName;
        this.weight = weight;
        this.durability = durability; //can be used for other stuff such as spoiling
        this.maxDurability = durability;
        this.imgNum = imgNum;
        this.desc = desc;
        this.rarity = (itemDic[this.itemName] && itemDic[this.itemName].rarity) ? itemDic[this.itemName].rarity : ItemRarity.WHITE;
        this.rarityRGB = (itemDic[this.itemName] && itemDic[this.itemName].rarityRGB) ? itemDic[this.itemName].rarityRGB : getItemRarityRGB(this.rarity);

        this.offset = createVector(0,0);
        this.offVel = createVector(0,0); //offset velocity
        this.shake = {intensity: 0, length: 0};

        this.amount = 1;
        this.type = "Simple";
    }

    use(x,y,mouseButton){}

    renderInvWindow(x,y){
        push();
        translate(x,y);
        image(itemImgs[this.imgNum], 0,0);
        let rgb = this.rarityRGB || getItemRarityRGB(this.rarity);
        fill(rgb[0], rgb[1], rgb[2]);
        noStroke();
        text(this.amount + " " + this.itemName + "   " + this.amount*this.weight, 64, 0);
        pop();
    }

    renderName(x,y){
        let rgb = this.rarityRGB || getItemRarityRGB(this.rarity);
        fill(rgb[0], rgb[1], rgb[2]);
        noStroke();
        text(this.itemName + " x" + this.amount, x,y);
    }

    renderImage(x,y){
        image(itemImgs[this.imgNum][0], x+this.offset.x,y+this.offset.y, 60, 60);
        
        if(this.shake.length > 0){
            if(this.offVel.mag() < 1){
                this.offVel.x = this.shake.intensity;
            }
            this.offVel.setMag(this.offVel.mag()+this.shake.intensity);
            if(this.offVel.mag() > this.shake.intensity*5){
                this.offVel.setMag(this.shake.intensity*5);
            }
            this.offVel.rotate(random(45, 180));
            this.shake.length -= 1;
        }
        else{
            this.shake.intensity = 0;
            this.offVel.x = -1*this.offset.x;
            this.offVel.y = -1*this.offset.y;
            this.offVel.setMag(this.offVel.mag()/10);
        }
        this.offset.add(this.offVel);
    }

    getStats(){
        return [
            ["Durability", this.durability], 
            ["Weight", this.weight]
        ];
    }
}

class Shovel extends SimpleItem{
    constructor(itemName, weight, durability, imgNum, desc, digSpeed, digSize, range){
        super(itemName, weight, durability, imgNum, desc);
        this.digSpeed = digSpeed;
        this.digSize = digSize;
        this.range = range;

        this.type = "Shovel";
    }

    use(x,y,mouseButton){
        if(this.itemName == "Pickaxe"){
            playerMine(x, y, this.digSpeed);
            return;
        }
        //doesnt wait for useTimer, because it is a continuous action
        if(mouseButton == LEFT){ //dig dirt
            if (dirtInv < maxDirtInv - this.digSpeed) playerDig(x, y, this.digSpeed);
            else{
                dirtBagUI.shake = {intensity: dirtBagUI.shake.intensity + 0.01, length: 1};
                this.shake = {intensity: 1, length: 2};
            }
        }
        else if(mouseButton == RIGHT){ //place dirt
            if (dirtInv > this.digSpeed) playerDig(x, y, -this.digSpeed);
        }
        this.durability -= 0.01;
        if(this.durability <= 0){
            this.durability = this.maxDurability;
            curPlayer.invBlock.decreaseAmount(this.itemName, 1);
        }
    }

    getStats(){
        return [
            ["Durability", this.durability], 
            ["Weight", this.weight], 
            ["Dig Speed", this.digSpeed], 
            ["Dig Size", this.digSize], 
            ["Range", this.range]
        ];
    }
}

class Melee extends SimpleItem{
    constructor(itemName, weight, durability, imgNum, desc, damage, range, safeRange, angle, swingSpeed, magicBool){
        super(itemName, weight, durability, imgNum, desc);
        this.damage = damage;
        this.range = range;
        this.safeRange = range;
        this.angle = angle;
        this.swingSpeed = swingSpeed; //how many frames in between each swing
        this.magicBool = magicBool; //magic damage or nah

        this.type = "Melee";
    }

    use(x,y,mouseButton){
        if(curPlayer.invBlock.useTimer <= 0){
            let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
            let toMouse = createVector(x,y).sub(curPlayer.pos).setMag(50);
            // Slightly offset origin so the slash starts in front of the player
            let slashOriginX = curPlayer.pos.x + toMouse.x * 0.3;
            let slashOriginY = curPlayer.pos.y + toMouse.y * 0.3;
            let proj = createProjectile(this.itemName+" Slash", curPlayer.name, curPlayer.color, slashOriginX, slashOriginY, toMouse.heading());
            // Lock weapon overlay image to the item used at fire time
            if(itemDic[this.itemName]){
                proj.overlayImgIndex = itemDic[this.itemName].img;
                let overlaySize = 60;
                const typeHint = this.itemName.toLowerCase();
                if (typeHint.includes("sword") || typeHint.includes("scythe")) overlaySize = 70;
                else if (typeHint.includes("knife")) overlaySize = 50;
                proj.overlaySize = overlaySize;
            }
            // Apply player attack modifier to damage
            if(curPlayer.statBlock && curPlayer.statBlock.stats.attack){
                proj.damage += curPlayer.statBlock.stats.attack;
            }
            if(testMap.chunks[chunkPos.x+','+chunkPos.y] != undefined){
                testMap.chunks[chunkPos.x+','+chunkPos.y].projectiles.push(
                    proj
                );
                //tell the server you made a projectile
                socket.emit("new_proj", proj);
    
                let temp = new SoundObj("swing.wav", curPlayer.pos.x, curPlayer.pos.y);
                testMap.chunks[chunkPos.x+','+chunkPos.y].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "swing.wav", cPos: chunkPos, pos: {x: curPlayer.pos.x, y: curPlayer.pos.y}, id: temp.id});
                curPlayer.invBlock.useTimer = this.swingSpeed;
                this.durability -= 1;
                if(this.durability <= 0){
                    this.durability = this.maxDurability;
                    curPlayer.invBlock.decreaseAmount(this.itemName, 1);
                }
            }
        }
    }

    getStats(){
        return [
            ["Durability", this.durability], 
            ["Weight", this.weight], 
            ["Damage", this.damage], 
            ["Range", this.range], 
            ["Angle", this.angle], 
            ["Swing Speed", (1/this.swingSpeed).toFixed(3)]
        ];
    }
}

class Ranged extends SimpleItem{
    constructor(itemName, weight, durability, imgNum, desc, spread, projName, ammoName, fireRate, roundSize, reloadSpeed, manaCost, magicBool){
        super(itemName, weight, durability, imgNum, desc);
        this.spread = spread;
        this.projName = projName; //projectile name
        this.ammoName = ammoName; //item used for ammo
        this.fireRate = fireRate; //frames in between each bullet
        this.roundSize = roundSize; //how many bullets can be shot before reload
        this.reloadSpeed = reloadSpeed; //how many frames it takes to reload
        this.magicBool = magicBool; //magic damage or nah
        this.manaCost = manaCost;

        this.reloadBool = false;
        this.bulletsLeft = roundSize; //how many bullets left in a round
        this.type = "Ranged";
    }

    use(x,y,mouseButton){
        if(mouseButton == LEFT){
            if(curPlayer.invBlock.useTimer <= 0){
                if(this.bulletsLeft > 0){
                    if(curPlayer.invBlock.items[this.ammoName] != undefined || (this.ammoName == "mana" && curPlayer.statBlock.stats.mp >= this.manaCost)){ //if you have item used for ammo
                        //console.log("Shoot");
                        let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
                        let toMouse = createVector(x,y).sub(curPlayer.pos).setMag(50);
                        let proj = createProjectile(
                            this.projName, curPlayer.name, curPlayer.color,
                            curPlayer.pos.x + toMouse.x - 20,
                            curPlayer.pos.y + toMouse.y,
                            toMouse.heading()
                        )
                        // Apply player attack modifier to damage (use magic stat if magic weapon)
                        if(curPlayer.statBlock){
                            if(this.magicBool && curPlayer.statBlock.stats.magic){
                                proj.damage += curPlayer.statBlock.stats.magic;
                            } else if(!this.magicBool && curPlayer.statBlock.stats.attack){
                                proj.damage += curPlayer.statBlock.stats.attack;
                            }
                        }
                        testMap.chunks[chunkPos.x+','+chunkPos.y].projectiles.push(
                            proj
                        );
                        //tell the server you made a projectile
                        socket.emit("new_proj", proj);
                        this.bulletsLeft --;
                        if(this.ammoName != "mana") curPlayer.invBlock.decreaseAmount(this.ammoName, 1);
                        else curPlayer.statBlock.stats.mp -= this.manaCost;
                        curPlayer.invBlock.useTimer = this.fireRate;
                        if(this.ammoName != this.itemName){
                            this.durability -= 1;
                            if(this.durability <= 0){
                                this.durability = this.maxDurability;
                                curPlayer.invBlock.decreaseAmount(this.itemName, 1);
                            }
                        }
                        if(this.bulletsLeft <= 0){
                            if(curPlayer.invBlock.items[this.ammoName] != undefined){
                                curPlayer.invBlock.useTimer = this.reloadSpeed;
                                this.reloadBool = true;
                                this.bulletsLeft = this.roundSize;
                            }
                        }
                    }
                }
            }
        }
    }

    getStats(){
        return [
            ["Durability", this.durability], 
            ["Weight", this.weight], 
            ["Damage", projDic[this.projName].damage], 
            ["Spread", this.spread],
            ["Ammo Name", this.ammoName],
            ["Firerate", (1/this.fireRate).toFixed(3)],
            ["Round Size", this.roundSize],
            ["Reload Speed", (1/this.reloadSpeed).toFixed(3)]
        ];
    }
}

class Food extends SimpleItem{
    constructor(itemName, weight, durability, imgNum, desc, heal, manaRegen){
        super(itemName, weight, durability, imgNum, desc);
        this.heal = heal; //how much the food heals you
        this.manaRegen = manaRegen;
        this.eatWait = 60; //maybe make this variable? so BIGGER food items make you wait longer imbetween bites

        this.type = "Food";
    }

    use(x,y,mouseButton){
        //console.log("!!!!!!!",curPlayer.statBlock.stats.hp ,curPlayer.statBlock.stats.mhp )

        if(this.heal > 0){
            if(curPlayer.statBlock.stats.hp >=  curPlayer.statBlock.stats.mhp) {
                if(this.manaRegen == 0){
                    this.shake = {intensity: 1, length: 5};
                    return;
                }
            } else if(curPlayer.invBlock.useTimer <= 0){
                //play eat sound and send to server
                let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
                let temp = new SoundObj("eat.ogg", curPlayer.pos.x, curPlayer.pos.y);
                testMap.chunks[chunkPos.x+','+chunkPos.y].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "eat.ogg", cPos: chunkPos, pos: {x: curPlayer.pos.x, y: curPlayer.pos.y}, id: temp.id});
                
                curPlayer.statBlock.heal(this.heal);
                curPlayer.invBlock.useTimer = this.eatWait;
                curPlayer.invBlock.decreaseAmount(this.itemName, 1);
            }
        }
        if(this.manaRegen > 0){
            if(curPlayer.statBlock.stats.mp >= curPlayer.statBlock.stats.mmp) {
                this.shake = {intensity: 1, length: 5};
                return;
            } else if(curPlayer.invBlock.useTimer <= 0){
                //play eat sound and send to server
                let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
                let temp = new SoundObj("eat.ogg", curPlayer.pos.x, curPlayer.pos.y);
                testMap.chunks[chunkPos.x+','+chunkPos.y].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "eat.ogg", cPos: chunkPos, pos: {x: curPlayer.pos.x, y: curPlayer.pos.y}, id: temp.id});
                
                curPlayer.statBlock.stats.mp += this.manaRegen;
                curPlayer.invBlock.useTimer = this.eatWait;
                curPlayer.invBlock.decreaseAmount(this.itemName, 1);
            }
        }
    }

    getStats(){
        return [
            ["Durability", this.durability], 
            ["Weight", this.weight], 
            ["Heal", this.heal],
            ["Mana Regen", this.manaRegen]
        ];
    }
}

class Potion extends SimpleItem{
    constructor(itemName, weight, imgNum, statName, statBoost, time){
        super(itemName, weight, 100, imgNum);
        this.statName = statName; //which stat this equipment effects
        this.statBoost = statBoost; //percentage ex. (0.1 = +10%) (-0.5 = -50%)
        this.time = time; //how many seconds this effect lasts

        this.type = "Potion";
    }

    use(x,y,mouseButton){
        if(curPlayer.invBlock.useTimer <= 0){
            //console.log("Drink");
            curPlayer.invBlock.useTimer = 60;
            curPlayer.invBlock.decreaseAmount(this.itemName, 1);
        }
    }

    getStats(){
        return [
            ["Durability", this.durability], 
            ["Weight", this.weight]
        ];
    }
}

class Equipment extends SimpleItem{
    constructor(itemName, weight, durability, imgNum, desc, slot, defense, statName, statBoost){
        super(itemName, weight, durability, imgNum, desc);
        this.slot = slot; //what slot the armor should go in
        this.defense = defense; //how much defense it grants the wearer
        this.statName = statName; //which stat this equipment effects
        this.statBoost = statBoost; //percentage ex. (0.1 = +10%) (-0.5 = -50%)

        this.type = "Equipment";
    }

    use(x,y,mouseButton){
        if(curPlayer.invBlock.useTimer <= 0){
            //if the player has an item in the slot already, swap them
            if(curPlayer.invBlock.equiped[this.slot] != ""){
                curPlayer.invBlock.hotbarItem(curPlayer.invBlock.equiped[this.slot], curPlayer.invBlock.selectedHotBar);
            }
            else{
                curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar] = ""; //remove the item from the hotbar
            }
    
            curPlayer.invBlock.equipItem(this.itemName);

            curPlayer.invBlock.useTimer = 60;
        }
    }
}

class Seed extends SimpleItem{
    constructor(itemName, weight, durability, imgNum, desc, plantName, chance){
        super(itemName, weight, durability, imgNum, desc);
        this.plantName = plantName;
        this.chance = chance;

        this.type = "Seed";
    }

    use(x,y,mouseButton){
        //doesnt wait for useTimer, because it needs space to be placed
        if(ghostBuild && ghostBuild.openBool && renderGhost){
            let chunkPos = testMap.globalToChunk(x,y);
            let temp = createObject(this.plantName, ghostBuild.pos.x, ghostBuild.pos.y, ghostBuild.rot, curPlayer.color, curPlayer.id, curPlayer.name);
            testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.push(temp);
            testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.sort((a,b) => a.z - b.z);
            socket.emit("new_object", {
                cx: chunkPos.x, 
                cy: chunkPos.y, 
                obj: temp
            });

            curPlayer.animationCreate("put");
            socket.emit("update_player", {
                id: curPlayer.id,
                pos: curPlayer.pos,
                holding: curPlayer.holding,
                update_names: ["animationType", "animationFrame"],
                update_values: [curPlayer.animationType, curPlayer.animationFrame]
            });

            curPlayer.invBlock.decreaseAmount(this.itemName, 1);
        }
        else{
            this.shake = {intensity: 1, length: 5};
        }
    }
}

class CustomItem extends SimpleItem{
    constructor(itemName, weight, durability, imgNum, desc, useFunc){
        super(itemName, weight, durability, imgNum, desc);
        this.use = useFunc;

        this.type = "CustomItem";
    }
}

function createItem(name){
    if(itemDic[name] == undefined){
        throw new Error(`Object with name: ${name}, does not exist`);
    }
    else{
        if(itemDic[name].type == "SimpleItem"){
            return new SimpleItem(name, itemDic[name].weight, itemDic[name].durability, itemDic[name].img, itemDic[name].desc);
        }
        else if(itemDic[name].type == "Shovel"){
            return new Shovel(name, itemDic[name].weight, itemDic[name].durability, itemDic[name].img, itemDic[name].desc, itemDic[name].digSpeed, itemDic[name].digSize, itemDic[name].range);
        }
        else if(itemDic[name].type == "Melee"){
            return new Melee(name, itemDic[name].weight, itemDic[name].durability, itemDic[name].img, itemDic[name].desc, itemDic[name].damage, itemDic[name].range, itemDic[name].safeRange, itemDic[name].angle, itemDic[name].swingSpeed, itemDic[name].magicBool);
        }
        else if(itemDic[name].type == "Ranged"){
            return new Ranged(name, itemDic[name].weight, itemDic[name].durability, itemDic[name].img, itemDic[name].desc, itemDic[name].spread, itemDic[name].projName, itemDic[name].ammoName, itemDic[name].fireRate, itemDic[name].roundSize, itemDic[name].reloadSpeed, itemDic[name].manaCost, itemDic[name].magicBool);
        }
        else if(itemDic[name].type == "Food"){
            return new Food(name, itemDic[name].weight, itemDic[name].durability, itemDic[name].img, itemDic[name].desc, itemDic[name].heal, itemDic[name].manaRegen);
        }
        else if(itemDic[name].type == "Potion"){
            return new Potion(name, itemDic[name].weight, itemDic[name].img, itemDic[name].desc, itemDic[name].statName, itemDic[name].statBoost, itemDic[name].time);
        }
        else if(itemDic[name].type == "Equipment"){
            return new Equipment(name, itemDic[name].weight, itemDic[name].durability, itemDic[name].img, itemDic[name].desc, itemDic[name].slot, itemDic[name].defense, itemDic[name].statName, itemDic[name].statBoost);
        }
        else if(itemDic[name].type == "Seed"){
            return new Seed(name, itemDic[name].weight, itemDic[name].durability, itemDic[name].img, itemDic[name].desc, itemDic[name].plantName, itemDic[name].chance);
        }
        else if(itemDic[name].type == "CustomItem"){
            return new CustomItem(name, itemDic[name].weight, itemDic[name].durability, itemDic[name].img, itemDic[name].desc, itemDic[name].use);
        }
        else{
            //console.log(itemDic[name]);
            throw new Error(`Item type: ${itemDic[name].type}, does not exist.`);
        }
    }
}

//the most common parts of a define, so we don't have to keep editing all the defines
function defineItemSuper(type,name,imgSrc,cost,weight,durability,desc,inCraftList){
    checkParams(arguments, getParamNames(defineItemSuper), ["string","string","object","object","number","int","string","boolean"]);

    let imgNum = 0;
    for(let i = 0; i < imgSrc.length; i++){
        if(Number.isInteger(imgSrc[i][0])){ //assume cords were given
            if(imgSrc[i][0] < 10){ //if the first number is less than 10 assume this is from the item part of the atlas
                imgSrc[i][0] = imgSrc[i][0]*20;
                imgSrc[i][1] = 160 + (imgSrc[i][1]*20);
            }
            itemImgCords.push(imgSrc);
        }
        else{ //assume path was given
            if(!imgSrc[i].includes("images")){
                imgSrc[i] = "images/items/" + imgSrc[i];
            }
            if(!imgSrc[i].includes(".")){
                imgSrc[i] = imgSrc[i] + ".png";
            }
            itemImgPaths.push(imgSrc[i]);
            itemImgCords.push([-1,-1]); //add a dummy cord for this image
        }
        imgNum = itemImgCords.length - 1;
    }
    
    
    const rarity = getItemRarity(name);
    itemDic[name] = {
        type: type,
        name: name,
        img: imgNum,
        weight: weight,
        durability: durability,
        desc: desc,
        cost: cost,
        rarity: rarity,
        rarityRGB: getItemRarityRGB(rarity),
        rarityCSS: rarityToCSS(rarity)
    };

    if(inCraftList){
        craftOptions.push({type: type, itemName: name, imgNum: imgNum, cost: cost});
    }
}

/**
 * Creates a new lookup in itemDic for an object of type SimpleItem
 * @returns {SimpleItem} not an actual SimpleItem but all info needed for one
 * @param {string} name the name of the object
 * @param {Array} imgPaths an array of paths for any images this item will use
 * @param {Array} cost an array of things this item needs to be placed, can take in the names of items, or dirt, followed by how much ex. [["rock", 5],["dirt", 20]]
 * @param {number} weight how much the item weighs
 * @param {string} desc the description of the item
 * @param {boolean} inCraftList is this item craftable?
*/
function defineSimpleItem(name, imgPaths, cost, weight, desc, inCraftList){
    defineItemSuper("SimpleItem", name,imgPaths,cost,weight,1,desc,inCraftList);
}

/**
 * Creates a new lookup in itemDic for an object of type Shovel
 * @returns {Shovel} not an actual Shovel but all info needed for one
 * @param {string} name the name of the object
 * @param {Array} imgPaths an array of paths for any images this item will use
 * @param {Array} cost an array of things this item needs to be placed, can take in the names of items, or dirt, followed by how much ex. [["rock", 5],["dirt", 20]]
 * @param {number} weight how much the item weighs
 * @param {int} durability how many uses the item has left
 * @param {number} digSpeed how fast you affect the dirt your digging 0.065 is the average
 * @param {number} digSize not sure how this will work, but bigger number here should mean more effected dirt nodes
 * @param {int} range how far from the character the shovel will be able to dig
 * @param {string} desc the description of the item
*/
function defineShovel(name, imgPaths, cost, weight, durability, digSpeed, digSize, range, desc, inCraftList){
    defineItemSuper("Shovel", name,imgPaths,cost,weight,durability,desc,inCraftList);

    let paramNames = getParamNames(defineShovel);
    checkParams(
        [arguments[5], arguments[6], arguments[7]],
        [paramNames[5], paramNames[6], paramNames[7]],
        ["number","number","int"]
    );

    itemDic[name].digSpeed = digSpeed;
    itemDic[name].digSize = digSize;
    itemDic[name].range = range;
    
}

/**
 * Creates a new lookup in itemDic for an object of type Melee
 * @returns {Melee} not an actual Melee but all info needed for one
 * @param {string} name the name of the object
 * @param {Array} imgPaths an array of paths for any images this item will use
 * @param {Array} cost an array of things this item needs to be placed, can take in the names of items, or dirt, followed by how much ex. [["rock", 5],["dirt", 20]]
 * @param {number} weight how much the item weighs
 * @param {int} durability how many uses the item has left
 * @param {int} damage how much damage the weapon does
 * @param {int} range how far the weapon can hit
 * @param {int} angle how wide the weapon can hit
 * @param {int} swingSpeed how many frames between each swing
 * @param {boolean} magicBool if the weapon does magic damage
 * @param {string} desc the description of the item
*/
function defineMelee(name,imgPaths, cost, weight, durability, damage, knockback, range, safeRange, angle, swingSpeed, magicBool, desc, inCraftList){
    defineItemSuper("Melee", name, imgPaths, cost, weight, durability, desc, inCraftList);

    let paramNames = getParamNames(defineMelee);
    checkParams(
        [arguments[5], arguments[6], arguments[7], arguments[8], arguments[9], arguments[10], arguments[11]],
        [paramNames[5], paramNames[6], paramNames[7], paramNames[8], paramNames[9], paramNames[10], paramNames[11]],
        ["int","int","int","int","int","int","boolean"]
    );
    
    itemDic[name].damage = damage;
    itemDic[name].range = range;
    itemDic[name].safeRange = safeRange;
    itemDic[name].angle = angle;
    itemDic[name].swingSpeed = swingSpeed;
    itemDic[name].magicBool = magicBool;

    // Lifespan proportional to swing duration (seconds)
    // Use ~60% of swing time, with a small floor to stay visible
    const slashLifespan = Math.max(0.15, (swingSpeed / 60) * 0.6);
    defineMeleeProjectile(name+" Slash", 0, range, safeRange, angle, damage, knockback, slashLifespan, magicBool);
}

/**
 * Creates a new lookup in itemDic for an object of type Ranged
 * @returns {Ranged} not an actual Ranged but all info needed for one
 * @param {string} name the name of the object
 * @param {Array} imgPaths an array of paths for any images this item will use
 * @param {Array} cost an array of things this item needs to be placed, can take in the names of items, or dirt, followed by how much ex. [["rock", 5],["dirt", 20]]
 * @param {number} weight how much the item weighs
 * @param {int} durability how many uses the item has left
 * @param {int} spread how much the bullets spread
 * @param {string} projName the name of the projectile this will spawn
 * @param {string} ammoName the name of the item used for ammo
 * @param {int} fireRate how many frames between each bullet
 * @param {int} roundSize how many bullets before having to reload
 * @param {number} reloadSpeed how many seconds it takes to reload
 * @param {boolean} magicBool if the weapon does magic damage
 * @param {string} desc the description of the item
*/
function defineRanged(name, imgPaths, cost, weight, durability, spread, projName, ammoName, fireRate, roundSize, reloadSpeed, magicBool, desc, inCraftList){
    defineItemSuper("Ranged", name, imgPaths, cost, weight, durability, desc, inCraftList);
    
    let paramNames = getParamNames(defineRanged);
    checkParams(
        [arguments[5], arguments[6], arguments[7], arguments[8], arguments[9], arguments[10], arguments[11]],
        [paramNames[5], paramNames[6], paramNames[7], paramNames[8], paramNames[9], paramNames[10], paramNames[11]],
        ["int","string","string","int","int","number","boolean"]
    );

    if(ammoName.includes("mana")){
        itemDic[name].ammoName = "mana";
        itemDic[name].manaCost = parseInt(ammoName.substring(4));
    }
    else{
        itemDic[name].ammoName = ammoName;
        itemDic[name].manaCost = 0;
    }
    
    itemDic[name].spread = spread;
    itemDic[name].projName = projName;
    itemDic[name].fireRate = fireRate;
    itemDic[name].roundSize = roundSize;
    itemDic[name].reloadSpeed = reloadSpeed;
    itemDic[name].magicBool = magicBool;
}

/**
 * Creates a new lookup in itemDic for an object of type Food
 * @returns {Food} not an actual Food but all info needed for one
 * @param {string} name the name of the object
 * @param {Array} imgPaths an array of paths for any images this item will use
 * @param {Array} cost an array of things this item needs to be placed, can take in the names of items, or dirt, followed by how much ex. [["rock", 5],["dirt", 20]]
 * @param {number} weight how much the item weighs
 * @param {int} durability how many inv updates before this food spoils
 * @param {int} heal how much the food heals
 * @param {int} manaRegen how much the food regenerates mana
 * @param {string} desc the description of the item
*/
function defineFood(name, imgPaths, cost, weight, durability, heal, manaRegen, desc, inCraftList){
    defineItemSuper("Food", name, imgPaths, cost, weight, durability, desc, inCraftList);

    checkParams([arguments[5],arguments[6]],[getParamNames(defineFood)[5],getParamNames(defineFood)[6]],["int", "int"]);
    
    itemDic[name].heal = heal;
    itemDic[name].manaRegen = manaRegen;
}

/**
 * Creates a new lookup in itemDic for an object of type Potion
 * @returns {Potion} not an actual Potion but all info needed for one
 * @param {string} name the name of the object
 * @param {Array} imgPaths an array of paths for any images this item will use
 * @param {Array} cost an array of things this item needs to be placed, can take in the names of items, or dirt, followed by how much ex. [["rock", 5],["dirt", 20]]
 * @param {number} weight how much the item weighs
 * @param {string} statName the name of the stat this potion effects
 * @param {number} statBoost the percentage change in the stat
 * @param {int} time how long the effect lasts
 * @param {string} desc the description of the item
*/
function definePotion(name, imgPaths, cost, weight, statName, statBoost, time, desc, inCraftList){
    defineItemSuper("Potion", name, imgPaths, cost, weight, 1, desc, inCraftList);
    let paramNames = getParamNames(definePotion);
    checkParams(
        [arguments[4], arguments[5], arguments[6]],
        [paramNames[4], paramNames[5], paramNames[6]],
        ["string","number","int"]
    );
    
    itemDic[name].statName = statName;
    itemDic[name].statBoost = statBoost;
    itemDic[name].time = time;
}

/**
 * Creates a new lookup in itemDic for an object of type Equipment
 * @returns {Equipment} not an actual Equipment but all info needed for one
 * @param {string} name the name of the object
 * @param {Array} imgPaths an array of paths for any images this item will use
 * @param {Array} cost an array of things this item needs to be placed, can take in the names of items, or dirt, followed by how much ex. [["rock", 5],["dirt", 20]]
 * @param {number} weight how much the item weighs
 * @param {int} durability how many uses the item has left
 * @param {string} slot the slot this equipment goes in
 * @param {int} defense how much defense the equipment gives
 * @param {string} statName the name of the stat this equipment effects
 * @param {number} statBoost the percentage change in the stat
 * @param {string} desc the description of the item
*/
function defineEquipment(name, imgPaths, cost, weight, durability, slot, defense, statName, statBoost, desc, inCraftList){
    defineItemSuper("Equipment", name, imgPaths, cost, weight, durability, desc, inCraftList);
    let paramNames = getParamNames(defineEquipment);
    checkParams(
        [arguments[5], arguments[6], arguments[7], arguments[8]],
        [paramNames[5], paramNames[6], paramNames[7], paramNames[8]],
        ["string","int","string","number"]
    );
    
    itemDic[name].slot = slot;
    itemDic[name].defense = defense;
    itemDic[name].statName = statName;
    itemDic[name].statBoost = statBoost;
}

/**
 * Creates a new lookup in itemDic for an object of type Seed
 * @returns {Seed} not an actual Seed but all info needed for one
 * @param {string} name the name of the object
 * @param {Array} imgPaths an array of paths for any images this item will use
 * @param {Array} cost an array of things this item needs to be placed, can take in the names of items, or dirt, followed by how much ex. [["rock", 5],["dirt", 20]]
 * @param {number} weight how much the item weighs
 * @param {string} plantName the name of the plant this seed will grow
 * @param {number} chance the chance the plant will grow
 * @param {string} desc the description of the item
*/
function defineSeed(name, imgPaths, cost, weight, plantName, chance, desc, inCraftList){
    defineItemSuper("Seed", name, imgPaths, cost, weight, 1, desc, inCraftList);
    
    let paramNames = getParamNames(defineSeed);
    checkParams(
        [arguments[4], arguments[5]],
        [paramNames[4], paramNames[5]],
        ["string","number"]
    );
    
    itemDic[name].plantName = plantName;
    itemDic[name].chance = chance;
}

/**
 * Creates a new lookup in itemDic for an object of type CustomItem
 * @returns {CustomItem} not an actual CustomItem but all info needed for one
 * @param {string} name the name of the object
 * @param {Array} imgPaths an array of paths for any images this item will use
 * @param {Array} cost an array of things this item needs to be placed, can take in the names of items, or dirt, followed by how much ex. [["rock", 5],["dirt", 20]]
 * @param {number} weight how much the item weighs
 * @param {int} durability how many uses the item has left
 * @param {string} desc the description of the item
 * @param {function} useFunc the function that will be called when the item is used
 * @param {boolean} inCraftList is this item craftable?
*/
function defineCustomItem(name, imgPaths, cost, weight, durability, desc, useFunc, inCraftList){
    defineItemSuper("CustomItem", name, imgPaths, cost, weight, durability, desc, inCraftList);
    checkParams([arguments[6]],[getParamNames(defineFood)[6]],["function"]);

    itemDic[name].use = useFunc;
}