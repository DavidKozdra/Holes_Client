var digSoundTimer = 0;

function renderDigPreviewLine() {
    // Real-time guide line preview based on current mouse position (for feedback while digging)
    if (!curPlayer) return;
    
    // Only show preview if holding a shovel/digging tool
    const slotName = curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar];
    if (!slotName) return;
    const item = curPlayer.invBlock.items[slotName];
    if (!item || item.type !== "Shovel") return;
    
    const mouseVec = createVector(mouseX + camera.pos.x - (width / 2), mouseY + camera.pos.y - (height / 2));
    const ray = createVector(mouseVec.x - curPlayer.pos.x, mouseVec.y - curPlayer.pos.y);
    const angle = ray.heading();
    
    const digSpot = cast(curPlayer.pos.x, curPlayer.pos.y, angle, false);
    if (!digSpot) return;
    
    const digX = (digSpot.cx * CHUNKSIZE + digSpot.x) * TILESIZE;
    const digY = (digSpot.cy * CHUNKSIZE + digSpot.y) * TILESIZE;
    
    // Draw preview guide line from player with offset
    const startX = curPlayer.pos.x - camera.pos.x + (width / 2);
    const startY = curPlayer.pos.y - camera.pos.y + (height / 2);
    const targetX = digX - camera.pos.x + (width / 2);
    const targetY = digY - camera.pos.y + (height / 2);
    const dx = targetX - startX;
    const dy = targetY - startY;
    const len = sqrt(dx * dx + dy * dy);
    const dirX = len !== 0 ? dx / len : 0;
    const dirY = len !== 0 ? dy / len : 0;
    const offset = 40;
    const shorten = 30;
    const usableLen = max(0, len - offset);
    const drawnLen = usableLen > shorten ? usableLen - shorten : usableLen;
    const startXOffset = startX + dirX * offset;
    const startYOffset = startY + dirY * offset;
    const endX = startXOffset + dirX * drawnLen;
    const endY = startYOffset + dirY * drawnLen;
    
    push();
    stroke(245, 245, 245, 50);
    strokeWeight(3);
    line(startXOffset, startYOffset, endX, endY);
    pop();
}

function getEquippedShovelImage() {
    if (!curPlayer || !curPlayer.invBlock) return null;
    const slotName = curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar];
    if (!slotName) return null;
    const item = curPlayer.invBlock.items[slotName];
    if (!item || item.type !== "Shovel") return null;

    const imgIdx = itemDic[slotName]?.img;
    if (imgIdx === undefined || !itemImgs[imgIdx] || !itemImgs[imgIdx][0]) return null;
    return itemImgs[imgIdx][0];
}

function drawShovelHead(x, y, angle, overrideImg) {
    const sprite = overrideImg || shovelHeadImg;
    if (!sprite) return;
    push();
    translate(x, y);
    rotate(angle);
    imageMode(CENTER);
    image(sprite, 0, 0, TILESIZE * 0.9, TILESIZE * 0.9);
    pop();
}

