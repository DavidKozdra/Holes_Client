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

// Rarity tiers and colors
const ItemRarity = Object.freeze({
    BASIC: 'basic',
    GOOD: 'good',
    GREAT: 'great',
    LEGENDARY: 'legendary',
    DEVIL: 'devil',
    GOD: 'god'
});

const RARITY_RGB = {
  basic:     [255, 255, 255], // white
  good:      [110, 180, 255],   // green
  great:     [90, 220, 140],   // blue
  legendary: [255, 215, 0],   // gold
  devil:     [138, 0, 0],     // BLOOD RED
  god:       [128, 0, 128],   // purple
};


function getItemRarityRGB(rarity){
    return RARITY_RGB[rarity] || RARITY_RGB[ItemRarity.BASIC];
}
function rarityToCSS(rarity){
    const rgb = getItemRarityRGB(rarity);
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
function getItemRarityCSSByName(name){
    if(itemDic[name] && itemDic[name].rarity){
        return rarityToCSS(itemDic[name].rarity);
    }
    return rarityToCSS(ItemRarity.BASIC);
}
// Expose for UI usage
if (typeof window !== 'undefined') {
    window.ItemRarity = ItemRarity;
    window.getItemRarityRGB = getItemRarityRGB;
    window.getItemRarityCSSByName = getItemRarityCSSByName;
}

defineShovel("Basic Shovel", [[4,4]], [1,["Log",1],["Rock",1]], 1, 100, 0.12, 3, 1, "A basic shovel for digging dirt", ItemRarity.GOOD, true);
defineShovel("Better Shovel", [[5,4]], [1,["Log",1],["Metal",2]], 1, 100, 0.18, 3, 1, "A better shovel for digging dirt", ItemRarity.GOOD, true);
defineShovel("God Shovel", [[6,4]], [1,["Metal",5],["Philosopher's Stone",4]], 1, 100, 0.3, 3, 1, "A godly shovel for digging dirt", ItemRarity.GOD, true);
defineShovel("Pickaxe", [[1,4]], [1,["Log",2],["Rock",3]], 1, 100, 0.2, 3, 1, "A basic pickaxe for mining iron", ItemRarity.GOOD, true);

defineMelee("Mush Knife", [[4,3]], [1,["Mushroom",1],["Rock",1],["Mushroom Fiber",1]], 1, 60, 8, 3, 50, 60, 80, 35, false, "A basic knife", ItemRarity.GOOD, true);
defineMelee("Basic Sword", [[1,5]], [1,["Log",1],["Rock",3],["Mushroom Fiber",2]], 1, 70, 15, 3, 45, 55, 75, 45, false, "A basic sword for slashing", ItemRarity.GOOD, true);
defineMelee("Better Sword", [[2,5]], [1,["Log",2],["Rock",2],["Metal",5],["Mushroom Fiber", 3]], 1, 120, 24, 25, 55, 65, 95, 22, false, "A better sword for slashing", ItemRarity.GREAT, true);
defineMelee("Gem Sword", [[2,2]], [1,["Gem",3],["Philosopher's Stone",1],["Black Gem",2],["Tech",4]], 1, 160, 45, 7, 65, 75, 105, 16, false, "A legendary sword for slashing, really really green", ItemRarity.LEGENDARY, true);
defineMelee("Evil Apple on Stick", [[5,1]], [1,["Bad Apple",1],["Log",1]], 1, 80, 20, 4, 90, 50, 25, 12, false, "Now it'll bite your opponets", ItemRarity.GREAT, true);
defineMelee("Scythe", [[3,4]], [1,["Log",2],["Rock",4],["Mushroom Fiber",1]], 1, 110, 25, 4, 60, 140, 140, 100, false, "Just gotta make sure they are on the blade", ItemRarity.GOOD, true);
defineMelee("God's Scythe", [[3,4]], [], 1, 100, 100, 0, 100, 60, 150, 10, false, "Just gotta make sure they are on the blade", ItemRarity.GOD, false);

defineRanged("Basic SlingShot", [[0,5]], [1,["Mushroom", 2]], 1, 100, 5, "Rock", "Rock", 10, 10, 60, false, "A basic slingshot for shooting", ItemRarity.GOOD, true);
defineRanged("Better SlingShot", [[0,5]], [1,["Mushroom", 2], ["Gem", 1]], 1, 100, 5, "Rock", "Rock", 10, 10, 60, false, "A better slingshot for shooting", ItemRarity.GREAT, true);
defineRanged("Dirt Ball", [[4,1]], [1,["Dirt", 5]], 1, 1, 5, "Dirt", "Dirt Ball", 10, 10, 60, false, "A ball of dirt to push people around", ItemRarity.BASIC, true);
defineRanged("Bomb", [[451,66]], [1,["Rock", 2], ["Black Gem", 2]], 1, 1, 5, "Bomb", "Bomb", 10, 10, 60, false, "A bomb you can throw", ItemRarity.GREAT, true);
defineRanged("DirtBomb", [[471,66]], [1,["Dirt", 5], ["Bomb", 1]], 1, 1, 5, "Dirt Bomb", "DirtBomb", 10, 10, 60, false, "A bomb that just makes dirt", ItemRarity.GOOD, true);
defineRanged("Fire Staff", [[6,1]], [1,["Log", 3],["Black Gem", 1],["Philosopher's Stone",1]], 1, 100, 5, "Fire Ball", "mana25", 20, 10, 60, true, "A staff that shoots fire", ItemRarity.LEGENDARY, true);
defineRanged("Laser Gun", [[5,2]], [1,["Metal",3],["Rock",2], ["Tech", 2]], 1, 100, 5, "Laser", "mana15", 10, 10, 60, false, "A gun that shoots lasers", ItemRarity.GREAT, true);
defineRanged("Bow", [[6,0]], [1,["Log", 5],["Mushroom Fiber", 2]], 1, 100, 5, "Arrow", "Arrow", 3, 3, 30, false, "A bow", ItemRarity.GOOD, true);
defineRanged("CrossBow", [[2,1]], [1,["Log", 5], ["Rock", 1],["Mushroom Fiber", 1]], 1, 100, 5, "Arrow", "Arrow", 15, 10, 60, false, "A Cross bow", ItemRarity.GOOD, true);
defineRanged("TriSling", [[4,5]], [1,["Better SlingShot", 3]], 1, 100, 5, "Rock", "Rock", 3, 30, 60, false, "A handful of slingshots", ItemRarity.GREAT, true);

defineSimpleItem("Rock", [[2,4]], [], 1, "A rock for your slingshot", ItemRarity.BASIC, false);
defineSimpleItem("Raw Metal", [[1,3]], [], 1, "A cluster of metal, still needs to be heated", ItemRarity.BASIC, false);
defineSimpleItem("Metal", [[2,3]], [1,["Raw Metal", 1]], 1, "Some metalic scraps, good enough for crafting", ItemRarity.BASIC, false);
defineSimpleItem("Gem", [[1,2]], [], 1, "A pretty gem", ItemRarity.GREAT, false);
defineSimpleItem("Black Gem", [[5,0]], [], 1, "An explosive gem", ItemRarity.GREAT, false);
defineSimpleItem("Philosopher's Stone", [[0,4]], [], 1, "A gem with immense power flowing out of it", ItemRarity.LEGENDARY, false);
defineSimpleItem("Log", [[6,2]], [], 1, "A wooden log", ItemRarity.BASIC, false);
defineSimpleItem("Tech", [[0,1]], [1,["Metal",1],["Gem",1]], 1, "Some piece of technology", ItemRarity.GREAT, true);
defineSimpleItem("Arrow", [[3,0]], [2,["Log", 1], ["Rock", 1]], 1, "An arrow", ItemRarity.BASIC, true);

defineFood("Apple", [[2,0]], [], 1, 100, 10, 0, "A juicy apple", ItemRarity.GOOD, false);
defineFood("Bad Apple", [[4,0]], [], 1, 100, 5, 5, "Looks like this apple would bite back", ItemRarity.GREAT, false);
defineFood("Mushroom", [[458,47]], [], 1, 100, 5, 10, "A tasty mushroom", ItemRarity.BASIC, false);
defineFood("Salad", [[5,5]], [1,["Mushroom",1],["Apple",1],["Log",1]], 1, 100, 50, 50, "A salad", ItemRarity.GOOD, true);
defineFood("Skizzard Tail", [[6,5]], [], 1, 100, 5, 5, "A raw tail", ItemRarity.BASIC, false);
defineFood("Roasted Tail", [[7,5]], [1,["Skizzard Tail", 1]], 1, 100, 30, 15, "A roasted tail", ItemRarity.GOOD, false);

// Increase seed outputs to make tree and mushroom farming less grindy
defineSeed("Red Acorn", [[1,0]], [2,["Apple", 1]], 1, "AppleTree", 0.5, "Will grow into an apple tree", ItemRarity.GOOD, true);
defineSeed("Acorn", [[0,0]], [2,["Log", 1],["Mushroom Fiber",2]], 1, "Tree", 0.5, "Will grow into a tree", ItemRarity.GOOD, true);
defineSeed("Mushroom Seed", [[5,3]], [3,["Mushroom", 1]], 1, "Mushroom", 0.5, "Some mushroom spores", ItemRarity.GOOD, true);
defineSimpleItem("Mushroom Fiber", [[3,3]], [3,["Mushroom",1]], 1, "A stringy component of many tools", ItemRarity.BASIC, true);

// Global compass state for display
var compassTarget = null;
var compassDuration = 300; // frames to show compass info (5 seconds at 60 fps)

function compassUse(x,y,mouseButton){
    if (!curPlayer || !players || typeof players !== 'object' || !testMap) {
        console.log('[Compass] No player data available');
        return;
    }
    
    // Get all nearby players (excluding yourself)
    const playerIds = Object.keys(players);
    const nearbyPlayers = [];
    
    for (let playerId of playerIds) {
        const player = players[playerId];
        if (player && player.pos && player.name && player.name !== curPlayer.name) {
            nearbyPlayers.push({ id: playerId, data: player });
        }
    }
    
    if (nearbyPlayers.length === 0) {
        console.log('[Compass] No other players nearby');
        compassTarget = null;
        // Show message to user
        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText("No players found", curPlayer.pos.x, curPlayer.pos.y - 50, "info", false);
        }
        return;
    }
    
    // Find the nearest player
    let nearest = null;
    let minDistance = Infinity;
    
    for (let entry of nearbyPlayers) {
        const p = entry.data;
        const d = dist(curPlayer.pos.x, curPlayer.pos.y, p.pos.x, p.pos.y);
        if (d < minDistance) {
            minDistance = d;
            nearest = entry;
        }
    }
    
    if (nearest) {
        const p = nearest.data;
        const dx = p.pos.x - curPlayer.pos.x;
        const dy = p.pos.y - curPlayer.pos.y;
        const angle = atan2(dy, dx);
        let angleDegrees = angle * 180 / PI;
        if (angleDegrees < 0) angleDegrees += 360;

        const chunk = testMap.globalToChunk(p.pos.x, p.pos.y);

        console.log(`[Compass] Nearest player: "${p.name}" - Distance: ${minDistance.toFixed(0)}px, Direction: ${angleDegrees.toFixed(0)}°`);
        
        // Store compass target for visual display
        compassTarget = {
            playerId: nearest.id,
            playerName: p.name,
            distance: minDistance,
            angle: angle,
            angleDegrees: angleDegrees,
            chunk: chunk,
            duration: compassDuration,
            maxDuration: compassDuration
        };
    }
}

