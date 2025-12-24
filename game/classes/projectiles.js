
/*
Proj Dic is a full dictanary of every projectile that can exist, falling into one of these types:
    Simple - just a projectile
*/
var projDic = {};

defineSimpleProjectile("Rock", 0, 20, 18, 20, "Straight", 5, 10);
defineSimpleProjectile("Dirt", 1, 20, 0, 30, "Straight", 5, 10);
defineSimpleProjectile("Fire Ball", 2, 20, 30, 30, "Screw", 5, 10);
defineSimpleProjectile("Laser", 3, 20, 25, 10, "Straight", 10, 10);
defineSimpleProjectile("Arrow", 4, 20, 20, 20, "Straight", 7, 10);
defineObjProjectile("Bomb", "PlacedBomb", 40, 5, 2);
defineObjProjectile("Dirt Bomb", "dirt", 40, 5, 2);

class SimpleProjectile{
    constructor(name, damage, knockback, flightPath, speed, lifespan, ownerName, color, imgNum){
        this.name = name;
        this.damage = damage;
        this.knockback = knockback;
        this.flightPath = flightPath;
        //this.flightPath.l = 1;
        this.pos = this.flightPath.calc(0);
        this.speed = speed;
        this.lifespan = lifespan;
        this.ownerName = ownerName;
        this.color = color;
        this.imgNum = imgNum;
        this.cPos = testMap.globalToChunk(this.pos.x, this.pos.y);

        this.type = "Simple";
        this.deleteTag = false;
        this.id = floor(random()*100000);
    }

    update(){
        this.flightPath.update(this.speed*(deltaTime/30));
        this.pos = this.flightPath.calc(this.flightPath.p);

        //move projectiles between chunks
        let newCPos = testMap.globalToChunk(this.pos.x, this.pos.y);
        if(newCPos.x != this.cPos.x || newCPos.y != this.cPos.y){
            let newProj = createProjectile(this.name, this.ownerName, this.color, this.flightPath.s.x, this.flightPath.s.y, this.flightPath.a);
            newProj.pos = this.pos.copy();
            newProj.flightPath.p = this.flightPath.p;
            newProj.cPos.x = newCPos.x;
            newProj.cPos.y = newCPos.y;

            socket.emit("new_proj", newProj);

            if(testMap.chunks[newCPos.x+","+newCPos.y] != undefined){
                testMap.chunks[newCPos.x+","+newCPos.y].projectiles.push(newProj);
            }
            
            this.deleteTag = true;
            socket.emit("delete_proj", this);
        }

        this.lifespan -= 1/60;
        if(this.lifespan <= 0){
            this.deleteTag = true;
            socket.emit("delete_proj", this);
        }

        this.checkCollision();
    }

    render(){
        push();
        translate(this.pos.x-camera.pos.x+(width/2), this.pos.y-camera.pos.y+(height/2));
        rotate(this.flightPath.a);
        image(projImgs[this.imgNum][0], 0, 0, 40, 40);
        pop();
    }

