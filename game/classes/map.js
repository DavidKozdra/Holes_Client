const TILESIZE = 32;
const CHUNKSIZE = 50; //how many nodes in 1 direction

class Map{
    constructor(){
        this.chunks = {}; //referance with a string "x,y"     {ex. chunks["0,0"]}
        this.chunkBools = {}; //same referance, just used so you dont ask for the same chunk tons of times undefined if never asked for, false if asked, true if loaded
        this.brains = []; //a list of npc brains (might move this to chunk later)
    }

    getChunk(x,y){
        if(this.chunkBools[x+","+y] == undefined && this.chunks[x+","+y] == undefined){
            socket.emit("get_chunk", (x+","+y));
            this.chunkBools[x+","+y] = false;
        }
        if(this.chunkBools[x+","+y] === true) return this.chunks[x+","+y];
    }

    globalToChunk(x,y){
        let pos = {};
        pos.x = floor(x/(CHUNKSIZE*TILESIZE));
        pos.y = floor(y/(CHUNKSIZE*TILESIZE));
        return pos;
    }

    update(){
        let chunkPos = this.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
        for(let yOff = -1; yOff < 2; yOff++){
            for(let xOff = -1; xOff < 2; xOff++){
                let chunk = this.getChunk(chunkPos.x + xOff,chunkPos.y + yOff);
                if(chunk != undefined) chunk.update();
            }
        }
        for(let i=this.brains.length-1; i>=0; i--){
            this.brains[i].update();
            if(this.brains[i].deleteTag){
                this.brains.splice(i, 1);
            }
        }
    }

    render(){
        let chunkPos = this.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);


        let cpos = {};
        for(let yOff = -1; yOff < 2; yOff++){
            for(let xOff = -1; xOff < 2; xOff++){
                cpos.x = ((chunkPos.x+xOff)*CHUNKSIZE*TILESIZE)-camera.pos.x+(width/2);
                cpos.y = ((chunkPos.y+yOff)*CHUNKSIZE*TILESIZE)-camera.pos.y+(height/2);
                image(dirtFloorImg, cpos.x, cpos.y, 1600, 1600 );
            }
        }

        for(let yOff = -1; yOff < 2; yOff++){
            for(let xOff = -1; xOff < 2; xOff++){
                let chunk = this.getChunk(chunkPos.x + xOff,chunkPos.y + yOff);
                if(chunk != undefined) chunk.render();
                
                if(Debuging){
                    push();
                    noFill();
                    stroke(255,0,0);
                    strokeWeight(2);
                    rect(((chunkPos.x+xOff)*CHUNKSIZE*TILESIZE)-camera.pos.x+(width/2), ((chunkPos.y+yOff)*CHUNKSIZE*TILESIZE)-camera.pos.y+(height/2), CHUNKSIZE*TILESIZE, CHUNKSIZE*TILESIZE);
                    fill(255);
                    noStroke();
                    textSize(15);
                    text((chunkPos.x + xOff)+","+(chunkPos.y + yOff), ((chunkPos.x+xOff)*CHUNKSIZE*TILESIZE)-camera.pos.x+(width/2)+5, ((chunkPos.y+yOff)*CHUNKSIZE*TILESIZE)-camera.pos.y+(height/2)+20);
                    pop();
                }
                if(curPlayer != undefined){
                    if(curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar] != ""){
                        if(curPlayer.invBlock.items[curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]] != undefined){
                            if(curPlayer.invBlock.items[curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]].itemName == "Map"){
                                push();
                                noFill();
                                stroke(255,0,0);
                                strokeWeight(2);
                                rect(((chunkPos.x+xOff)*CHUNKSIZE*TILESIZE)-camera.pos.x+(width/2), ((chunkPos.y+yOff)*CHUNKSIZE*TILESIZE)-camera.pos.y+(height/2), CHUNKSIZE*TILESIZE, CHUNKSIZE*TILESIZE);
                                fill(255);
                                noStroke();
                                textSize(15);
                                text((chunkPos.x + xOff)+","+(-1*(chunkPos.y + yOff)), ((chunkPos.x+xOff)*CHUNKSIZE*TILESIZE)-camera.pos.x+(width/2)+5, ((chunkPos.y+yOff)*CHUNKSIZE*TILESIZE)-camera.pos.y+(height/2)+20);
                                pop();
                            }
                        }
                    }
                }
                
            }
        }

        if(Debuging){
            for(let i=this.brains.length-1; i>=0; i--){
                this.brains[i].debugRender();
            }
        }
    }
}