function drawCompass(){
    if (!compassTarget) return;

    // Refresh target info if player still exists
    if (players && compassTarget.playerId && players[compassTarget.playerId] && players[compassTarget.playerId].pos) {
        const p = players[compassTarget.playerId];
        const dx = p.pos.x - curPlayer.pos.x;
        const dy = p.pos.y - curPlayer.pos.y;
        compassTarget.distance = dist(curPlayer.pos.x, curPlayer.pos.y, p.pos.x, p.pos.y);
        compassTarget.angle = atan2(dy, dx);
        compassTarget.angleDegrees = compassTarget.angle * 180 / PI;
        if (compassTarget.angleDegrees < 0) compassTarget.angleDegrees += 360;
        compassTarget.chunk = testMap.globalToChunk(p.pos.x, p.pos.y);
    }

    if (compassTarget.duration <= 0) {
        compassTarget = null;
        return;
    }

    compassTarget.duration--;
    const alpha = map(compassTarget.duration, 0, compassTarget.maxDuration, 60, 200);

    // Draw compass bezel
    const centerX = width / 2;
    const centerY = 80;
    const radius = 70;

    push();
    translate(centerX, centerY);
    stroke(255, 215, 0, alpha);
    strokeWeight(2);
    noFill();
    circle(0, 0, radius * 2);

    // Arrow
    rotate(compassTarget.angle);
    stroke(255, 215, 0, alpha);
    strokeWeight(4);
    line(0, 0, 0, -radius + 12);
    fill(255, 215, 0, alpha);
    noStroke();
    triangle(0, -radius - 6, -10, -radius + 10, 10, -radius + 10);
    pop();

    // Info label
    const chunkLabel = compassTarget.chunk ? `${compassTarget.chunk.x},${-compassTarget.chunk.y}` : "?";
    const labelY = centerY + 55;
    push();
    fill(0, 0, 0, alpha * 0.6);
    noStroke();
    rectMode(CENTER);
    rect(centerX, labelY + 20, 220, 65, 8);

    fill(255, 215, 0, alpha + 40);
    textAlign(CENTER);
    textSize(16);
    text(compassTarget.playerName, centerX, labelY);
    textSize(14);
    text(`${compassTarget.distance.toFixed(0)} px  •  ${compassTarget.angleDegrees.toFixed(0)}°`, centerX, labelY + 18);
    text(`Chunk ${chunkLabel}`, centerX, labelY + 36);
    pop();
}
defineCustomItem("Compass", [[1,1]], [1,["Metal", 1],["Tech", 1]], 1, 1, "A compass that points to the nearest player", compassUse, ItemRarity.GOOD, true);