    checkCollision(){
        //check collision with dirt walls
        let x = floor(this.pos.x / TILESIZE) - (this.cPos.x*CHUNKSIZE);
        let y = floor(this.pos.y / TILESIZE) - (this.cPos.y*CHUNKSIZE);
        let chunk = testMap.chunks[this.cPos.x+","+this.cPos.y];
        if(chunk.data[x + y * CHUNKSIZE] > 0 || chunk.iron_data[x + y * CHUNKSIZE] > 0){
            this.deleteTag = true;
            socket.emit("delete_proj", this);
        }

        //check collision with objects
        for(let j = 0; j < chunk.objects.length; j++){
            if(chunk.objects[j].z == 2){
                
                let d = chunk.objects[j].pos.dist(this.pos);
                if(d < (chunk.objects[j].size.w+chunk.objects[j].size.h)/4){
                    if(chunk.objects[j].objName == "Door"){
                        if(chunk.objects[j].alpha == 255){
                            this.deleteTag = true;
                            socket.emit("delete_proj", this);

                            let chunkPos = testMap.globalToChunk(chunk.objects[j].pos.x, chunk.objects[j].pos.y);
                            //play hit noise and tell server
                            let temp = new SoundObj("hit.ogg", chunk.objects[j].pos.x, chunk.objects[j].pos.y);
                            testMap.chunks[chunkPos.x+","+chunkPos.y].soundObjs.push(temp);
                            socket.emit("new_sound", {sound: "hit.ogg", cPos: chunkPos, pos:{x: chunk.objects[j].pos.x, y: chunk.objects[j].pos.y}, id: temp.id});

                            if(this.ownerName != chunk.objects[j].ownerName){
                                damageObj(chunk, chunk.objects[j], this.damage);

                                scareBrain(chunk.objects[j].brainID, this);
                            }
                        }
                    }
                    else{
                        this.deleteTag = true;
                        socket.emit("delete_proj", this);

                        let chunkPos = testMap.globalToChunk(chunk.objects[j].pos.x, chunk.objects[j].pos.y);
                        //play hit noise and tell server
                        let temp = new SoundObj("hit.ogg", chunk.objects[j].pos.x, chunk.objects[j].pos.y);
                        testMap.chunks[chunkPos.x+","+chunkPos.y].soundObjs.push(temp);
                        socket.emit("new_sound", {sound: "hit.ogg", cPos: chunkPos, pos:{x: chunk.objects[j].pos.x, y: chunk.objects[j].pos.y}, id: temp.id});

                        if(this.ownerName != chunk.objects[j].ownerName){
                            damageObj(chunk, chunk.objects[j], this.damage);

                            scareBrain(chunk.objects[j].brainID, this);
                        }
                    }
                }
            }
        }

        //check collision with curPlayer
        if((this.color == 0 && this.ownerName != curPlayer.name) || this.color != curPlayer.color){
            if(this.pos.dist(curPlayer.pos) < 29){
                this.deleteTag = true;
                //if player collishion tell server to set delete tag to true
                socket.emit("delete_proj", this);
                
                let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
                //play hit noise and tell server
                let temp = new SoundObj("hit.ogg", curPlayer.pos.x, curPlayer.pos.y);
                testMap.chunks[chunkPos.x+","+chunkPos.y].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "hit.ogg", cPos: chunkPos, pos:{x: curPlayer.pos.x, y: curPlayer.pos.y}, id: temp.id});
                let tempV = createVector(this.knockback,0);
                tempV.setHeading(curPlayer.pos.copy().sub(this.pos).heading());
                curPlayer.vel.add(tempV);
                curPlayer.statBlock.stats.hp -= this.damage;
                camera.shake = {intensity: this.damage, length: 5};
                camera.edgeBlood = 5;
                curPlayer.attackingOBJ = this;
                socket.emit("update_player", {
                    id: curPlayer.id,
                    pos: curPlayer.pos,
                    holding: curPlayer.holding,
                    update_names: ["stats.hp"],
                    update_values: [curPlayer.statBlock.stats.hp]
                });
            }
        }
    }
}

class MeleeProjectile extends SimpleProjectile{
    constructor(name, damage, knockback, x,y,a, lifespan, range, safeRange, angleWidth, ownerName, color, imgNum){
        super(name, damage, knockback, createFlightPath("Stay", x,y,a), 0, lifespan, ownerName, color, imgNum);
        
        this.range = range;
        this.safeRange = safeRange;
        this.angleWidth = angleWidth;

        this.ringAngles = [];
        for(let i = 0; i < this.range/10; i++){
            let ringLength = random(this.angleWidth/5, this.angleWidth*0.7);
            let ringOffset = random(-(this.angleWidth-ringLength), this.angleWidth-ringLength)/2;
            this.ringAngles.push([this.flightPath.a+ringOffset-(ringLength/2), this.flightPath.a+ringOffset+(ringLength/2)]);
        }

        this.type = "Melee";
    }

