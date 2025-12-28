/*******************************************************
 * Globals
 *******************************************************/
let gameState = "initial";
let testMap; // your Map object
var lastHolding;
var projectiles = [];
var collisionChecks = [];
const races = BASE_STATS.map(item => item.name);
var camera = {};
var dirtBagUI = {};
var Debuging = false;


var MusicPlayer;

function setup() {
    // Create a responsive canvas
    let cnv = createCanvas(innerWidth - 10, innerHeight - 8);
    cnv.parent("canvas-container");
    document.getElementById("canvas-container").style.display = "none";
    
    // Set willReadFrequently to optimize getImageData operations
    drawingContext.willReadFrequently = true;
    
    noSmooth();
    background(220);
    angleMode(DEGREES);



    // tell p5 which formats to expect
    soundFormats('wav');

    // loadSound paths are relative to your sketch.html
    const mainTheme = loadSound('audio/music/bgtheme.wav');
    const battle    = loadSound('audio/music/battletheme.wav');
    const ambiance  = loadSound('audio/music/WorkingAmbianceSample.wav');

    const battle2    = loadSound('audio/music/Skizzard_Wizard.wav');
    
    MusicPlayer = new MusicSystem(mainTheme, [battle, ambiance,battle2]);
    // Prevent right-click context menu on p5.js canvases
    const canvases = document.getElementsByClassName("p5Canvas");
    for (let element of canvases) {
        element.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    // Listen for player health changes and spawn floating text
    window.addEventListener('playerHealthChange', (event) => {
        if (curPlayer && event.detail.change !== 0) {
            const kind = event.detail.change > 0 ? "heal" : "damage";
            spawnFloatingText(Math.abs(event.detail.change), curPlayer.pos.x, curPlayer.pos.y, kind, false);
        }
    });

    //read keybinds from local storage
    if(localStorage.getItem("keyBindings") != null){
        let keyBindings = JSON.parse(localStorage.getItem("keyBindings"));
        Controls_move_Up_code = keyBindings.upCode;
        Controls_Up_key = keyBindings.upKey;
        Controls_move_Left_code = keyBindings.leftCode;
        Controls_Left_key = keyBindings.leftKey;
        Controls_move_Down_code = keyBindings.downCode;
        Controls_Down_key = keyBindings.downKey;
        Controls_move_Right_code = keyBindings.rightCode;
        Controls_Right_key = keyBindings.rightKey;
        Controls_Interact_code = keyBindings.interactCode;
        Controls_Interact_key = keyBindings.interactKey;
        Controls_Inventory_code = keyBindings.invCode;
        Controls_Inventory_key = keyBindings.invKey;
        Controls_Crafting_code = keyBindings.craftCode;
        Controls_Crafting_key = keyBindings.craftKey;
        Controls_Pause_code = keyBindings.pauseCode;
        Controls_Pause_key = keyBindings.pauseKey;
        Controls_MoveHotBarRight_code = keyBindings.moveHotBarRightCode;
        Controls_MoveHotBarRight_key = keyBindings.moveHotBarRightKey;
        Controls_MoveHotBarLeft_code = keyBindings.moveHotBarLeftCode;
        Controls_MoveHotBarLeft_key = keyBindings.moveHotBarLeftKey;
        Controls_Build_code = keyBindings.buildCode;
        Controls_Build_key = keyBindings.buildKey;
        Controls_Space_code = keyBindings.spaceCode;
        Controls_Space_key = keyBindings.spaceKey;
        if (keyBindings.dashCode !== undefined) {
            Controls_Dash_code = keyBindings.dashCode;
            Controls_Dash_key = keyBindings.dashKey;
        }
    }

    seperateAtlas();

    setupUI();

    camera.pos = createVector(0, 0);
    camera.vel = createVector(0,0);
    camera.shake = {intensity: 0, length: 0};
    camera.edgeBlood = 0;

    dirtBagUI.pos = createVector(width-180-10, height-186-10);
    dirtBagUI.vel = createVector(0,0);
    dirtBagUI.shake = {intensity: 0, length: 0};

    // Update the volume of all sounds
    let keys = Object.keys(soundDic);
    for(let i = 0; i < keys.length; i++){
        for(let j = 1; j < soundDic[keys[i]].sounds.length; j++){
            soundDic[keys[i]].sounds[j].setVolume((j/20)*soundDic[keys[i]].volume * (volumeSlider.value()/100));
        }
    }


}

function moveCamera(){
    if(camera.shake.length > 0){
        if(camera.vel.mag() < 1){
            camera.vel.x = camera.shake.intensity;
        }
        camera.vel.setMag(camera.vel.mag()+camera.shake.intensity);
        if(camera.vel.mag() > camera.shake.intensity*5){
            camera.vel.setMag(camera.shake.intensity*5);
        }
        camera.vel.rotate(random(45, 180));
        camera.shake.length -= 1;
    }
    else{
        camera.shake.intensity = 0;
        camera.vel.x = (curPlayer.pos.x-camera.pos.x);
        camera.vel.y = (curPlayer.pos.y-camera.pos.y);
        camera.vel.setMag(camera.vel.mag()/10);
    }
    camera.pos.add(camera.vel);

    //fixes a visual bug where cracks would form in the dirt
    camera.pos.x = round(camera.pos.x);
    camera.pos.y = round(camera.pos.y);

    if(camera.edgeBlood > 0){
        camera.edgeBlood -= 1;
        image(edgeBloodImg, 0, 0, width, height);
    }
}

function windowResized() {
    resizeCanvas(innerWidth - 10, innerHeight - 8);
    updateResponsiveDesign();
}

function updatePlayerRegen(player) {
    // Increase timer based on deltaTime (deltaTime is in ms, so divide by 1000 for seconds)
    player.regenTimer += deltaTime / 1000;
    
    
    // Only tick on interval (regenInterval is in seconds)
    if (player.regenTimer >= player.regenInterval) {

        let mhp = player.statBlock.stats.mhp || 100;
        let currentHP = player.statBlock.stats.hp;
        let regenAmount = player.statBlock.stats.healthRegen || 0;

        if (currentHP < mhp && regenAmount > 0) {
            player.statBlock.regenHealth(regenAmount);
            // Sync with server
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["stats.hp"],
                update_values: [player.statBlock.stats.hp]
            });
        } 
        // --- MP Regen ---
        let mmp = player.statBlock.stats.mmp || 100;
        if (player.statBlock.stats.mp < mmp) {

            let mpRegen = (player.statBlock.stats.magic || 1) * 0.1; // Regen 10% of magic stat as MP
            player.statBlock.regenMana(mpRegen);
            //console.log(`✅ Regenerated ${mpRegen.toFixed(1)} MP. Current MP: ${player.statBlock.stats.mp.toFixed(1)}/${mmp}`);  
            // Sync with server
            socket.emit("update_player", {
                id: player.id,
                pos: player.pos,
                holding: player.holding,
                update_names: ["stats.mp"],
                update_values: [player.statBlock.stats.mp]
            });
        }

        // Reset timer
        player.regenTimer = 0;
    }
}