function playerDig(x,y, amount){
    let ray = createVector(x-curPlayer.pos.x, y-curPlayer.pos.y);

    let digSpot = cast(curPlayer.pos.x, curPlayer.pos.y, ray.heading(), (amount < 0));
    if(digSpot != undefined){
        dig(((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE), amount, true, digSpot.rayStart);
        
        //2 extra digs to make a better path for walking
        let digSpot2;
        let digSpot3;
        
        if(abs(ray.heading()) >= 0 && abs(ray.heading()) <= 22.5){
            digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x, y: digSpot.y+1};
            digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x, y: digSpot.y-1};
        }
        else if(abs(ray.heading()) > 22.5 && abs(ray.heading()) <= 67.5){
            if(ray.heading() > 0){
                digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y+1};
                digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y-1};
            }
            else{
                digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y-1};
                digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y+1};
            }
        }
        else if(abs(ray.heading()) > 67.5 && abs(ray.heading()) <= 112.5){
            digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y};
            digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y};
        }
        else if(abs(ray.heading()) > 112.5 && abs(ray.heading()) <= 157.5){
            if(ray.heading() > 0){
                digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y-1};
                digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y+1};
            }
            else{
                digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y+1};
                digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y-1};
            }
        }
        else if(abs(ray.heading()) > 157.5 && abs(ray.heading()) <= 180){
            digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x, y: digSpot.y-1};
            digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x, y: digSpot.y+1};
        }

        if(digSpot2 != undefined) dig(((digSpot2.cx*CHUNKSIZE+digSpot2.x)*TILESIZE), ((digSpot2.cy*CHUNKSIZE+digSpot2.y)*TILESIZE), amount, true, digSpot.rayStart);
        if(digSpot3 != undefined) dig(((digSpot3.cx*CHUNKSIZE+digSpot3.x)*TILESIZE), ((digSpot3.cy*CHUNKSIZE+digSpot3.y)*TILESIZE), amount, true, digSpot.rayStart);
        
        if(digSoundTimer <= 0){
            if(amount > 0){
                let temp = new SoundObj("digging.wav", ((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE));
                testMap.chunks[digSpot.cx+","+digSpot.cy].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "digging.wav", cPos: {x: digSpot.cx, y: digSpot.cy}, pos:{x: ((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), y: ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE)}, id: temp.id});
            }
            else{
                let temp = new SoundObj("placing_dirt.wav", ((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE));
                testMap.chunks[digSpot.cx+","+digSpot.cy].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "placing_dirt.wav", cPos: {x: digSpot.cx, y: digSpot.cy}, pos:{x: ((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), y: ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE)}, id: temp.id});
            }
            digSoundTimer = 1.3;
        }
        else{
            digSoundTimer -= 1/60;
        }
        if(random() < 0.01){
            if(random() < 0.05){
                let rand = random([1,2,3]);
                if(rand == 1){
                    curPlayer.invBlock.addItem("Gem", 1, true);
                }
                else if(rand == 2){
                    curPlayer.invBlock.addItem("Black Gem", 1, true);
                }
                else if(rand == 3){
                    curPlayer.invBlock.addItem("Philosopher's Stone", 1, true);
                }
            } 
            else curPlayer.invBlock.addItem("Rock", 1, true);
        }
    }
}