function mapUse(x,y,mouseButton){}
defineCustomItem("Map", [[0,3]], [1,["Mushroom Fiber", 3],["Gem", 1]], 1, 1, "A map that shows where you are in x y cords", mapUse, ItemRarity.GOOD, true);

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
defineCustomItem("Teleport Receiver", [[3,5]], [1,["Metal", 1],["Tech", 2],["Philosopher's Stone",1]], 1, 1, "A teleport receiver that teleports you to any portals with a range", teleportReceiverUse, ItemRarity.LEGENDARY, true);

function dirtBagUpgradeUse(x,y,mouseButton){
    if(curPlayer.invBlock.useTimer <= 0){
        maxDirtInv += 150;
        // Keep server snapshot in sync so dirt capacity persists across reconnects
        curPlayer.maxDirtInv = maxDirtInv;
        if (typeof playerStateBatcher !== 'undefined' && playerStateBatcher) {
            playerStateBatcher.addUpdate('maxDirtInv', maxDirtInv);
            playerStateBatcher.setPosition(curPlayer.pos);
            playerStateBatcher.setHolding(curPlayer.holding);
        } else if (socket && socket.connected && curPlayer) {
            socket.emit('update_player', {
                id: curPlayer.id,
                pos: curPlayer.pos,
                holding: curPlayer.holding,
                update_names: ['maxDirtInv'],
                update_values: [maxDirtInv]
            });
        }
        curPlayer.invBlock.decreaseAmount("Dirt Bag Upgrade", 1);
        curPlayer.invBlock.useTimer = 30;
    }
}
defineCustomItem("Dirt Bag Upgrade", [[3,1]], [1,["Mushroom Fiber", 7],["Philosopher's Stone", 1]], 1, 1, "+150 to dirt bag capacity", dirtBagUpgradeUse, ItemRarity.LEGENDARY, true);


