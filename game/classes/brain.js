class Brain {
    constructor(vision){
        this.state = "Wander";
        this.target = null; //pos to chase
        this.targetEntity = null;
        this.stateTimer = 0;
        this.obj = null; //obj to move and stuff
        this.id = random(10000);
        this.vision = vision;
        this.deleteTag = false;
    }

    update(){
        if(this.obj != null){
            if(this.obj.deleteTag) return;

            this.stateTimer ++;
            if(this.state == "Wander"){
                this.wander();
                if (this.findTarget()){
                    this.stateTimer = 0;
                    this.state = "Chasing";
                }
            }
            if(this.state == "Chasing"){
                this.chase();
                if (!this.canSee(this.targetEntity.pos.x, this.targetEntity.pos.y)){
                    this.stateTimer = 0;
                    this.state = "Wander";
                    this.target = null;
                    this.targetEntity = null;
                }
            }
            if(this.state == "Space"){
                this.space();
            }
        }
    }

    wander(){
        //Move randomly
        if(this.target == null || this.obj.pos.dist(this.target) < 6){
            socket.emit("wander_request", {id: this.id, pos: {x: this.obj.pos.x, y: this.obj.pos.y}});
            return;
        }
        this.moveObjTowards(this.target.x,this.target.y,2);
    }

    chase(){
        //Move towards target
        if(this.obj.pos.dist(this.target) > projDic[this.obj.projName].sr){
            this.moveObjTowards(this.target.x,this.target.y,6);
        }
        else{ //if close enough spawn melee projectile and switch to space
            let chunkPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
            let toTarget = createVector(this.target.x,this.target.y).sub(this.obj.pos).setMag(50);
            let proj = createProjectile(this.obj.projName, this.obj.objName, this.obj.color, this.obj.pos.x, this.obj.pos.y, toTarget.heading());
            if(testMap.chunks[chunkPos.x+','+chunkPos.y] != undefined){
                testMap.chunks[chunkPos.x+','+chunkPos.y].projectiles.push(
                    proj
                );
                //tell the server you made a projectile
                socket.emit("new_proj", proj);
    
                let temp = new SoundObj("swing.wav", this.obj.pos.x, this.obj.pos.y);
                testMap.chunks[chunkPos.x+','+chunkPos.y].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "swing.wav", cPos: chunkPos, pos: {x: this.obj.pos.x, y: this.obj.pos.y}, id: temp.id});
            }

            this.stateTimer = 0;
            this.state = "Space";

        }
    }

    space(){
        // back up away from target until stateTimer == 120
        if(this.stateTimer < 120){
            this.target = this.obj.pos.copy().sub(this.targetEntity.pos).setMag(100).add(this.targetEntity.pos);
            if(this.obj.pos.dist(this.target) > 4){
                this.moveObjTowards(this.target.x, this.target.y, 4);
            }
            //If player gets too close, prolong retreat
            if(this.obj.pos.dist(this.targetEntity.pos) < 60){
                this.stateTimer = 0;
            }
            //If player gets too far, reduce retreat
            if(this.obj.pos.dist(this.targetEntity.pos) > 100){
                this.stateTimer += 5;
            }
        }
        else{
            this.target = this.targetEntity.pos;
            this.stateTimer = 0;
            this.state = "Chasing";
        }
    }

    findTarget(){
        if(this.obj == null) return;
        this.targetEntity = null;
        
        //sort players from closest to furthest
        let playerArray = Object.values(players);
        playerArray.push(curPlayer);

        playerArray.sort((a, b) => {
            let distA = this.obj.pos.dist(a.pos);
            let distB = this.obj.pos.dist(b.pos);
            return distA - distB;
        });

        playerArray.filter(player => {
            return this.obj.pos.dist(player.pos) < this.vision;
        });

        for(let i=0; i<playerArray.length; i++){
            if(this.canSee(playerArray[i].pos.x, playerArray[i].pos.y)){
                if(this.targetEntity == null){
                    this.targetEntity = playerArray[i];
                    this.target = playerArray[i].pos;
                    i = playerArray.length;
                }
            }
        }

        return this.targetEntity != null;
    }

    canSee(x,y){
        if(this.obj == null) return false;
        //check if there are any objects imbetween this.obj and x,y
        return createVector(x,y).dist(this.obj.pos) < this.vision;
    }

    moveObjTowards(x,y,speed){
        //TODO: collishion
        let oldChunkPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
        let xTile = floor(this.obj.pos.x / TILESIZE) - (oldChunkPos.x * CHUNKSIZE);
        let yTile = floor(this.obj.pos.y / TILESIZE) - (oldChunkPos.y * CHUNKSIZE);
        if(testMap.chunks[oldChunkPos.x+","+oldChunkPos.y].data[xTile + yTile * CHUNKSIZE] > 0){
            speed = speed/2;
        }
        this.obj.pos.add(createVector(x,y).sub(this.obj.pos).setMag(speed*(deltaTime/30)));

        socket.emit("update_obj", {
            cx: oldChunkPos.x, cy: oldChunkPos.y,
            objName: this.obj.objName,
            pos: {x: this.obj.pos.x, y: this.obj.pos.y},
            z: this.obj.z,
            id: this.obj.id,
            brainID: this.id,
            update_name: "hp",
            update_value: this.obj.hp
        });

        let newChunkPos = testMap.globalToChunk(this.obj.pos.x, this.obj.pos.y);
        if(oldChunkPos.x != newChunkPos.x || oldChunkPos.y != newChunkPos.y){
            let oldHp = this.obj.hp+0;
            this.obj.deleteTag = true;
            //console.log("trying to delete obj from brainID: ", this.id);
            socket.emit("delete_obj", {
                cx: oldChunkPos.x, 
                cy: oldChunkPos.y, 
                objName: this.obj.objName, 
                pos: {x: this.obj.pos.x, y: this.obj.pos.y}, 
                z: this.obj.z,
                brainID: this.id
            });

            let temp = createObject("Ant", this.obj.pos.x, this.obj.pos.y, 0, this.obj.color, this.obj.id, this.obj.ownerName, this.id);
            temp.hp = oldHp;

            let newChunk = testMap.chunks[newChunkPos.x+","+newChunkPos.y];
            if(newChunk != undefined){
                testMap.chunks[newChunkPos.x+","+newChunkPos.y].objects.push(temp);
                socket.emit("new_object", {
                    cx: newChunkPos.x, 
                    cy: newChunkPos.y, 
                    obj: temp
                })
                this.obj = temp;
            }
            else{
                this.obj = null;
            }
        }
    }

    giveBody(obj){
        this.obj = obj;
        this.obj.brainID = this.id;
    }

    debugRender(){
        if(this.target == null) return;
        push();
        fill(255,0,0,100);
        noStroke();
        circle(this.target.x-camera.pos.x + width / 2, this.target.y-camera.pos.y + height / 2, 6);
        pop();
    }
}