function dig(x, y, amt, playerDiging, rayStart) {
    x = floor(x / TILESIZE);
    y = floor(y / TILESIZE);
    
    let chunkPos = testMap.globalToChunk(x*TILESIZE,y*TILESIZE);
    
    x = x-(chunkPos.x*CHUNKSIZE);
    y = y-(chunkPos.y*CHUNKSIZE);
    let index = x + y * CHUNKSIZE;

    if(rayStart != undefined){
        // Calculate distance and angle for effects
        const digX = (chunkPos.x * CHUNKSIZE + floor(x)) * TILESIZE;
        const digY = (chunkPos.y * CHUNKSIZE + floor(y)) * TILESIZE;
        const distance = curPlayer.pos.dist(createVector(digX, digY));
        const angle = atan2(digY - curPlayer.pos.y, digX - curPlayer.pos.x);

        // Clear guide line from player to target (monochrome for clarity) and leave room for the tool sprite
        push();
        stroke(245, 245, 245, 70);
        strokeWeight(4);
        const startX = curPlayer.pos.x - camera.pos.x + (width / 2);
        const startY = curPlayer.pos.y - camera.pos.y + (height / 2);
        const targetX = digX - camera.pos.x + (width / 2);
        const targetY = digY - camera.pos.y + (height / 2);
        const dx = targetX - startX;
        const dy = targetY - startY;
        const len = sqrt(dx * dx + dy * dy);
        const dirX = len !== 0 ? dx / len : 0;
        const dirY = len !== 0 ? dy / len : 0;
        const offset = 40;
        const shorten = 30; // shorten further so the tool sprite is clear
        const usableLen = max(0, len - offset);
        const drawnLen = usableLen > shorten ? usableLen - shorten : usableLen;
        const startXOffset = startX + dirX * offset;
        const startYOffset = startY + dirY * offset;
        const endX = startXOffset + dirX * drawnLen;
        const endY = startYOffset + dirY * drawnLen;
        line(startXOffset, startYOffset, endX, endY);
        pop();

        // Shovel swing arc near the player
        push();
        translate(curPlayer.pos.x - camera.pos.x + (width / 2), curPlayer.pos.y - camera.pos.y + (height / 2));
        rotate(angle);
        noStroke();
        fill(255, 255, 255, 200);
        beginShape();
        vertex(0, 0);
        vertex(18, -10);
        vertex(38, -2);
        vertex(22, 12);
        endShape(CLOSE);
        pop();

        // Impact burst at dig location (no circles)
        push();
        translate(digX - camera.pos.x + (width / 2), digY - camera.pos.y + (height / 2));

            // Draw current shovel head to show action
            drawShovelHead(0, 0, angle + PI / 2, getEquippedShovelImage());

        // Floating dirt particles with text-style animation
        for (let i = 0; i < 4; i++) {
            spawnFloatingText(0, digX + random(-6, 6), digY + random(-6, 6), "dirtParticle", false);
        }

        // Directional dust spray away from the player
        const sprayDir = angle + PI; // push dust away from player
        for (let i = 0; i < 10; i++) {
            const spread = random(-0.5, 0.5);
            const len = random(12, 24);
            const px = cos(sprayDir + spread) * len;
            const py = sin(sprayDir + spread) * len;
            stroke(240, 240, 240, 210);
            strokeWeight(random(2.2, 3.8));
            line(0, 0, px, py);
        }

        // Compact dirt chunks with brighter tones
        for (let i = 0; i < 6; i++) {
            push();
            const chunkAngle = sprayDir + random(-0.7, 0.7);
            const chunkDist = random(9, 19);
            translate(cos(chunkAngle) * chunkDist, sin(chunkAngle) * chunkDist);
            rotate(frameCount * 0.12 + i);
            fill(220, 220, 220);
            stroke(70, 70, 70);
            strokeWeight(1);
            rectMode(CENTER);
            rect(0, 0, random(4, 8), random(3, 6));
            pop();
        }

        // Textured dirt flakes with fade motion
        if (typeof dirtParticleImg !== 'undefined' && dirtParticleImg) {
            imageMode(CENTER);
            for (let i = 0; i < 7; i++) {
                const life = (sin(frameCount * 0.25 + i * 0.9) + 1) * 0.5; // 0..1 fade
                const drift = random(10, 22) * (0.6 + life * 0.6);
                const a = sprayDir + random(-0.55, 0.55);
                const px = cos(a) * drift;
                const py = sin(a) * drift;
                push();
                translate(px, py);
                rotate(a + frameCount * 0.08);
                const alpha = 90 + life * 110;
                tint(255, alpha);
                const size = TILESIZE * 0.28 * (0.8 + life * 0.7);
                image(dirtParticleImg, 0, 0, size, size);
                pop();
            }
            noTint();
        }

        pop();
    }

    if(playerDiging){
        if(testMap.chunks[chunkPos.x+","+chunkPos.y] != undefined){
            if(amt > 0){
                dirtInv += amt;
            }
            else{
                dirtInv += amt;
                if (testMap.chunks[chunkPos.x+","+chunkPos.y].data[index] > 1.3){
                    dirtInv -= testMap.chunks[chunkPos.x+","+chunkPos.y].data[index]-1.3;
                }
            }
        }
    }

    socket.emit("update_node", {chunkPos: (chunkPos.x+","+chunkPos.y), index: index, amt: amt });
}