    render(){
        push();
        translate(-camera.pos.x+(width/2), -camera.pos.y+(height/2));
        noFill();
        if(Debuging){
            stroke(200, 200, 215);
            strokeCap(SQUARE);
            strokeWeight(this.range);
            arc(this.pos.x,this.pos.y,this.range+this.safeRange,this.range+this.safeRange,this.flightPath.a-(this.angleWidth/2), this.flightPath.a+(this.angleWidth/2));
        }
        else{
            for(let i = 0; i < this.ringAngles.length; i++){
                let ringRadius = map(i, 0, this.ringAngles.length, 0, (this.range*2))+this.safeRange+10;
                strokeWeight(4);
                stroke(0);
                arc(this.pos.x, this.pos.y,
                    ringRadius,
                    ringRadius,
                    this.ringAngles[i][0],
                    this.ringAngles[i][1]
                );

                strokeWeight(3);
                stroke(200, 200, 215);
                arc(this.pos.x, this.pos.y,
                    ringRadius,
                    ringRadius,
                    this.ringAngles[i][0],
                    this.ringAngles[i][1]
                );
            }
        }
        
        pop();
    }

    update(){
        this.lifespan -= 1/60;
        if(this.lifespan <= 0){
            this.deleteTag = true;
            socket.emit("delete_proj", this);
        }

        this.checkCollision();
    }

    checkCollision(){
        let chunk = testMap.chunks[this.cPos.x+","+this.cPos.y];

        //check collision with objects
        for(let j = 0; j < chunk.objects.length; j++){
            if(chunk.objects[j].z == 2 || chunk.objects[j].z == 0){
                
                let d = chunk.objects[j].pos.dist(this.pos);
                if(d-29 < (this.range)+this.safeRange && d+29 > this.safeRange && 
                    chunk.objects[j].pos.copy().sub(this.pos).heading() > this.flightPath.a-(this.angleWidth/2) &&
                    chunk.objects[j].pos.copy().sub(this.pos).heading() < this.flightPath.a+(this.angleWidth/2)
                ){
                    //play hit noise and tell server
                    let temp = new SoundObj("hit.ogg", chunk.objects[j].pos.x, chunk.objects[j].pos.y);
                    testMap.chunks[chunk.cx+","+chunk.cy].soundObjs.push(temp);
                    socket.emit("new_sound", {sound: "hit.ogg", cPos: {x: chunk.cx, y: chunk.cy}, pos:{x: chunk.objects[j].pos.x, y: chunk.objects[j].pos.y}, id: temp.id});
                    damageObj(chunk, chunk.objects[j], this.damage);
                    
                    scareBrain(chunk.objects[j].brainID, this);

                    this.deleteTag = true;
                    socket.emit("delete_proj", this);
                }
            }
        }

        //check collision with curPlayer
        if((this.color == 0 && this.ownerName != curPlayer.name) || this.color != curPlayer.color){
            let d = curPlayer.pos.dist(this.pos);
            if(d-5 < (this.range)+this.safeRange && d+64 > this.safeRange && 
                curPlayer.pos.copy().sub(this.pos).heading() > this.flightPath.a-(this.angleWidth/2) &&
                curPlayer.pos.copy().sub(this.pos).heading() < this.flightPath.a+(this.angleWidth/2)
            ){
                let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
                //play hit noise and tell server
                let temp = new SoundObj("hit.ogg", curPlayer.pos.x, curPlayer.pos.y);
                testMap.chunks[chunkPos.x+","+chunkPos.y].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "hit.ogg", cPos: chunkPos, pos:{x: curPlayer.pos.x, y: curPlayer.pos.y}, id: temp.id});
                let tempV = createVector(this.knockback,0);
                tempV.setHeading(curPlayer.pos.copy().sub(this.pos).heading());
                curPlayer.vel.add(tempV);
                curPlayer.attackingOBJ = this;
                curPlayer.statBlock.stats.hp -= this.damage;
                camera.shake = {intensity: this.damage, length: 5};
                camera.edgeBlood = 5;
                socket.emit("update_player", {
                    id: curPlayer.id,
                    pos: curPlayer.pos,
                    holding: curPlayer.holding,
                    update_names: ["stats.hp"],
                    update_values: [curPlayer.statBlock.stats.hp]
                });
                
                this.deleteTag = true;
                socket.emit("delete_proj", this);
            }
        }
    }
}

class ObjProj extends SimpleProjectile{
    constructor(name, x,y,a, speed, lifespan, objName, radius, ownerName, color){
        if(objName == "dirt"){
            super(name, 0, 0, createFlightPath("Straight", x,y,a), speed, lifespan, ownerName, color, objDic["DirtBomb"].img);
        }
        else{
            super(name, 0, 0, createFlightPath("Straight", x,y,a), speed, lifespan, ownerName, color, objDic[objName].img);
        }
        this.radius = radius;
        this.objName = objName;
        this.type = "ObjProj";
    }