let uiHiddenForPlay = false; // prevent per-frame hide/show work

function draw() {
    // image as background

    background(dirtFloorImg)
    if(gameState == "initial") {
        //console.log("restart");

        renderServerBrowser();
        renderLinks();

        MusicPlayer.playMainTheme()
        uiHiddenForPlay = false; // reset guard when leaving gameplay
    }
    else if (gameState === "race_selection") {
        drawSelection();
        renderLinks();
        uiHiddenForPlay = false;
    }
    
    if (gameState === "playing") {
        if (typeof timerEnabled === 'undefined' || timerEnabled) {
            timerDiv.show()
        } else if (timerDiv) {
            timerDiv.hide()
        }

        MusicPlayer.playRandom()

        // Only hide/show UI once when entering gameplay to avoid per-frame DOM churn
        if (!uiHiddenForPlay) {
            hideRaceSelect();
            hideLinks();
            renderChatUI();
            uiHiddenForPlay = true;
        }

        // ---- (Your original gameplay code) ----
        if (Object.keys(testMap.chunks).length > 0) {
            testMap.render();
            testMap.update();
        }

        // PERF FIX #1: avoid Object.keys() loop if no curPlayer
        if(curPlayer) {
            const RENDER_DISTANCE = TILESIZE*CHUNKSIZE*2;
            const keys = Object.keys(players);
            for (let i = 0; i < keys.length; i++) {
                const p = players[keys[i]];
                if(p.pos.dist(curPlayer.pos) < RENDER_DISTANCE){
                    p.render();
                    p.update();
                }
        }

        if (curPlayer) {
            moveCamera();

            curPlayer.render();
            curPlayer.update();
            if (typeof renderHotbarUI === 'function') {
                renderHotbarUI();
            }
            if(renderGhost && ghostBuild){
                ghostBuild.pos.x = mouseX + camera.pos.x - width / 2;
                ghostBuild.pos.y = mouseY + camera.pos.y - height / 2;
                
                if(ghostBuild.canRotate){
                    ghostBuild.rot = ghostBuild.pos.copy().sub(curPlayer.pos).heading();
                    if(!keyIsDown(SHIFT)){
                        ghostBuild.rot = round(ghostBuild.rot / 45) * 45;
                    }
                }

                if(!keyIsDown(SHIFT)){
                    // PERF FIX #2: cache chunk lookup key, check null before loop
                    const isSnappable = ghostBuild.objName == "Wall" || ghostBuild.objName == "Floor" || ghostBuild.objName == "Door" || ghostBuild.objName == "Thin Wall" || ghostBuild.objName == "Rug";
                    if(isSnappable){
                        let chunkPos = testMap.globalToChunk(ghostBuild.pos.x,ghostBuild.pos.y);
                        let chunkKey = chunkPos.x + "," + chunkPos.y;
                        let chunk = testMap.chunks[chunkKey];
                        if(chunk) for(let i = 0; i < chunk.objects.length; i++){
                            if(chunk.objects[i].pos.dist(ghostBuild.pos) < 5+128){
                                const obj = chunk.objects[i];
                                const objIsSnappable = obj.objName == "Wall" || obj.objName == "Floor" || obj.objName == "Door" || obj.objName == "Thin Wall";
                                if(objIsSnappable){

                                    let relX = (mouseX + camera.pos.x - width / 2) - obj.pos.x;
                                    let relY = (mouseY + camera.pos.y - height / 2) - obj.pos.y;

                                    let rad = -radians(obj.rot);
                                    let rotX = relX * Math.cos(rad) - relY * Math.sin(rad);
                                    let rotY = relX * Math.sin(rad) + relY * Math.cos(rad);

                                    let snapSize = 128;
                                    if(ghostBuild.objName == "Door" || ghostBuild.objName == "Thin Wall" || ghostBuild.objName == "Rug"){
                                        snapSize = 32;
                                    }
                                    if(obj.objName == "Thin Wall" || obj.objName == "Door" || obj.objName == "Rug"){
                                        snapSize = 32;
                                    }

                                    let snappedX = round(rotX / snapSize) * snapSize;
                                    let snappedY = round(rotY / snapSize) * snapSize;

                                    let finalX = snappedX * Math.cos(-rad) - snappedY * Math.sin(-rad);
                                    let finalY = snappedX * Math.sin(-rad) + snappedY * Math.cos(-rad);

                                    ghostBuild.pos.x = obj.pos.x + finalX;
                                    ghostBuild.pos.y = obj.pos.y + finalY;

                                    ghostBuild.rot = round((ghostBuild.rot - obj.rot) / 90) * 90 + obj.rot;
                                }
                            }
                        }
                    }
                }
                ghostBuild.ghostRender(createVector(ghostBuild.pos.x,ghostBuild.pos.y).dist(curPlayer.pos) < 200);
            }

            //regen mana and health over time
            updatePlayerRegen(curPlayer)

            // PERF FIX #3: cache chunk key string, use const for INTERACT_RANGE
            let mouseVec = createVector(mouseX + camera.pos.x - (width / 2), mouseY + camera.pos.y - (height / 2));
            let chunkPos = testMap.globalToChunk(mouseVec.x,mouseVec.y);
            let chunkKey = chunkPos.x + "," + chunkPos.y;
            let chunk = testMap.chunks[chunkKey];
            if(chunk != undefined){
                let closest;
                let closestDist;
                const INTERACT_RANGE = 4*TILESIZE;

                for(let i = 0; i < chunk.objects.length; i++){
                    // PERF FIX #4: cache array access, extract interactable check
                    const obj = chunk.objects[i];
                    const isInteractable = obj.type == "InvObj" || obj.objName == "Door" ||
                        (obj.type == "Plant" && 
                         obj.stage == (objImgs[obj.imgNum].length-1) &&
                         ((obj.color != 0 && obj.color == curPlayer.color) ||
                          (obj.ownerName == curPlayer.name && obj.color == 0)));
                    if(isInteractable){
                        let dist = mouseVec.dist(obj.pos);
                        if(closestDist === undefined || dist < closestDist){
                            closestDist = dist;
                            closest = obj;
                        }
                    }
                }
                if(closestDist !== undefined && closestDist < INTERACT_RANGE){
                        push();
                        fill(120);
                        stroke(0);
                        strokeWeight(1);
                        rectMode(CENTER);
                        let offY = 0;
                        if(closest.objName != "Door") offY = (closest.size.h * 0.8);
                        rect(closest.pos.x - camera.pos.x + (width/2), closest.pos.y - offY - camera.pos.y + (height/2), 20, 20);

                        fill(0);
                        stroke(0);
                        textAlign(CENTER, CENTER);
                        textSize(15);
                        textFont(gameUIFont);
                        text(Controls_Interact_key.toUpperCase(), closest.pos.x - camera.pos.x + (width/2), closest.pos.y - offY - camera.pos.y + (height/2));
                        pop();
                    }
                    else{
                        // PERF FIX #5: cache chunk key, cache const, cache distance calc
                        // PERF FIX #8: Call globalToChunk only once
                        let playerChunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
                        let playerChunkKey = playerChunkPos.x + "," + playerChunkPos.y;
                        let chunk = testMap.chunks[playerChunkKey];
                        if(chunk != undefined){
                            closest = undefined;
                            closestDist = undefined;
                            const PLAYER_INTERACT = 4*TILESIZE;
                            
                            for(let i = 0; i < chunk.objects.length; i++){
                                const obj = chunk.objects[i];
                                const isInteractable = obj.type == "InvObj" || obj.objName == "Door" ||
                                    (obj.type == "Plant" && 
                                     obj.stage == (objImgs[obj.imgNum].length-1) &&
                                     ((obj.color != 0 && obj.color == curPlayer.color) ||
                                      (obj.ownerName == curPlayer.name && obj.color == 0)));
                                
                                if(isInteractable){
                                    const dist = curPlayer.pos.dist(obj.pos);
                                    if(dist < PLAYER_INTERACT){
                                        if(closestDist === undefined || dist < closestDist){
                                            closestDist = dist;
                                            closest = obj;
                                        }
                                    }
                                }
                            }

                            if(closest != undefined){
                                if(closestDist < 4*TILESIZE){
                                    push();
                                    fill(120);
                                    stroke(0);
                                    strokeWeight(1);
                                    rectMode(CENTER);
                                    let offY = 0;
                                    if(closest.objName != "Door") offY = (closest.size.h * 0.8);
                                    rect(closest.pos.x - camera.pos.x + (width/2), closest.pos.y - offY - camera.pos.y + (height/2), 20, 20);
        
                                    fill(0);
                                    stroke(0);
                                    textAlign(CENTER, CENTER);
                                    textSize(15);
                                    textFont(gameUIFont);
                                    text(Controls_Interact_key.toUpperCase(), closest.pos.x - camera.pos.x + (width/2), closest.pos.y - offY - camera.pos.y + (height/2));
                                    pop();
                                }
                            }
                        }
                    }
                }
            }

            lastHolding = curPlayer.holding;

            curPlayer.invBlock.renderHotBar();
            renderPlayerCardUI();
            updateRacePortrait();

            if(curPlayer.statBlock.stats.hp <= 0){ //death
                //console.log("dead",curPlayer.attackingOBJ);
                let dealthData = {x:curPlayer.pos.x , y : curPlayer.pos.y, name : curPlayer.name, id:curPlayer.id, attacker : curPlayer.attackingOBJ ? curPlayer.attackingOBJ.ownerName : " Some thing Ominous"}
                socket.emit("player_dies", dealthData);

                curPlayer.invBlock.dropAll();

                dirtInv = 0;
                gameState = "dead";
                deathDiv.show();
            }
        }

        renderTimeUI()
        renderDirtBagUI();
        renderPopups();
        
        // Render player profile panel if open
        if (typeof renderPlayerProfile === 'function') {
            renderPlayerProfile();
        }
    }
    if (gameState === "chating" || gameState === "inventory" || gameState === "crafting" || gameState === "swap_inv" || gameState === "pause" || gameState =="player_status" || gameState == "team_select" || gameState == "dead" || gameState == "Editing Sign") {
        //render the game in the background

        renderTimeUI()
        if (Object.keys(testMap.chunks).length > 0) {
            testMap.render();
            testMap.update();
        }

        if (curPlayer) {
            moveCamera();

            curPlayer.render();
            curPlayer.update();
        }

        let keys = Object.keys(players);
        for (let i = 0; i < keys.length; i++) {
            if(curPlayer){
                if(players[keys[i]].pos.dist(curPlayer.pos) < TILESIZE*CHUNKSIZE*2){
                    players[keys[i]].render();
                    players[keys[i]].update();
                }
            }
        }

        if(gameState == "dead"){
            push();
            fill(255, 0, 0, 100);
            rect(0, 0, width, height);
            image(edgeBloodImg, 0, 0, width, height);
            pop();
        }

        curPlayer.invBlock.renderHotBar();
        renderPlayerCardUI();
        updateRacePortrait();
        renderDirtBagUI();
        renderPopups();
    }
    if(gameState == "teleport"){
        if (curPlayer.invBlock.useTimer > 0) curPlayer.invBlock.useTimer--;

        push();
        translate(width/2, height/2);
        imageMode(CENTER, CENTER);
        rotate(-0.75*frameCount);
        image(portalBackground, 0, 0, 2500, 2500);
        translate(-width/2, -height/2);
        pop();
        
        push();

        stroke(255);
        strokeWeight(3);
        fill("#FF8080");
        for(let i = 0; i < knownPortals.length; i++){
            let x = knownPortals[i].pos.x - curPlayer.pos.x;
            let y = knownPortals[i].pos.y - curPlayer.pos.y;
            x = x/(5*CHUNKSIZE*TILESIZE);
            y = y/(5*CHUNKSIZE*TILESIZE);
            x = x * width/2;
            y = y * height/2;
            x = x + width/2;
            y = y + height/2;
            if(createVector(x, y).dist(createVector(mouseX, mouseY)) < 50){
                circle(x, y, 50);
            }
            image(portalImg, x-24, y-30, 48, 60);
        }
        
        fill("#70443C");
        circle(width/2, height/2, 50);

        push();
        beginClip();
        fill(255);
        circle(width/2, height/2, 50);
        endClip();
        image(raceImages[races[curPlayer.race]].portrait, (width/2)-25, (height/2)-25, 50, 50);
        pop();

        noFill();
        circle(width/2, height/2, 50);

        fill(100);
        rect(width-50, 0, 50, 50);

        fill(255);
        noStroke();
        textAlign(LEFT, TOP);
        textSize(30);
        textFont(gameUIFont);
        text("Portals In Range: " + knownPortals.length, 10, 10);
        
        textAlign(CENTER, CENTER);
        text("X", width-25, 25);

        pop();
    }

    continousKeyBoardInput();
    continousMouseInput();
}