class Chunk{
    constructor(x,y){
        this.data = []; // Data is very obvious, -1 is unbreakable, 0 is nothing, >0 is block
        this.iron_data = [];
        this.cx = x; //chunk pos x
        this.cy = y; //chunk pos y
        this.objects = []; // list of objects (might need sorting if we make chunks bigger or have tons of objects in a chunk)
        this.projectiles = [];
        this.soundObjs = [];
        this.floatingTexts = [];
    }

    cordToScreen(x,y){
        let val = {};
        val.x = (x)*TILESIZE + (this.cx*CHUNKSIZE*TILESIZE)-camera.pos.x+(width/2);
        val.y = (y)*TILESIZE + (this.cy*CHUNKSIZE*TILESIZE)-camera.pos.y+(height/2);
        return val;
    }

    update(){
        for(let i = this.objects.length-1; i >= 0; i--){
            this.objects[i].update();
            if(this.objects[i].deleteTag){
                this.objects.splice(i, 1);
                this.objects.sort((a,b) => a.z - b.z);
            }
        }
        for(let i = this.projectiles.length-1; i >= 0; i--){
            this.projectiles[i].update();
            if(this.projectiles[i].deleteTag){
                this.projectiles.splice(i, 1);
            }
        }
        for(let i = this.soundObjs.length-1; i >= 0; i--){
            this.soundObjs[i].update();
            if(this.soundObjs[i].deleteTag){
                this.soundObjs.splice(i, 1);
            }
        }
        for(let i = this.floatingTexts.length-1; i >= 0; i--){
            this.floatingTexts[i].update();
            if(this.floatingTexts[i].deleteTag){
                this.floatingTexts.splice(i, 1);
            }
        }
    }
  
    DebugDraw(){
        push();
        for (let x = 0; x < CHUNKSIZE; x++){
            for (let y = 0; y < CHUNKSIZE; y++){
                let index = x + y * CHUNKSIZE;
                let pos = this.cordToScreen(x,y);
                fill(map(this.data[index], 0, 1, 255, 0));
                circle(pos.x, pos.y, this.data[index]*TILESIZE);
            }
        }
        pop();
    }
  