    spawnObj(){
        if(this.objName == "dirt"){
            for(let y=-this.radius; y<this.radius; y++){
                for(let x=-this.radius; x<this.radius; x++){
                    if(((x*x)+(y*y)) < (this.radius*this.radius)){
                        dig(this.pos.x+x, this.pos.y+y, -1, false);
                    }
                }
            }
        }
        else testMap.chunks[this.cPos.x+','+this.cPos.y].objects.push(createObject(this.objName, this.pos.x, this.pos.y, 0, this.color, 0, this.ownerName));
    }

    render(){
        push();
        translate(-camera.pos.x+(width/2), -camera.pos.y+(height/2));
        image(objImgs[this.imgNum][0], this.pos.x, this.pos.y, 40, 40);
        pop();
    }

    update(){
        this.flightPath.update(this.speed);
        this.pos = this.flightPath.calc(this.flightPath.p);

        //move projectiles between chunks
        let newCPos = testMap.globalToChunk(this.pos.x, this.pos.y);
        if(newCPos.x != this.cPos.x || newCPos.y != this.cPos.y){
            let newProj = createProjectile(this.name, this.ownerName, this.color, this.flightPath.s.x, this.flightPath.s.y, this.flightPath.a);
            newProj.pos = this.pos.copy();
            newProj.flightPath.p = this.flightPath.p;
            newProj.cPos.x = newCPos.x;
            newProj.cPos.y = newCPos.y;

            socket.emit("new_proj", newProj);

            if(testMap.chunks[newCPos.x+","+newCPos.y] != undefined){
                testMap.chunks[newCPos.x+","+newCPos.y].projectiles.push(newProj);
            }
            
            this.deleteTag = true;
            socket.emit("delete_proj", this);
        }

        this.lifespan -= 1/60;
        if(this.lifespan <= 0){
            this.spawnObj();
            this.deleteTag = true;
            socket.emit("delete_proj", this);
        }

        this.checkCollision();
    }

    checkCollision(){
        //check collision with dirt walls
        let x = floor(this.pos.x / TILESIZE) - (this.cPos.x*CHUNKSIZE);
        let y = floor(this.pos.y / TILESIZE) - (this.cPos.y*CHUNKSIZE);
        let chunk = testMap.chunks[this.cPos.x+","+this.cPos.y];
        if(x > 0 && x < CHUNKSIZE && y > 0 && y < CHUNKSIZE){
            if(chunk.data[x + y * CHUNKSIZE] > 0 || chunk.iron_data[x + y * CHUNKSIZE] > 0){
                this.spawnObj();
                this.deleteTag = true;
                socket.emit("delete_proj", this);
            }
        }

        //check collision with objects
        for(let j = 0; j < chunk.objects.length; j++){
            if(chunk.objects[j].z == 2){
                
                let d = chunk.objects[j].pos.dist(this.pos);
                if(d < (chunk.objects[j].size.w+chunk.objects[j].size.h)/4){
                    if(chunk.objects[j].objName == "Door"){
                        if(chunk.objects[j].alpha == 255){
                            this.spawnObj();
                            this.deleteTag = true;
                            socket.emit("delete_proj", this);

                            let chunkPos = testMap.globalToChunk(chunk.objects[j].pos.x, chunk.objects[j].pos.y);
                            //play hit noise and tell server
                            let temp = new SoundObj("hit.ogg", chunk.objects[j].pos.x, chunk.objects[j].pos.y);
                            testMap.chunks[chunkPos.x+","+chunkPos.y].soundObjs.push(temp);
                            socket.emit("new_sound", {sound: "hit.ogg", cPos: chunkPos, pos:{x: chunk.objects[j].pos.x, y: chunk.objects[j].pos.y}, id: temp.id});
                        }
                    }
                    else{
                        this.spawnObj();
                        this.deleteTag = true;
                        socket.emit("delete_proj", this);

                        let chunkPos = testMap.globalToChunk(chunk.objects[j].pos.x, chunk.objects[j].pos.y);
                        //play hit noise and tell server
                        let temp = new SoundObj("hit.ogg", chunk.objects[j].pos.x, chunk.objects[j].pos.y);
                        testMap.chunks[chunkPos.x+","+chunkPos.y].soundObjs.push(temp);
                        socket.emit("new_sound", {sound: "hit.ogg", cPos: chunkPos, pos:{x: chunk.objects[j].pos.x, y: chunk.objects[j].pos.y}, id: temp.id});
                    }
                }
            }
        }

        //check collision with curPlayer
        if((this.color == 0 && this.ownerName != curPlayer.name) || this.color != curPlayer.color){
            if(this.pos.dist(curPlayer.pos) < 29){
                this.spawnObj();
                this.deleteTag = true;
                //if player collishion tell server to set delete tag to true
                socket.emit("delete_proj", this);
                
                let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
                //play hit noise and tell server
                let temp = new SoundObj("hit.ogg", curPlayer.pos.x, curPlayer.pos.y);
                testMap.chunks[chunkPos.x+","+chunkPos.y].soundObjs.push(temp);
                socket.emit("new_sound", {sound: "hit.ogg", cPos: chunkPos, pos:{x: curPlayer.pos.x, y: curPlayer.pos.y}, id: temp.id});
            }
        }
    }
}

