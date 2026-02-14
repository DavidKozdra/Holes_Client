const raceImages = {}; // Object to hold all race images
var defaultImage;
var trapImg;
var chunkDirtImg;
var dirtFloorImg;
var dirtBagImg;
var dirtBagOpenImg;
var hpBarImg;
var portalImg;
var portalBackground;
var manaBarImg;
var edgeBloodImg;
var objImgs = [];
var itemImgs = [];
var dirtBagShakeSound;
var itemAtlas;
var fullAtlas;
var shovelHeadImg;
var dirtParticleImg;
var metalParticleImg;

function preload() {
    // Load the default image
    //loadDefaultImage();

    // Load race images
    loadRaceImages();

    //Dirt floor and wall images
    chunkDirtImg = loadImage('images/dirt_walls.png');
    chunkIronImg = loadImage('images/iron_walls.png');
    dirtFloorImg = loadImage('images/floor.png');

    //Ui Images
    dirtBagImg = loadImage('images/ui/dirtbag.png');
    dirtBagOpenImg = loadImage('images/ui/dirtbagopen.png');
    hpBarImg = loadImage('images/ui/healthbar.png');
    manaBarImg = loadImage('images/ui/manabar.png');
    ammoBarImg = loadImage('images/ui/ammobar.png');
    edgeBloodImg = loadImage('images/ui/edgeblood.png');
    hammerImg = loadImage("images/ui/hammer.png");
    Ximage = loadImage("images/ui/x.png");
    portalImg = loadImage("images/ui/portal_icon.png");
    portalBackground = loadImage("images/ui/portal_background.png");

    //load obj imgs
    for(let i = 0; i < objImgPaths.length; i++){
        let temp = [];
        for(let j = 0; j < objImgPaths[i].length; j++){
            const path = objImgPaths[i][j];
            // Skip undefined, null, or empty paths
            if (!path || path === 'undefined' || typeof path !== 'string') {
                console.warn(`Skipping invalid objImgPath at [${i}][${j}]:`, path);
                continue;
            }
            //console.log(path)
            temp.push(loadImage(path));
            if(path.includes(".gif")){
                temp[temp.length - 1].play();
            }
        }
        objImgs.push(temp);
    }

    //load item imgs
    for(let i = 0; i < itemImgPaths.length; i++){
        let temp = [];
        for(let j = 0; j < itemImgPaths[i].length; j++){
            const path = itemImgPaths[i][j];
            // Skip undefined, null, or empty paths
            if (!path || path === 'undefined' || typeof path !== 'string') {
                console.warn(`Skipping invalid itemImgPath at [${i}][${j}]:`, path);
                continue;
            }
            temp.push(loadImage(path));
            if(path.includes(".gif")){
                temp[temp.length - 1].play();
            }
        }
        itemImgs.push(temp);
    }

    itemAtlas = loadImage("images/items/item_atlas.png");
    shovelHeadImg = loadImage("images/items/shovel1.png");
    dirtParticleImg = loadImage("images/items/dirtball.png");
    metalParticleImg = loadImage("images/items/metal_scrap.png");
    fullAtlas = loadImage("images/full_atlas.png");

    playerCardImg = loadImage('images/ui/playercard.png');

    gameUIFont = loadFont('CalibrationGothicNbpLatin-rYmy.ttf');
    //console.log("font:", gameUIFont);

    //load sounds
    let keys = Object.keys(soundDic);
    for(let i = 0; i < keys.length; i++){
        for(let j = 1; j < soundDic[keys[i]].sounds.length; j++){
            const soundPath = soundDic[keys[i]].sounds[j];
            // Skip undefined, null, or empty sound paths
            if (!soundPath || soundPath === 'undefined' || typeof soundPath !== 'string') {
                console.warn(`Skipping invalid sound path at [${keys[i]}][${j}]:`, soundPath);
                continue;
            }
            soundDic[keys[i]].sounds[j] = loadSound(soundPath);
            soundDic[keys[i]].sounds[j].setVolume((j/20)*soundDic[keys[i]].volume);
        }
    }

    dirtBagShakeSound = loadSound("audio/dirtbag_shake.ogg");
    dirtBagShakeSound.setVolume(0.1);

    // ── Preload safety timeout ──────────────────────────────────
    // If any asset hangs, force p5 to proceed after 8 seconds so
    // the player isn't stuck on the loading screen forever.
    window._preloadTimedOut = false;
    window._preloadTimer = setTimeout(() => {
        try {
            const inst = p5.instance;
            if (inst && inst._preloadCount > 0) {
                console.warn(
                    `[Preload] Timed out after 8 s with ${inst._preloadCount} asset(s) still pending — forcing start`
                );
                window._preloadTimedOut = true;
                inst._preloadCount = 0;   // p5 polls this; 0 triggers setup()
            }
        } catch (e) {
            console.error('[Preload] Timeout handler error:', e);
        }
    }, 8000);
}

function loadDefaultImage(){
    defaultImage = loadImage(
        'images/default_front_walk.png',
        function (img) {
            //console.log('Default image loaded successfully.');
        },
        function (err) {
            console.error('Failed to load the default image.');
            // Create a placeholder image to use as default
            defaultImage = createImage(32, 32);
            defaultImage.loadPixels();
            for (let i = 0; i < defaultImage.pixels.length; i += 4) {
                defaultImage.pixels[i] = 255;     // R
                defaultImage.pixels[i + 1] = 0;   // G
                defaultImage.pixels[i + 2] = 0;   // B
                defaultImage.pixels[i + 3] = 255; // A
            }
            defaultImage.updatePixels();
        }
    );
}