class SimpleItem{
    constructor(itemName, weight, durability, imgNum, desc){
        this.itemName = itemName;
        this.weight = weight;
        this.durability = durability; //can be used for other stuff such as spoiling
        this.maxDurability = durability;
        this.imgNum = imgNum;
        this.desc = desc;
        this.rarity = (itemDic[this.itemName] && itemDic[this.itemName].rarity) ? itemDic[this.itemName].rarity : ItemRarity.BASIC;
        this.rarityRGB = (itemDic[this.itemName] && itemDic[this.itemName].rarityRGB) ? itemDic[this.itemName].rarityRGB : getItemRarityRGB(this.rarity);

        // Use plain objects instead of p5.Vector to avoid circular reference issues during serialization
        this.offset = { x: 0, y: 0 };
        this.offVel = { x: 0, y: 0 }; //offset velocity
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
            // Calculate magnitude (plain object version)
            const getMag = (v) => Math.sqrt(v.x * v.x + v.y * v.y);
            const setMag = (v, m) => {
                const mag = getMag(v);
                if (mag > 0) {
                    v.x = (v.x / mag) * m;
                    v.y = (v.y / mag) * m;
                }
            };
            const rotate = (v, angle) => {
                const rad = angle * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const newX = v.x * cos - v.y * sin;
                const newY = v.x * sin + v.y * cos;
                v.x = newX;
                v.y = newY;
            };
            
            if(getMag(this.offVel) < 1){
                this.offVel.x = this.shake.intensity;
            }
            setMag(this.offVel, getMag(this.offVel) + this.shake.intensity);
            if(getMag(this.offVel) > this.shake.intensity*5){
                setMag(this.offVel, this.shake.intensity*5);
            }
            rotate(this.offVel, random(45, 180));
            this.shake.length -= 1;
        }
        else{
            this.shake.intensity = 0;
            this.offVel.x = -1*this.offset.x;
            this.offVel.y = -1*this.offset.y;
            // Calculate magnitude and set velocity (plain object version)
            const mag = Math.sqrt(this.offVel.x * this.offVel.x + this.offVel.y * this.offVel.y);
            if (mag > 0) {
                const targetMag = mag / 10;
                this.offVel.x = (this.offVel.x / mag) * targetMag;
                this.offVel.y = (this.offVel.y / mag) * targetMag;
            }
        }
        // Add velocity to offset (plain object version)
        this.offset.x += this.offVel.x;
        this.offset.y += this.offVel.y;
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
            this.durability -= 0.01;
            if(this.durability <= 0){
                this.durability = this.maxDurability;
                curPlayer.invBlock.decreaseAmount(this.itemName, 1);
            }
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
                        else curPlayer.statBlock.useMana(this.manaCost);
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
                