function createProjectile(name,owner,color, x,y,a){
    if(projDic[name] == undefined){
        throw new Error(`Projectile with name: ${name}, does not exist`);
    }
    if(projDic[name].type == "SimpleProj"){
        return new SimpleProjectile(name, projDic[name].damage, projDic[name].knockback, createFlightPath(projDic[name].fpn, x,y,a), projDic[name].speed, projDic[name].lifespan, owner, color, projDic[name].imgNum);
    }
    if(projDic[name].type == "MeleeProj"){
        return new MeleeProjectile(name, projDic[name].damage, projDic[name].knockback, x,y,a, projDic[name].lifespan, projDic[name].r, projDic[name].sr, projDic[name].aw, owner, color, projDic[name].imgNum);
    }
    if(projDic[name].type == "ObjProj"){
        return new ObjProj(name, x,y,a, projDic[name].speed, projDic[name].lifespan, projDic[name].objName, projDic[name].r, owner, color);
    }
}


function defineSimpleProjectile(name,imgNum,radius,damage,knockback,flightPathName,speed,lifespan){
    checkParams(arguments, getParamNames(defineSimpleProjectile), ["string","int","int","int","int","string","int","number"]);
    projDic[name] = {
        type: "SimpleProj",
        name: name,
        imgNum: imgNum,
        r: radius,
        damage: damage,
        knockback: knockback,
        fpn: flightPathName,
        speed: speed,
        lifespan: lifespan
    };
}

function defineMeleeProjectile(name,imgNum,range,safeRange,angleWidth,damage,knockback,lifespan){
    checkParams(arguments, getParamNames(defineMeleeProjectile), ["string","int","int","int","int","int","int","number"]);
    projDic[name] = {
        type: "MeleeProj",
        name: name,
        imgNum: imgNum,
        r: range,
        sr: safeRange,
        aw: angleWidth,
        damage: damage,
        knockback: knockback,
        lifespan: lifespan
    };
}

function defineObjProjectile(name,objName,radius,speed,lifespan){
    checkParams(arguments, getParamNames(defineObjProjectile), ["string","string","int","int","number"]);
    projDic[name] = {
        type: "ObjProj",
        name: name,
        objName: objName,
        r: radius,
        speed: speed,
        lifespan: lifespan
    }
}



//might move this to another file later

function damageObj(chunk, obj, damage){
    //damage the obj
    obj.hp -= damage;
    socket.emit("upadate_obj", {
        cx: chunk.cx, cy: chunk.cy,
        objName: obj.objName, 
        pos: {x: obj.pos.x, y: obj.pos.y}, 
        z: obj.z, 
        update_name: "hp", 
        update_value: obj.hp
    });

    //shake the obj
    obj.shake = {intensity: damage/2, length: 2};
    socket.emit("upadate_obj", {
        cx: chunk.cx, cy: chunk.cy,
        objName: obj.objName, 
        pos: {x: obj.pos.x, y: obj.pos.y}, 
        z: obj.z, 
        update_name: "shake", 
        update_value: obj.shake
    });
}