    render(){
        for(let i = 0; i < this.objects.length; i++){
            if(this.objects[i].z < 2){
                this.objects[i].render("none");
            }
        }
        //rendered under other stuff to help hide collishion problems
        for(let i = 0; i < this.projectiles.length; i++){
            this.projectiles[i].render();
        }
        // floating combat text
        for(let i = 0; i < this.floatingTexts.length; i++){
            this.floatingTexts[i].render();
        }
        
        push();
        beginClip();
        for (let x = 0; x < CHUNKSIZE; x++){
            for (let y = 0; y < CHUNKSIZE; y++){
                //holds the values at each corner
                let corners = [
                    this.iron_data[x + y * CHUNKSIZE],
                    this.iron_data[(x + 1) + y * CHUNKSIZE],
                    this.iron_data[(x + 1) + (y + 1) * CHUNKSIZE],
                    this.iron_data[x + (y + 1) * CHUNKSIZE]
                ];
                if(x == CHUNKSIZE-1){
                    if(testMap.chunks[(this.cx+1)+","+this.cy] != undefined){
                        // right neighbor first column
                        corners[1] = testMap.chunks[(this.cx+1)+","+this.cy].iron_data[0 + y * CHUNKSIZE];
                        corners[2] = testMap.chunks[(this.cx+1)+","+this.cy].iron_data[0 + (y + 1) * CHUNKSIZE];
                    }
                }
                if(y == CHUNKSIZE-1){
                    if(testMap.chunks[this.cx+","+(this.cy+1)] != undefined){
                        // bottom neighbor row
                        corners[2] = testMap.chunks[this.cx+","+(this.cy+1)].iron_data[(x + 1) + 0 * CHUNKSIZE];
                        corners[3] = testMap.chunks[this.cx+","+(this.cy+1)].iron_data[x + 0 * CHUNKSIZE];
                    }
                }
                if(x == CHUNKSIZE-1 && y == CHUNKSIZE-1){
                    if(testMap.chunks[(this.cx+1)+","+(this.cy+1)] != undefined){
                        corners[2] = testMap.chunks[(this.cx+1)+","+(this.cy+1)].iron_data[0 + 0 * CHUNKSIZE];
                    }
                }
                for(let i=0; i < 4; i++){
                    if(corners[i] == -1) corners[i] = 1;
                    corners[i] += 0.7;
                }
                //holds the screen cordinates of each corner
                let scCorners = [this.cordToScreen(x,y),this.cordToScreen(x+1,y),
                                 this.cordToScreen(x+1,y+1),this.cordToScreen(x,y+1)];

                //scCorners = [{x: x*TILESIZE/4, y: y*TILESIZE/4},{x: (x+1)*TILESIZE/4, y: y*TILESIZE/4},
                //             {x: (x+1)*TILESIZE/4, y: (y+1)*TILESIZE/4},{x: x*TILESIZE/4, y: (y+1)*TILESIZE/4}];
                
                //an attempt to reduce banding effects
                // scCorners[0].x -= 1.5; scCorners[0].y -= 1.5;
                // scCorners[1].x += 1.5; scCorners[1].y -= 1.5;
                // scCorners[2].x += 1.5; scCorners[2].y += 1.5;
                // scCorners[3].x -= 1.5; scCorners[3].y += 1.5;

                let state = getState(corners[0],corners[1],corners[2],corners[3]);
                let amt = 0;

                //Visual Representation of positions:
                //                   
                //  sc[0]--a--sc[1]  
                //    |         |    
                //    d         b    
                //    |         |    
                //  sc[3]--c--sc[2]  
                //                   

                //the side positions, adjsted based on the values at each corner
                let a = {x: 0, y: scCorners[0].y};
                amt = (1-corners[0])/(corners[1]-corners[0]);
                a.x = lerp(scCorners[0].x,scCorners[1].x,amt);

                let b = {x: scCorners[1].x, y: 0};
                amt = (1-corners[1])/(corners[2]-corners[1]);
                b.y = lerp(scCorners[1].y,scCorners[2].y,amt);

                let c = {x: 0, y: scCorners[2].y};
                amt = (1-corners[2])/(corners[3]-corners[2]);
                c.x = lerp(scCorners[2].x,scCorners[3].x,amt);

                let d = {x: scCorners[0].x, y: 0};
                amt = (1-corners[0])/(corners[3]-corners[0]);
                d.y = lerp(scCorners[0].y,scCorners[3].y,amt);

                
                
                //draw the specific shape based on which corner values > 0
                switch(state){
                    case 1:
                        //line(c.x,c.y,d.x,d.y);
                        beginShape();
                        vertex(d.x,d.y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(c.x,c.y);
                        endShape();
                        //circle(scCorners[3].x, scCorners[3].y, (corners[3]-0.6)*TILESIZE);  //TODO: revisit small nodes rendering werid
                        break;
                    case 2:
                        //line(b.x,b.y,c.x,c.y);
                        beginShape();
                        vertex(c.x,c.y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(b.x,b.y);
                        endShape();
                        //circle(scCorners[2].x, scCorners[2].y, (corners[2]-0.6)*TILESIZE);  //TODO: revisit small nodes rendering werid
                        break;
                    case 3:
                        //line(b.x,b.y,d.x,d.y);
                        beginShape();
                        vertex(d.x,d.y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(b.x,b.y);
                        endShape();
                        break;
                    case 4:
                        //line(b.x,b.y,a.x,a.y);
                        beginShape();
                        vertex(b.x,b.y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        vertex(a.x,a.y);
                        endShape();
                        //circle(scCorners[1].x, scCorners[1].y, (corners[1]-0.6)*TILESIZE);  //TODO: revisit small nodes rendering werid
                        break;
                    case 5:
                        //line(a.x,a.y,d.x,d.y);
                        //line(b.x,b.y,c.x,c.y);
                        beginShape();
                        vertex(d.x,d.y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(c.x,c.y);
                        vertex(b.x,b.y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 6:
                        //line(a.x,a.y,c.x,c.y);
                        beginShape();
                        vertex(a.x,a.y);
                        vertex(c.x,c.y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        endShape();
                        break;
                    case 7:
                        //line(a.x,a.y,d.x,d.y);
                        beginShape();
                        vertex(d.x,d.y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 8:
                        //line(a.x,a.y,d.x,d.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(d.x,d.y);
                        vertex(a.x,a.y);
                        endShape();
                        //circle(scCorners[0].x, scCorners[0].y, (corners[0]-0.6)*TILESIZE);  //TODO: revisit small nodes rendering werid
                        break;
                    case 9:
                        //line(a.x,a.y,c.x,c.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(c.x,c.y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 10:
                        //line(a.x,a.y,b.x,b.y);
                        //line(d.x,d.y,c.x,c.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(d.x,d.y);
                        vertex(c.x,c.y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(b.x,b.y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 11:
                        //line(a.x,a.y,b.x,b.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(b.x,b.y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 12:
                        //line(b.x,b.y,d.x,d.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(d.x,d.y);
                        vertex(b.x,b.y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        endShape();
                        break;
                    case 13:
                        //line(b.x,b.y,c.x,c.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(c.x,c.y);
                        vertex(b.x,b.y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        endShape();
                        break;
                    case 14:
                        //line(c.x,c.y,d.x,d.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(d.x,d.y);
                        vertex(c.x,c.y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        endShape();
                        break;
                    case 15:
                        rect(scCorners[0].x, scCorners[0].y, TILESIZE, TILESIZE);
                }
            }
        }

        endClip();
        image(chunkIronImg, this.cx*CHUNKSIZE*TILESIZE - camera.pos.x + width/2, this.cy*CHUNKSIZE*TILESIZE - camera.pos.y + height/2, 1600, 1600);
        pop();
        
        push();
        beginClip();
        fill("#3B1725"); //old one is #3B1725
        //noStroke();
        for (let x = 0; x < CHUNKSIZE; x++){
            for (let y = 0; y < CHUNKSIZE; y++){
                //holds the values at each corner
                let corners = [
                    this.data[x + y * CHUNKSIZE],
                    this.data[(x + 1) + y * CHUNKSIZE],
                    this.data[(x + 1) + (y + 1) * CHUNKSIZE],
                    this.data[x + (y + 1) * CHUNKSIZE]
                ];
                if(x == CHUNKSIZE-1){
                    if(testMap.chunks[(this.cx+1)+","+this.cy] != undefined){
                        corners[1] = testMap.chunks[(this.cx+1)+","+this.cy].data[0 + y * CHUNKSIZE];
                        corners[2] = testMap.chunks[(this.cx+1)+","+this.cy].data[0 + (y + 1) * CHUNKSIZE];
                    }
                }
                if(y == CHUNKSIZE-1){
                    if(testMap.chunks[this.cx+","+(this.cy+1)] != undefined){
                        corners[2] = testMap.chunks[this.cx+","+(this.cy+1)].data[(x + 1) + 0 * CHUNKSIZE];
                        corners[3] = testMap.chunks[this.cx+","+(this.cy+1)].data[x + 0 * CHUNKSIZE];
                    }
                }
                if(x == CHUNKSIZE-1 && y == CHUNKSIZE-1){
                    if(testMap.chunks[(this.cx+1)+","+(this.cy+1)] != undefined){
                        corners[2] = testMap.chunks[(this.cx+1)+","+(this.cy+1)].data[0 + 0 * CHUNKSIZE];
                    }
                }
                for(let i=0; i < 4; i++){
                    if(corners[i] == -1) corners[i] = 1;
                    corners[i] += 0.7;
                }
                //holds the screen cordinates of each corner
                let scCorners = [this.cordToScreen(x,y),this.cordToScreen(x+1,y),
                                 this.cordToScreen(x+1,y+1),this.cordToScreen(x,y+1)];

                //scCorners = [{x: x*TILESIZE/4, y: y*TILESIZE/4},{x: (x+1)*TILESIZE/4, y: y*TILESIZE/4},
                //             {x: (x+1)*TILESIZE/4, y: (y+1)*TILESIZE/4},{x: x*TILESIZE/4, y: (y+1)*TILESIZE/4}];
                
                //an attempt to reduce banding effects
                // scCorners[0].x -= 1.5; scCorners[0].y -= 1.5;
                // scCorners[1].x += 1.5; scCorners[1].y -= 1.5;
                // scCorners[2].x += 1.5; scCorners[2].y += 1.5;
                // scCorners[3].x -= 1.5; scCorners[3].y += 1.5;

                let state = getState(corners[0],corners[1],corners[2],corners[3]);
                let amt = 0;

                //Visual Representation of positions:
                //                   
                //  sc[0]--a--sc[1]  
                //    |         |    
                //    d         b    
                //    |         |    
                //  sc[3]--c--sc[2]  
                //                   

                //the side positions, adjsted based on the values at each corner
                let a = {x: 0, y: scCorners[0].y};
                amt = (1-corners[0])/(corners[1]-corners[0]);
                a.x = lerp(scCorners[0].x,scCorners[1].x,amt);

                let b = {x: scCorners[1].x, y: 0};
                amt = (1-corners[1])/(corners[2]-corners[1]);
                b.y = lerp(scCorners[1].y,scCorners[2].y,amt);

                let c = {x: 0, y: scCorners[2].y};
                amt = (1-corners[2])/(corners[3]-corners[2]);
                c.x = lerp(scCorners[2].x,scCorners[3].x,amt);

                let d = {x: scCorners[0].x, y: 0};
                amt = (1-corners[0])/(corners[3]-corners[0]);
                d.y = lerp(scCorners[0].y,scCorners[3].y,amt);

                
                
                //draw the specific shape based on which corner values > 0
                switch(state){
                    case 1:
                        //line(c.x,c.y,d.x,d.y);
                        beginShape();
                        vertex(d.x,d.y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(c.x,c.y);
                        endShape();
                        //circle(scCorners[3].x, scCorners[3].y, (corners[3]-0.6)*TILESIZE);  //TODO: revisit small nodes rendering werid
                        break;
                    case 2:
                        //line(b.x,b.y,c.x,c.y);
                        beginShape();
                        vertex(c.x,c.y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(b.x,b.y);
                        endShape();
                        //circle(scCorners[2].x, scCorners[2].y, (corners[2]-0.6)*TILESIZE);  //TODO: revisit small nodes rendering werid
                        break;
                    case 3:
                        //line(b.x,b.y,d.x,d.y);
                        beginShape();
                        vertex(d.x,d.y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(b.x,b.y);
                        endShape();
                        break;
                    case 4:
                        //line(b.x,b.y,a.x,a.y);
                        beginShape();
                        vertex(b.x,b.y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        vertex(a.x,a.y);
                        endShape();
                        //circle(scCorners[1].x, scCorners[1].y, (corners[1]-0.6)*TILESIZE);  //TODO: revisit small nodes rendering werid
                        break;
                    case 5:
                        //line(a.x,a.y,d.x,d.y);
                        //line(b.x,b.y,c.x,c.y);
                        beginShape();
                        vertex(d.x,d.y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(c.x,c.y);
                        vertex(b.x,b.y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 6:
                        //line(a.x,a.y,c.x,c.y);
                        beginShape();
                        vertex(a.x,a.y);
                        vertex(c.x,c.y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        endShape();
                        break;
                    case 7:
                        //line(a.x,a.y,d.x,d.y);
                        beginShape();
                        vertex(d.x,d.y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 8:
                        //line(a.x,a.y,d.x,d.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(d.x,d.y);
                        vertex(a.x,a.y);
                        endShape();
                        //circle(scCorners[0].x, scCorners[0].y, (corners[0]-0.6)*TILESIZE);  //TODO: revisit small nodes rendering werid
                        break;
                    case 9:
                        //line(a.x,a.y,c.x,c.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(c.x,c.y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 10:
                        //line(a.x,a.y,b.x,b.y);
                        //line(d.x,d.y,c.x,c.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(d.x,d.y);
                        vertex(c.x,c.y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(b.x,b.y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 11:
                        //line(a.x,a.y,b.x,b.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(b.x,b.y);
                        vertex(a.x,a.y);
                        endShape();
                        break;
                    case 12:
                        //line(b.x,b.y,d.x,d.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(d.x,d.y);
                        vertex(b.x,b.y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        endShape();
                        break;
                    case 13:
                        //line(b.x,b.y,c.x,c.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(scCorners[3].x, scCorners[3].y);
                        vertex(c.x,c.y);
                        vertex(b.x,b.y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        endShape();
                        break;
                    case 14:
                        //line(c.x,c.y,d.x,d.y);
                        beginShape();
                        vertex(scCorners[0].x, scCorners[0].y);
                        vertex(d.x,d.y);
                        vertex(c.x,c.y);
                        vertex(scCorners[2].x, scCorners[2].y);
                        vertex(scCorners[1].x, scCorners[1].y);
                        endShape();
                        break;
                    case 15:
                        rect(scCorners[0].x, scCorners[0].y, TILESIZE, TILESIZE);
                }
            }
        }

        endClip();
        image(chunkDirtImg, this.cx*CHUNKSIZE*TILESIZE - camera.pos.x + width/2, this.cy*CHUNKSIZE*TILESIZE - camera.pos.y + height/2, 1600, 1600);
        pop();

        for(let i = 0; i < this.objects.length; i++){
            if(this.objects[i].z >= 2){
                this.objects[i].render("none");
            }
        }
    }

    toString(){
        let str = "";
        for (let y = 0; y < CHUNKSIZE; y++){
            for (let x = 0; x < CHUNKSIZE; x++){
                let index = x + y * CHUNKSIZE;
                str += this.data[index]*9;
                str += ",";
            }
            str += "\n";
        }

        return str;
    }
}

//converts corner values into a binary number? resulting in a uniqe int for each possible combination of corner vals
function getState(c1,c2,c3,c4){
    let val = 0;
    if(c1 >= 1) val+=8
    if(c2 >= 1) val+=4
    if(c3 >= 1) val+=2
    if(c4 >= 1) val+=1
    return val;
}