function scareBrain(brainID, proj){
    if(brainID == undefined) return;
    let scarer;

    for(let i=0; i<testMap.brains.length; i++){
        if(brainID == testMap.brains[i].id){
            if(proj.flightPath != undefined){
                //check if turret is at proj.flightPath.origin
                let chunkPos = testMap.globalToChunk(proj.flightPath.origin.x, proj.flightPath.origin.y);
                let chunk = testMap.chunks[chunkPos.x+","+chunkPos.y];
                if(chunk != undefined){
                    for(let j=0; j<chunk.objects.length; j++){
                        if(chunk.objects[j].objName == "Turret"){

                            if(chunk.objects[j].pos.dist(proj.flightPath.origin) < 70){
                                scarer = chunk.objects[j];
                                j = chunk.objects.length;
                            }
                        }
                    }
                }

                //check if proj.ownerName is curPlayer.name
                if(proj.ownerName == curPlayer.name){
                    scarer = curPlayer;
                }
                //check if proj.ownerName belongs to another player
                let keys = Object.keys(players);
                for(let j=0; j<keys.length; j++){
                    if(proj.ownerName == players[keys[j]].name){
                        scarer = players[keys[j]];
                        j = keys.length;
                    }
                }

            }
            
            if(scarer != undefined){
                testMap.brains[i].targetEntity = scarer;
                testMap.brains[i].state = "Space";
                testMap.brains[i].stateTimer = 0;
                i = testMap.brains.length;
            }
        }
    }
}