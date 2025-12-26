class InvBlock{
    constructor(){
        this.items = {};
        this.hotbar = ["","","","",""]; //only put item names in here
        this.selectedHotBar = 0; //index of the selected hotbar item
        this.equiped = {
            head: "",
            neck: "",
            chest: "",
            legs: "",
            feet: ""
        };

        this.curItem = ""; //name of the item you are currently selecting
        this.curTag = "All"; //tag for sorting through items
        this.useTimer = 0; //for some items, so you cant spam them
        this.animationTimer = 0; //for hotbar animations
        this.invId = random(100000);
        this.itemLabelDiv = null; // Will be initialized later
    }

    addItem(item,amount,toPlayer){
        if(this.items[item] == undefined){
            this.items[item] = createItem(item);
            this.items[item].amount = amount;
        }else{
            this.items[item].amount += amount;
        }
        if(toPlayer){
            popups.push(new Popup(itemImgs[itemDic[item].img][0], amount + " " + item + " added to inv", 50, 0, 0));
        }
    }

    decreaseAmount(item, amount){
        if(this.items[item] == undefined) return;
        this.items[item].amount -= amount;
        if(this.items[item].amount <= 0){
            for(let i=0; i<this.hotbar.length; i++){ //remove item from hotbar
                if(this.hotbar[i] == item){
                    this.hotbar[i] = "";
                }
            }
            if(this.curItem == item){
                this.curItem = "";
                updatecurItemDiv();
            }
            if(!buildMode){
                renderGhost = false;
            }
            delete this.items[item]; //remove item from inventory
        }
    }

    equipItem(itemName){
        if(this.items[itemName].type == "Equipment"){
            if(this.equiped[this.items[itemName].slot] != "") this.unEquipItem(this.items[itemName].slot);
            this.equiped[this.items[itemName].slot] = itemName;
            curPlayer.statBlock.stats[this.items[itemName].statName] += this.items[itemName].statBoost;
            curPlayer.defense += this.items[itemName].defense;
        }
    }

    unEquipItem(slot){
        if(this.equiped[slot] != ""){
            curPlayer.statBlock.stats[this.items[this.equiped[slot]].statName] -= this.items[this.equiped[slot]].statBoost;
            curPlayer.defense += this.items[this.equiped[slot]].defense;
            this.equiped[slot] = "";
        }
    }

    hotbarItem(itemName, slot){ //move an item to the hotbar
        if(itemName == this.hotbar[slot]){
            this.hotbar[slot] = "";
        }
        else{
            if (itemDic[itemName].type != "SimpleItem"){ //if item has a use
                this.hotbar[slot] = itemName;
            }
        }
    }

    dropItem(item,amount){
        let itemBag = createObject("ItemBag", curPlayer.pos.x, curPlayer.pos.y, 0, 0, "", "");
        itemBag.invBlock.addItem(item, amount, false);
        this.decreaseAmount(item, amount);
    }
    
    dropAll() {
    let itemBag = createObject("ItemBag", curPlayer.pos.x, curPlayer.pos.y, 0, 0, "", "");
    let keys = Object.keys(this.items);
    for (let i = 0; i < keys.length; i++) {
        let item = this.items[keys[i]];
        if (item.amount > 0) {
            itemBag.invBlock.addItem(keys[i], item.amount, false);
            this.decreaseAmount(keys[i], item.amount);
        }
    }
    let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
    testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.push(itemBag);

    testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.sort((a,b) => a.z - b.z);

    socket.emit("new_object", {
        cx: chunkPos.x, 
        cy: chunkPos.y, 
        obj: itemBag
    });

    let expOrb = createObject(
        "ExpOrb",                         // name
        curPlayer.pos.x + random(-10,10), // x (add slight offset)
        curPlayer.pos.y + random(-10,10), // y (add slight offset)
        0,                                 // rot
        0,                                 // color/team
        `xp_orb_${Date.now()}`,            // unique id
        curPlayer.name                     // owner (optional)
    );
    expOrb.id = random(1000000);
    testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.push(expOrb);
    testMap.chunks[chunkPos.x + "," + chunkPos.y].objects.sort((a,b) => a.z - b.z);

    socket.emit("new_object", {
        cx: chunkPos.x,
        cy: chunkPos.y,
        obj: expOrb
    });
}


    getItemStats(item){
        if(this.items[item] != undefined){
            if(this.items[item].type == "Simple" || this.items[item].type == "Seed" || this.items[item].type == "CustomItem"){
                return [
                    ["Durability", this.items[item].durability], 
                    ["Weight", this.items[item].weight]
                ];
            }
            else if(this.items[item].type == "Shovel"){
                return [
                    ["Durability", this.items[item].durability], 
                    ["Weight", this.items[item].weight], 
                    ["Dig Speed", this.items[item].digSpeed], 
                    ["Dig Size", this.items[item].digSize], 
                    ["Range", this.items[item].range]
                ];
            }
            else if(this.items[item].type == "Melee"){
                return [
                    ["Durability", this.items[item].durability], 
                    ["Weight", this.items[item].weight], 
                    ["Damage", this.items[item].damage], 
                    ["Range", this.items[item].range], 
                    ["Angle", this.items[item].angle], 
                    ["Swing Speed", (1/this.items[item].swingSpeed).toFixed(3)]
                ];
            }
            else if(this.items[item].type == "Ranged"){
                return [
                    ["Durability", this.items[item].durability], 
                    ["Weight", this.items[item].weight], 
                    ["Damage", this.items[item].damage], 
                    ["Spread", this.items[item].spread],
                    ["Ammo Name", this.items[item].ammoName],
                    ["Firerate", (1/this.items[item].fireRate).toFixed(3)],
                    ["Round Size", this.items[item].roundSize],
                    ["Reload Speed", (1/this.items[item].reloadSpeed).toFixed(3)]
                ];
            }
            else if(this.items[item].type == "Food"){
                return [
                    ["Durability", this.items[item].durability], 
                    ["Weight", this.items[item].weight], 
                    ["Heal", this.items[item].heal]
                ];
            }
            else if(this.items[item].type == "Potion"){
                return [
                    ["Durability", this.items[item].durability], 
                    ["Weight", this.items[item].weight],
                    ["Effect", this.items[item].statName],
                    ["Effect Amount", this.items[item].statBoost], 
                    ["Effect Time", this.items[item].time]
                ];
            }
            else if(this.items[item].type == "Equipment"){
                ["Durability", this.items[item].durability], 
                ["Weight", this.items[item].weight]
            }
        }
    }

    craftCheck(itemName){
        for(let i=1; i<itemDic[itemName].cost.length; i++){
            let item = itemDic[itemName].cost[i][0];
            let amount = itemDic[itemName].cost[i][1];
            if(item == "Dirt"){
                if(dirtInv < amount){
                    return false;
                }
            }
            else{
                if(this.items[item] == undefined || this.items[item].amount < amount){
                    return false;
                }
            }
        }
        return true;
    }

    renderHotBar() {
        if (this.useTimer > 0) this.useTimer--;
        if (this.animationTimer > 0) this.animationTimer -= 0.1;
        if (this.animationTimer < 0) this.animationTimer += 0.1;
    
        // Hotbar Inventory
        push();
        noFill();
        stroke(255);
        strokeWeight(50);
        arc(width, height, 595, 595, 180, 270);
    
        stroke("#604030");
        if (buildMode) stroke("#1F5489");
        strokeWeight(45);
        arc(width, height, 595, 595, 180, 270);
    
        imageMode(CENTER);
    
        // Figure out which slots to show
        let slots = [
          this.selectedHotBar - 2,
          this.selectedHotBar - 1,
          this.selectedHotBar,
          this.selectedHotBar + 1,
          this.selectedHotBar + 2
        ];
        
        if(!buildMode){
            for (let i = 0; i < slots.length; i++) {
              if (slots[i] < 0) slots[i] = 5 + slots[i];
              if (slots[i] > 4) slots[i] = slots[i] - 5;
            }
            // Render the items in each slot
            for (let i = 0; i < slots.length; i++) {
                let slotIndex = slots[i];
                let hotBarKey = this.hotbar[slotIndex];
                if (hotBarKey !== "") {
                    // Compute position based on your original logic
                    let x = width  - (cos(15 + 15*i + 15*this.animationTimer) * 300);
                    let y = height - (sin(15 + 15*i + 15*this.animationTimer) * 300);
            
                    // Draw the item image
                    let item = this.items[hotBarKey];
                    item.renderImage(x, y);
            
                    // If there's more than one of this item, render the amount
                    if (item.amount > 1) {
                    push();
                    fill(255);
                    stroke(0);
                    strokeWeight(4);
                    textAlign(RIGHT, BOTTOM);
                    textSize(18);
                    textFont(gameUIFont);
                    // Adjust the offsets as needed to place the text nicely
                    text(item.amount, x + 35, y +15);
                    pop();
                    }
                }
            }

            if(this.hotbar[this.selectedHotBar] != ""){
                if(this.items[this.hotbar[this.selectedHotBar]].itemName == "Compass"){
                    //COMPASS
                }
            }
        }
        else{
            for (let i = 0; i < slots.length; i++) {
                if (slots[i] < 0) slots[i] = buildOptions.length + slots[i];
                if (slots[i] > buildOptions.length-1) slots[i] = slots[i] - buildOptions.length;
            }
            for (let i = 0; i < slots.length; i++) {
                let slotIndex = slots[i];
                //render the buildOption[slotIndex]
                let x = width  - (cos(15 + 15*i + 15*this.animationTimer) * 300);
                let y = height - (sin(15 + 15*i + 15*this.animationTimer) * 300);
                image(objImgs[buildOptions[slotIndex].images2][curPlayer.color % objImgs[buildOptions[slotIndex].images2].length], x, y, 60, 60);
            }
        }
    
        // Q & E key rectangles
        fill(150);
        stroke(255);
        strokeWeight(1);
        rectMode(CENTER);
        rect(width - (0.866 * 255), height - (0.5 * 255), 20, 20);  // Q
        rect(width - (0.5 * 255), height - (0.866 * 255), 20, 20);  // E
        rect(width - 350, height - 30, 20, 20);  // R
    
        // That triangular shape
        fill(255, 0, 0);
        beginShape();
        vertex(width - (0.676 * 250), height - (0.737 * 250));
        vertex(width - (0.737 * 250), height - (0.676 * 250));
        vertex(width - (0.707 * 265), height - (0.707 * 265));
        endShape(CLOSE);
    
        // Q/E text
        fill(0);
        stroke(0);
        textAlign(CENTER, CENTER);
        textSize(15);
        textFont(gameUIFont);
        text(Controls_MoveHotBarLeft_key.toUpperCase(), width - (0.866 * 255), height - (0.5 * 255) - 3);
        text(Controls_MoveHotBarRight_key.toUpperCase(), width - (0.5 * 255), height - (0.866 * 255) - 1.5);
        text(Controls_Build_key.toUpperCase(), width - 350, height - 30);
    
        if(!buildMode) image(hammerImg, width - 385, height - 30, 40, 40);
        else image(Ximage, width - 385, height - 30, 40, 40);

        // Update HTML item label
        this.updateItemLabel(buildMode);

        pop();
    }
    
    updateItemLabel(buildMode){
        // Create div if it doesn't exist yet
        if(!this.itemLabelDiv){
            this.itemLabelDiv = createDiv();
            this.itemLabelDiv.style("position", "fixed");
            this.itemLabelDiv.style("bottom", "134px");
            this.itemLabelDiv.style("right", "200px");
            this.itemLabelDiv.style("background", "rgba(20, 20, 20, 0.86)");
            this.itemLabelDiv.style("padding", "8px 12px");
            this.itemLabelDiv.style("border-radius", "4px");
            this.itemLabelDiv.style("font-family", "Arial, sans-serif");
            this.itemLabelDiv.style("font-size", "16px");
            this.itemLabelDiv.style("pointer-events", "none");
            this.itemLabelDiv.style("z-index", "1000");
            this.itemLabelDiv.style("display", "none");
            this.itemLabelDiv.style("text-align", "right");
        }
        
        let selectedItemName = "";
        let selectedItemDurability = "";
        
        if(!buildMode){
            selectedItemName = this.hotbar[this.selectedHotBar];
            if(selectedItemName && this.items[selectedItemName]){
                let item = this.items[selectedItemName];
                if(item.durability !== undefined && item.maxDurability !== undefined){
                    selectedItemDurability = Math.floor(item.durability) + "/" + item.maxDurability;
                }
            }
        } else {
            selectedItemName = buildOptions[this.selectedHotBar].objName;
        }
        
        if (selectedItemName && selectedItemName !== "") {
            // Get rarity color if available
            let itemColor = "rgb(235, 235, 235)"; // default off-white
            if(!buildMode && typeof window !== 'undefined' && typeof window.getItemRarityCSSByName === 'function'){
                try{
                    itemColor = window.getItemRarityCSSByName(selectedItemName);
                } catch(e){}
            }
            
            // Build HTML content
            let content = `<div style="color: ${itemColor}; font-weight: bold;">${selectedItemName}</div>`;
            if(selectedItemDurability){
                content += `<div style="color: rgb(180, 180, 180); font-size: 13px; margin-top: 4px;">${selectedItemDurability}</div>`;
            }
            
            this.itemLabelDiv.html(content);
            this.itemLabelDiv.style("display", "block");
        } else {
            this.itemLabelDiv.style("display", "none");
        }
    }
    
}