function loadRaceFrame(path) {
    path = `images/characters/` + path;
    let img = loadImage(
        path,
        function (loadedImage) {
            //console.log(`Loaded image: ` + path);
            return loadedImage;
        },
        function (err) {
            console.error(`Failed to load image: ` + path);
            return defaultImage;
        }
    );

    return img || defaultImage;
}

function loadRaceImages() {
    for (let raceIndex = 0; raceIndex < races.length; raceIndex++) {
        let raceName = races[raceIndex];
        raceImages[raceName] = {
            front: [],
            back: [],
            left: [],
            right: [],
            portrait: loadImage(`images/characters/${raceName}/${raceName}_portrait.png`)
        };
        
        // 0 is standing
        // 1, 2, 3 are walk cycle

        // 4 is putting something down

        // 5 is standing with shovel
        // 6, 7, 8 are walking with shovel

        //raceImages[raceName].front[0] = loadRaceFrame(`${raceName}/${raceName}_front_stand.png`);
        //raceImages[raceName].back[0] = loadRaceFrame(`${raceName}/${raceName}_back_stand.png`);
        //raceImages[raceName].right[0] = loadRaceFrame(`${raceName}/${raceName}_side_stand.png`);

        // Load images for each direction
        //for (let i = 1; i < 4; i++) {
            // Front images
            //raceImages[raceName].front[i] = loadRaceFrame(`${raceName}/${raceName}_front_walk${i}.png`);
    
            // Back images
            //raceImages[raceName].back[i] = loadRaceFrame(`${raceName}/${raceName}_back_walk${i}.png`);
    
            // Right images
           // raceImages[raceName].right[i] = loadRaceFrame(`${raceName}/${raceName}_side_walk${i}.png`);
        //}

        //raceImages[raceName].front[4] = loadRaceFrame(`${raceName}/place/${raceName}_front_place.png`);
        //raceImages[raceName].back[4] = loadRaceFrame(`${raceName}/place/${raceName}_back_place.png`);
        //raceImages[raceName].right[4] = loadRaceFrame(`${raceName}/place/${raceName}_side_place.png`);

        //raceImages[raceName].right[4] = loadRaceFrame(`${raceName}/shovel/${raceName}_side_stand_shovel.png`);
    }
}


function seperateAtlas(){
    //get the characters from the atlas
    for (let raceIndex = 0; raceIndex < races.length; raceIndex++) {
        let raceName = races[raceIndex];

        raceAtlasHeight = [201, 161, 181];
        raceImages[raceName].front[0] = fullAtlas.get(200, raceAtlasHeight[raceIndex], 15, 20);
        raceImages[raceName].back[0] = fullAtlas.get(140, raceAtlasHeight[raceIndex], 15, 20);
        raceImages[raceName].right[0] = fullAtlas.get(260, raceAtlasHeight[raceIndex], 15, 20);
        for(let i = 1; i < 4; i++){
            raceImages[raceName].front[i] = fullAtlas.get(200 + (i * 15), raceAtlasHeight[raceIndex], 15, 20);
            raceImages[raceName].back[i] = fullAtlas.get(140 + (i * 15), raceAtlasHeight[raceIndex], 15, 20);
            raceImages[raceName].right[i] = fullAtlas.get(260 + (i * 15), raceAtlasHeight[raceIndex], 15, 20);
        }
        raceImages[raceName].front[4] = fullAtlas.get(335, raceAtlasHeight[raceIndex], 15, 20);
        raceImages[raceName].back[4] = fullAtlas.get(320, raceAtlasHeight[raceIndex], 15, 20);
        raceImages[raceName].right[4] = fullAtlas.get(350, raceAtlasHeight[raceIndex], 15, 20);
    }

    // Flip right images to create left images
    for (let raceName in raceImages) {
        raceImages[raceName].left = [];
        for (let i = 0; i < raceImages[raceName].right.length; i++) {
            raceImages[raceName].left[i] = flipImage(raceImages[raceName].right[i]);
        }
    }

    //get the items from the atlas
    for(let i = 0; i < itemImgCords.length; i++){
        let temp = [];
        for(let j = 0; j < itemImgCords[i].length; j++){
            if(itemImgCords[i][j][0] != -1 && itemImgCords[i][j][1] != -1){
                temp.push(fullAtlas.get(itemImgCords[i][j][0], itemImgCords[i][j][1], 20, 20));
            }
        }
        itemImgs.push(temp);
    }

    //get the objects from the atlas
    for(let i = 0; i < objImgCords.length; i++){
        let temp = [];
        for(let j = 0; j < objImgCords[i].length; j++){
            if(objImgCords[i][j][0] != -1 && objImgCords[i][j][1] != -1){
                temp.push(fullAtlas.get(objImgCords[i][j][0], objImgCords[i][j][1], objImgCords[i][j][2], objImgCords[i][j][3]));
            }
        }
        if(temp.length != 0) objImgs.push(temp);
    }

    //get the projectiles from the atlas
    rockImg = fullAtlas.get(2*20, 160 + 4*20, 20, 20);
    dirtBallImg = fullAtlas.get(4*20, 160 + 1*20, 20, 20);
    fireBallImg = fullAtlas.get(0*20, 160 + 2*20, 20, 20);
    laserImg = fullAtlas.get(4*20, 160 + 2*20, 20, 20);
    arrowImage = fullAtlas.get(3*20, 160 + 0*20, 20, 20);

    projImgs = [
        [rockImg],
        [dirtBallImg],
        [fireBallImg],
        [laserImg],
        [arrowImage]
    ];
}