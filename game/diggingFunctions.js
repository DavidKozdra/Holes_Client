var digSoundTimer = 0;

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
        push();
        stroke(255,50);
        strokeWeight(10);
        line(
            curPlayer.pos.x -camera.pos.x+(width/2), 
            curPlayer.pos.y -camera.pos.y+(height/2), 
            (chunkPos.x*CHUNKSIZE+floor(x))*TILESIZE -camera.pos.x+(width/2), 
            (chunkPos.y*CHUNKSIZE+floor(y))*TILESIZE -camera.pos.y+(height/2)
        );
        pop();
        
        push();
        translate(((chunkPos.x*CHUNKSIZE+x)*TILESIZE) - camera.pos.x + (width/2), ((chunkPos.y*CHUNKSIZE+y)*TILESIZE) - camera.pos.y + (height/2));
        rotate(random(0, 360));
        fill("#492925");
        stroke(0);
        strokeWeight(2);
        rectMode(CENTER);
        rect(0,0, TILESIZE/2, TILESIZE/2);
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
        push();
        stroke(255,50);
        strokeWeight(10);
        line(
            curPlayer.pos.x -camera.pos.x+(width/2), 
            curPlayer.pos.y -camera.pos.y+(height/2), 
            (chunkPos.x*CHUNKSIZE+floor(x))*TILESIZE -camera.pos.x+(width/2), 
            (chunkPos.y*CHUNKSIZE+floor(y))*TILESIZE -camera.pos.y+(height/2)
        );
        pop();
        
        push();
        translate(((chunkPos.x*CHUNKSIZE+x)*TILESIZE) - camera.pos.x + (width/2), ((chunkPos.y*CHUNKSIZE+y)*TILESIZE) - camera.pos.y + (height/2));
        rotate(random(0, 360));
        fill("#492925");
        stroke(0);
        strokeWeight(2);
        rectMode(CENTER);
        rect(0,0, TILESIZE/2, TILESIZE/2);
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