function cast(x,y, angle, placeBool){
    let chunkPos = testMap.globalToChunk(x,y);
    if(testMap.chunks[chunkPos.x+","+chunkPos.y] == undefined) return;
    
    x = floor(x / TILESIZE);
    y = floor(y / TILESIZE);
    let tempRay = createVector(x,y);

    x = x-(chunkPos.x*CHUNKSIZE);
    y = y-(chunkPos.y*CHUNKSIZE);
    let index = x + y * CHUNKSIZE;

    if(testMap.chunks[chunkPos.x+","+chunkPos.y].data[index] > 0) return {cx: chunkPos.x, cy: chunkPos.y, x: x, y: y};

    let playerToMouse = (round(curPlayer.pos.dist(createVector((mouseX + camera.pos.x - (width / 2)), (mouseY + camera.pos.y - (height / 2))))/TILESIZE)+1)*TILESIZE;
    let playerToTile = curPlayer.pos.dist(createVector(((chunkPos.x*CHUNKSIZE+x)*TILESIZE), ((chunkPos.y*CHUNKSIZE+y)*TILESIZE)));

    while(testMap.chunks[chunkPos.x+","+chunkPos.y].data[index] == 0){
      x += cos(angle);
      y += sin(angle);
      
      //reset when ray goes to the next chunk
      if(x >= CHUNKSIZE){
        x = x - CHUNKSIZE;
        chunkPos.x += 1;
      }
      if(x < 0){
            x = x + CHUNKSIZE;
            chunkPos.x -= 1;
        }
          if(y >= CHUNKSIZE){
            y = y - CHUNKSIZE;
            chunkPos.y += 1;
        }
        if(y < 0){
            y = y + CHUNKSIZE;
            chunkPos.y -= 1;
          }
          
        index = floor(x) + floor(y) * CHUNKSIZE;
        
        if(placeBool){
            if(testMap.chunks[chunkPos.x+","+chunkPos.y].data[index] >= 1.3){
                x -= 1*cos(angle);
                y -= 1*sin(angle);
                return {cx: chunkPos.x, cy: chunkPos.y, x: floor(x), y: floor(y)};
            }
        }
          
        playerToTile = curPlayer.pos.dist(createVector(((chunkPos.x*CHUNKSIZE+x)*TILESIZE), ((chunkPos.y*CHUNKSIZE+y)*TILESIZE)));
        if(playerToTile > playerToMouse) return;
    }

    return {cx: chunkPos.x, cy: chunkPos.y, x: floor(x), y: floor(y), rayStart: tempRay};
}




//temp mineing functions

function playerMine(x,y, amount){
    let ray = createVector(x-curPlayer.pos.x, y-curPlayer.pos.y);

    let digSpot = ironCast(curPlayer.pos.x, curPlayer.pos.y, ray.heading(), (amount < 0));
    if(digSpot != undefined){
        mine(((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE), amount, true, digSpot.rayStart);
        
        //2 extra digs to make a better path for walking
        let digSpot2;
        let digSpot3;
        
        if(abs(ray.heading()) >= 0 && abs(ray.heading()) <= 22.5){
            digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x, y: digSpot.y+1};
            digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x, y: digSpot.y-1};
        }
        else if(abs(ray.heading()) > 22.5 && abs(ray.heading()) <= 67.5){
            if(ray.heading() > 0){
                digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y+1};
                digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y-1};
            }
            else{
                digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y-1};
                digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y+1};
            }
        }
        else if(abs(ray.heading()) > 67.5 && abs(ray.heading()) <= 112.5){
            digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y};
            digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y};
        }
        else if(abs(ray.heading()) > 112.5 && abs(ray.heading()) <= 157.5){
            if(ray.heading() > 0){
                digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y-1};
                digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y+1};
            }
            else{
                digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x-1, y: digSpot.y+1};
                digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x+1, y: digSpot.y-1};
            }
        }
        else if(abs(ray.heading()) > 157.5 && abs(ray.heading()) <= 180){
            digSpot2 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x, y: digSpot.y-1};
            digSpot3 = {cx: digSpot.cx, cy: digSpot.cy, x: digSpot.x, y: digSpot.y+1};
        }

        if(digSpot2 != undefined) mine(((digSpot2.cx*CHUNKSIZE+digSpot2.x)*TILESIZE), ((digSpot2.cy*CHUNKSIZE+digSpot2.y)*TILESIZE), amount, true, digSpot.rayStart);
        if(digSpot3 != undefined) mine(((digSpot3.cx*CHUNKSIZE+digSpot3.x)*TILESIZE), ((digSpot3.cy*CHUNKSIZE+digSpot3.y)*TILESIZE), amount, true, digSpot.rayStart);
        
        if(digSoundTimer <= 0){
            if(amount > 0){
                let temp = new SoundObj("digging.wav", ((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE));
                testMap.chunks[digSpot.cx+","+digSpot.cy].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "digging.wav", cPos: {x: digSpot.cx, y: digSpot.cy}, pos:{x: ((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), y: ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE)}, id: temp.id});
            }
            else{
                let temp = new SoundObj("placing_dirt.wav", ((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE));
                testMap.chunks[digSpot.cx+","+digSpot.cy].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "placing_dirt.wav", cPos: {x: digSpot.cx, y: digSpot.cy}, pos:{x: ((digSpot.cx*CHUNKSIZE+digSpot.x)*TILESIZE), y: ((digSpot.cy*CHUNKSIZE+digSpot.y)*TILESIZE)}, id: temp.id});
            }
            digSoundTimer = 1.3;
        }
        else{
            digSoundTimer -= 1/60;
        }
    }
}

