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
    // Increase timer
    player.regenTimer += 0.05;

    // Only tick on interval
    if (player.regenTimer >= player.regenInterval) {
        // --- HP Regen ---
        let mhp = player.statBlock.stats.mhp || 100;
        if (player.statBlock.stats.hp < mhp) {
            let regenAmount = (player.statBlock.stats.regen || 0) ;
            player.statBlock.stats.hp = Math.min(player.statBlock.stats.hp + regenAmount, mhp);
        }

        // --- MP Regen ---
        let mmp = player.statBlock.stats.mmp || 100;
        if (player.statBlock.stats.mp < mmp) {
            let mpRegen = (player.statBlock.stats.magic || 0) ;
            player.statBlock.stats.mp = Math.min(player.statBlock.stats.mp + mpRegen, mmp);
        }

        // Reset timer and interval (randomize 4-5s)
        player.regenTimer = 0;
        player.regenInterval = random(4, 5);
    }
}



function draw() {
    // image as background

    background(dirtFloorImg)
    if(gameState == "initial") {
        //console.log("restart");

        //! Why call these in draw if they only need to be called once? (wouldn't it be better to add them to the transitional buttons?)
        //unless they have some form of updates that I didn't see
        renderServerBrowser();
        renderLinks();

        MusicPlayer.playMainTheme()
    }
    else if (gameState === "race_selection") {
        //! Why call these in draw if they only need to be called once? (wouldn't it be better to add them to the transitional buttons?)
        //unless they have some form of updates that I didn't see

        drawSelection();
        renderLinks();
    }
    
    if (gameState === "playing") {
        timerDiv.show()

        MusicPlayer.playRandom()
        //console.log(MusicPlayer, "music !")

        //! Why call these in draw if they only need to be called once?
        hideRaceSelect();
        hideLinks();
        renderChatUI();

        // ---- (Your original gameplay code) ----
        if (Object.keys(testMap.chunks).length > 0) {
            testMap.render();
            testMap.update();
        }

        let keys = Object.keys(players);
        for (let i = 0; i < keys.length; i++) {
            if(curPlayer){ //only render other players once your current player exists
                if(players[keys[i]].pos.dist(curPlayer.pos) < TILESIZE*CHUNKSIZE*2){
                    

                    players[keys[i]].render();
                    players[keys[i]].update();
                }
            }
        }

        if (curPlayer) {
            moveCamera();

            curPlayer.render();
            curPlayer.update();
            if(renderGhost){
                ghostBuild.pos.x = mouseX + camera.pos.x - width / 2;
                ghostBuild.pos.y = mouseY + camera.pos.y - height / 2;
                
                if(ghostBuild.canRotate){
                    ghostBuild.rot = ghostBuild.pos.copy().sub(curPlayer.pos).heading();
                    if(!keyIsDown(SHIFT)){
                        ghostBuild.rot = round(ghostBuild.rot / 45) * 45;
                    }
                }

                if(!keyIsDown(SHIFT)){
                    //build snapping
                    if(ghostBuild.objName == "Wall" || ghostBuild.objName == "Floor" || ghostBuild.objName == "Door" || ghostBuild.objName == "Thin Wall" || ghostBuild.objName == "Rug"){
                        let chunkPos = testMap.globalToChunk(ghostBuild.pos.x,ghostBuild.pos.y);
                        let chunk = testMap.chunks[chunkPos.x + "," + chunkPos.y];
                        for(let i = 0; i < chunk.objects.length; i++){
                            if(chunk.objects[i].pos.dist(ghostBuild.pos) < 5+128){
                                if(chunk.objects[i].objName == "Wall" || chunk.objects[i].objName == "Floor" || chunk.objects[i].objName == "Door" || chunk.objects[i].objName == "Thin Wall"){
                                    let obj = chunk.objects[i];

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
            updatePlayerRegen(curPlayer,1)

            //little interact key above the thing you can interact with f rendered 
            let mouseVec = createVector(mouseX + camera.pos.x - (width / 2), mouseY + camera.pos.y - (height / 2));
            let chunkPos = testMap.globalToChunk(mouseVec.x,mouseVec.y);
            let chunk = testMap.chunks[chunkPos.x + "," + chunkPos.y];
            if(chunk != undefined){
                let closest;
                let closestDist;

                for(let i = 0; i < chunk.objects.length; i++){
                    if(
                        chunk.objects[i].type == "InvObj" || 
                        (
                            chunk.objects[i].type == "Plant" && 
                            chunk.objects[i].stage == (objImgs[chunk.objects[i].imgNum].length-1) &&
                            (
                                (chunk.objects[i].color != 0 && chunk.objects[i].color == curPlayer.color) ||
                                (chunk.objects[i].ownerName == curPlayer.name && chunk.objects[i].color == 0)
                            )
                        ) || 
                        chunk.objects[i].objName == "Door"
                    ){
                        if(chunk.objects[i].pos.dist(curPlayer.pos) < 4*TILESIZE){
                            if(closest == undefined){
                                closest = chunk.objects[i];
                                closestDist = mouseVec.dist(closest.pos);
                            }
                            else if (mouseVec.dist(chunk.objects[i].pos) < closestDist){
                                closest = chunk.objects[i];
                                closestDist = mouseVec.dist(closest.pos);
                            }
                        }
                    }
                }
                if(closest != undefined){
                    if(closestDist < 2*TILESIZE){
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
                        let chunkPos = testMap.globalToChunk(curPlayer.pos.x,curPlayer.pos.y);
                        let chunk = testMap.chunks[chunkPos.x + "," + chunkPos.y];
                        if(chunk != undefined){
                            closest = undefined;
                            for(let i = 0; i < chunk.objects.length; i++){
                                if(
                                    chunk.objects[i].type == "InvObj" || 
                                    (
                                        chunk.objects[i].type == "Plant" && 
                                        chunk.objects[i].stage == (objImgs[chunk.objects[i].imgNum].length-1) &&
                                        (
                                            (chunk.objects[i].color != 0 && chunk.objects[i].color == curPlayer.color) ||
                                            (chunk.objects[i].ownerName == curPlayer.name && chunk.objects[i].color == 0)
                                        )
                                    ) || 
                                    chunk.objects[i].objName == "Door"
                                ){
                                    if(closest == undefined){
                                        closest = chunk.objects[i];
                                        closestDist = curPlayer.pos.dist(closest.pos);
                                    }
                                    if (curPlayer.pos.dist(chunk.objects[i].pos) < closestDist){
                                        closest = chunk.objects[i];
                                        closestDist = curPlayer.pos.dist(closest.pos);
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