                curPlayer.statBlock.addMana(this.manaRegen);
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
            const chunkKey = chunkPos.key || getChunkKey(chunkPos.x, chunkPos.y);
            const chunk = testMap.chunks[chunkKey];
            let temp = createObject(this.plantName, ghostBuild.pos.x, ghostBuild.pos.y, ghostBuild.rot, curPlayer.color, curPlayer.id, curPlayer.name);
            chunk.objects.push(temp);
            chunk.objects.sort((a,b) => a.z - b.z);
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
function defineItemSuper(type, name, imgSrc, cost, weight, durability, desc, rarity, inCraftList){
    checkParams(arguments, getParamNames(defineItemSuper), ["string","string","object","object","number","int","string","string","boolean"]);

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
    
    const itemRarity = rarity || ItemRarity.BASIC;
    itemDic[name] = {
        type: type,
        name: name,
        img: imgNum,
        weight: weight,
        durability: durability,
        desc: desc,
        cost: cost,
        rarity: itemRarity,
        rarityRGB: getItemRarityRGB(itemRarity),
        rarityCSS: rarityToCSS(itemRarity)
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
 * @param {string} rarity the rarity tier of the item (ItemRarity.BASIC/GOOD/GREAT/LEGENDARY/DEVIL/GOD)
 * @param {boolean} inCraftList is this item craftable?
*/
function defineSimpleItem(name, imgPaths, cost, weight, desc, rarity, inCraftList){
    defineItemSuper("SimpleItem", name, imgPaths, cost, weight, 1, desc, rarity, inCraftList);
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
 * @param {string} rarity the rarity tier of the item (ItemRarity.BASIC/GOOD/GREAT/LEGENDARY/DEVIL/GOD)
 * @param {boolean} inCraftList is this item craftable?
*/
function defineShovel(name, imgPaths, cost, weight, durability, digSpeed, digSize, range, desc, rarity, inCraftList){
    defineItemSuper("Shovel", name, imgPaths, cost, weight, durability, desc, rarity, inCraftList);

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
 * @param {string} rarity the rarity tier of the item (ItemRarity.BASIC/GOOD/GREAT/LEGENDARY/DEVIL/GOD)
 * @param {boolean} inCraftList is this item craftable?
*/
function defineMelee(name, imgPaths, cost, weight, durability, damage, knockback, range, safeRange, angle, swingSpeed, magicBool, desc, rarity, inCraftList){
    defineItemSuper("Melee", name, imgPaths, cost, weight, durability, desc, rarity, inCraftList);

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
 * @param {string} rarity the rarity tier of the item (ItemRarity.BASIC/GOOD/GREAT/LEGENDARY/DEVIL/GOD)
 * @param {boolean} inCraftList is this item craftable?
*/
function defineRanged(name, imgPaths, cost, weight, durability, spread, projName, ammoName, fireRate, roundSize, reloadSpeed, magicBool, desc, rarity, inCraftList){
    defineItemSuper("Ranged", name, imgPaths, cost, weight, durability, desc, rarity, inCraftList);
    
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
 * @param {string} rarity the rarity tier of the item (ItemRarity.BASIC/GOOD/GREAT/LEGENDARY/DEVIL/GOD)
 * @param {boolean} inCraftList is this item craftable?
*/
function defineFood(name, imgPaths, cost, weight, durability, heal, manaRegen, desc, rarity, inCraftList){
    defineItemSuper("Food", name, imgPaths, cost, weight, durability, desc, rarity, inCraftList);

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
 * @param {string} rarity the rarity tier of the item (ItemRarity.BASIC/GOOD/GREAT/LEGENDARY/DEVIL/GOD)
 * @param {boolean} inCraftList is this item craftable?
*/
function definePotion(name, imgPaths, cost, weight, statName, statBoost, time, desc, rarity, inCraftList){
    defineItemSuper("Potion", name, imgPaths, cost, weight, 1, desc, rarity, inCraftList);
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
 * @param {string} rarity the rarity tier of the item (ItemRarity.BASIC/GOOD/GREAT/LEGENDARY/DEVIL/GOD)
 * @param {boolean} inCraftList is this item craftable?
*/
function defineEquipment(name, imgPaths, cost, weight, durability, slot, defense, statName, statBoost, desc, rarity, inCraftList){
    defineItemSuper("Equipment", name, imgPaths, cost, weight, durability, desc, rarity, inCraftList);
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
 * @param {string} rarity the rarity tier of the item (ItemRarity.BASIC/GOOD/GREAT/LEGENDARY/DEVIL/GOD)
 * @param {boolean} inCraftList is this item craftable?
*/
function defineSeed(name, imgPaths, cost, weight, plantName, chance, desc, rarity, inCraftList){
    defineItemSuper("Seed", name, imgPaths, cost, weight, 1, desc, rarity, inCraftList);
    
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
 * @param {string} rarity the rarity tier of the item (ItemRarity.BASIC/GOOD/GREAT/LEGENDARY/DEVIL/GOD)
 * @param {boolean} inCraftList is this item craftable?
*/
function defineCustomItem(name, imgPaths, cost, weight, durability, desc, useFunc, rarity, inCraftList){
    defineItemSuper("CustomItem", name, imgPaths, cost, weight, durability, desc, rarity, inCraftList);
    checkParams([arguments[6]],[getParamNames(defineFood)[6]],["function"]);

    itemDic[name].use = useFunc;
}