function mine(x, y, amt, playerDiging, rayStart) {
    x = floor(x / TILESIZE);
    y = floor(y / TILESIZE);
    
    let chunkPos = testMap.globalToChunk(x*TILESIZE,y*TILESIZE);
    
    x = x-(chunkPos.x*CHUNKSIZE);
    y = y-(chunkPos.y*CHUNKSIZE);
    let index = x + y * CHUNKSIZE;

    if(rayStart != undefined){
        // Calculate distance and angle for effects
        const digX = (chunkPos.x * CHUNKSIZE + floor(x)) * TILESIZE;
        const digY = (chunkPos.y * CHUNKSIZE + floor(y)) * TILESIZE;
        const distance = curPlayer.pos.dist(createVector(digX, digY));
        const angle = atan2(digY - curPlayer.pos.y, digX - curPlayer.pos.x);

        // Clear steel guide line full length (monochrome) and leave room for tool sprite
        push();
        stroke(240, 240, 240, 70);
        strokeWeight(3);
        const startX = curPlayer.pos.x - camera.pos.x + (width / 2);
        const startY = curPlayer.pos.y - camera.pos.y + (height / 2);
        const targetX = digX - camera.pos.x + (width / 2);
        const targetY = digY - camera.pos.y + (height / 2);
        const dx = targetX - startX;
        const dy = targetY - startY;
        const len = sqrt(dx * dx + dy * dy);
        const dirX = len !== 0 ? dx / len : 0;
        const dirY = len !== 0 ? dy / len : 0;
        const offset = 40;
        const shorten = 30; // shorten further so the tool sprite is clear
        const usableLen = max(0, len - offset);
        const drawnLen = usableLen > shorten ? usableLen - shorten : usableLen;
        const startXOffset = startX + dirX * offset;
        const startYOffset = startY + dirY * offset;
        const endX = startXOffset + dirX * drawnLen;
        const endY = startYOffset + dirY * drawnLen;
        line(startXOffset, startYOffset, endX, endY);
        pop();

        // Impact clarity: sparks + shards (no circles)
        push();
        translate(digX - camera.pos.x + (width / 2), digY - camera.pos.y + (height / 2));

        // Draw shovel/pick head from equipped tool to show action
        drawShovelHead(0, 0, angle + PI / 2, getEquippedShovelImage());

        // Floating metal particles with text-style animation
        for (let i = 0; i < 4; i++) {
            spawnFloatingText(0, digX + random(-6, 6), digY + random(-6, 6), "metalParticle", false);
        }

        // Sparks (amber for contrast)
        for (let i = 0; i < 12; i++) {
            const sparkAngle = angle + PI + random(-0.8, 0.8);
            const len = random(14, 26);
            const px = cos(sparkAngle) * len;
            const py = sin(sparkAngle) * len;
            stroke(255, 255, 255, 220);
            strokeWeight(random(2.2, 3.5));
            line(0, 0, px, py);
        }

        // Metal shards
        for (let i = 0; i < 6; i++) {
            push();
            const shardAngle = angle + PI + random(-0.6, 0.6);
            const shardDist = random(11, 22);
            translate(cos(shardAngle) * shardDist, sin(shardAngle) * shardDist);
            rotate(frameCount * 0.18 + i);
            fill(230, 230, 230);
            stroke(90, 90, 90);
            strokeWeight(1.2);
            rectMode(CENTER);
            rect(0, 0, random(3, 7), random(3, 7));
            pop();
        }

        pop();
    }

    if(playerDiging){
        if(testMap.chunks[chunkPos.x+","+chunkPos.y] != undefined){
            if(amt > 0){
                if(random() < 0.01){
                    curPlayer.invBlock.addItem("Raw Metal", 1, true);
                }
            }
        }
    }

    socket.emit("update_iron_node", {chunkPos: (chunkPos.x+","+chunkPos.y), index: index, amt: amt });
}

function ironCast(x,y, angle, placeBool){
    let chunkPos = testMap.globalToChunk(x,y);
    if(testMap.chunks[chunkPos.x+","+chunkPos.y] == undefined) return;
    
    x = floor(x / TILESIZE);
    y = floor(y / TILESIZE);
    let tempRay = createVector(x,y);

    x = x-(chunkPos.x*CHUNKSIZE);
    y = y-(chunkPos.y*CHUNKSIZE);
    let index = x + y * CHUNKSIZE;

    if(testMap.chunks[chunkPos.x+","+chunkPos.y].iron_data[index] > 0) return {cx: chunkPos.x, cy: chunkPos.y, x: x, y: y};

    let playerToMouse = (round(curPlayer.pos.dist(createVector((mouseX + camera.pos.x - (width / 2)), (mouseY + camera.pos.y - (height / 2))))/TILESIZE)+1)*TILESIZE;
    let playerToTile = curPlayer.pos.dist(createVector(((chunkPos.x*CHUNKSIZE+x)*TILESIZE), ((chunkPos.y*CHUNKSIZE+y)*TILESIZE)));

    while(testMap.chunks[chunkPos.x+","+chunkPos.y].iron_data[index] == 0){
      x += cos(angle);
      y += sin(angle);
      
      //reset when ray goes to the next chunk
      if(x >= CHUNKSIZE){
        x = x - CHUNKSIZE;
        chunkPos.x += 1;
      }
      if(x < 0){
            x = x + CHUNKSIZE;
            chunkPos.x -= 1;
        }
          if(y >= CHUNKSIZE){
            y = y - CHUNKSIZE;
            chunkPos.y += 1;
        }
        if(y < 0){
            y = y + CHUNKSIZE;
            chunkPos.y -= 1;
          }
          
        index = floor(x) + floor(y) * CHUNKSIZE;
        
        if(placeBool){
            if(testMap.chunks[chunkPos.x+","+chunkPos.y].iron_data[index] >= 1.3){
                x -= 1*cos(angle);
                y -= 1*sin(angle);
                return {cx: chunkPos.x, cy: chunkPos.y, x: floor(x), y: floor(y)};
            }
        }
          
        playerToTile = curPlayer.pos.dist(createVector(((chunkPos.x*CHUNKSIZE+x)*TILESIZE), ((chunkPos.y*CHUNKSIZE+y)*TILESIZE)));
        if(playerToTile > playerToMouse) return;
    }

    return {cx: chunkPos.x, cy: chunkPos.y, x: floor(x), y: floor(y), rayStart: tempRay};
}