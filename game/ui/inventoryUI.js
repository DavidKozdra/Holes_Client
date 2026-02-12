// Consolidated Inventory & Crafting UI Module
// Handles all inventory-related UI rendering and interactions

var invDiv;
var itemListDiv;
var curItemDiv;
var craftDiv;
var craftListDiv;
var curCraftItemDiv;
var allTag;
var toolsTag;
var weaponsTag;
var equipmentTag;
var consumablesTag;

function defineInvUI() {
    // Main inventory container
    invDiv = createDiv();
    invDiv.id("inventory");
    invDiv.class("container");
    invDiv.style("z-index", "50");
    applyStyle(invDiv, {
        position: "absolute",
        top: "45%",
        left: "55%",
        transform: "translate(-50%, -50%)",
        display: "none",
    });

    let topBar = createDiv().parent(invDiv);
    applyStyle(topBar, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    });

    let invTitle = createP("Inventory").parent(topBar);
    invTitle.class("inventory-title");
    invTitle.style("color", "yellow");

    let craftingTitle = createP("Crafting").parent(topBar);
    craftingTitle.class("inventory-title");
    craftingTitle.mousePressed(() => {
        gameState = "crafting";
        craftDiv.show();
        curPlayer.invBlock.curItem = "";
        updateCraftList();
        updatecurCraftItemDiv();
        invDiv.hide();
        spaceBarDiv.hide();
    });
    craftingTitle.style("cursor", "pointer");

    let movesBtn = createButton("Edit Moves").parent(topBar);
    movesBtn.class("inventory-title");
    movesBtn.style("margin-left", "12px");
    movesBtn.mousePressed(() => {
        showMovesEditor();
    });

    let tagBar = createDiv().parent(invDiv);
    tagBar.class("tag-bar");

    const categories = ["All", "Tools/Seeds", "Weapons", "Equipment", "Consumables"];
    let categoryButtons = {};

    categories.forEach((category) => {
        let button = createButton(category).parent(tagBar);
        button.class("tag-button");
        button.mousePressed(() => {
            curPlayer.invBlock.curTag = category;
            updateItemList();
            Object.values(categoryButtons).forEach((btn) => {
                btn.removeClass("selected");
            });
            button.addClass("selected");
        });
        categoryButtons[category] = button;
    });

    categoryButtons["All"].addClass("selected");

    let bottomDiv = createDiv().parent(invDiv);
    bottomDiv.class("bottom-area");

    itemListDiv = createDiv().parent(bottomDiv);
    itemListDiv.class("item-list");

    curItemDiv = createDiv().parent(bottomDiv);
    curItemDiv.class("item-details");

    let closeButton = createImg("images/ui/x.png", "").parent(topBar);
    closeButton.addClass("icon-btn");
    closeButton.class("close-button");
    applyStyle(closeButton, {
        marginLeft: "auto",
        position: "absolute",
        right: "0",
        width: "22px",
        height: "22px",
        cursor: "pointer",
        imageRendering: "pixelated",
        border: "none",
    });

    closeButton.mousePressed(() => {
        gameState = "playing"
        curPlayer.invBlock.useTimer = 10;
        invDiv.hide();
        spaceBarDiv.hide();
    });

    updateItemList();
    updatecurItemDiv();
}

function defineCraftingUI() {
    craftDiv = createDiv();
    craftDiv.id("inventory");
    craftDiv.class("container");
    applyStyle(craftDiv, {
        position: "absolute",
        top: "45%",
        left: "55%",
        transform: "translate(-50%, -50%)",
        display: "none",
        zIndex: "50",
    });

    let topBar = createDiv().parent(craftDiv);
    applyStyle(topBar, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    });

    let invTitle = createP("Inventory").parent(topBar);
    invTitle.class("inventory-title");
    invTitle.mousePressed(() => {
        gameState = "inventory";
        curPlayer.invBlock.curItem = "";
        invDiv.show();
        updateItemList();
        updatecurItemDiv();
        craftDiv.hide();
    });
    invTitle.style("cursor", "pointer");

    let craftingTitle = createP("Crafting").parent(topBar);
    craftingTitle.class("inventory-title");
    craftingTitle.style("color", "yellow");

    let tagBar = createDiv().parent(craftDiv);
    tagBar.class("tag-bar");

    const categories = ["All", "Tools/Seeds", "Weapons", "Equipment", "Consumables"];
    let categoryButtons = {};

    categories.forEach((category) => {
        let button = createButton(category).parent(tagBar);
        button.class("tag-button");
        button.mousePressed(() => {
            curPlayer.invBlock.curTag = category;
            updateCraftList();
            Object.values(categoryButtons).forEach((btn) => btn.removeClass("selected"));
            button.addClass("selected");
        });
        categoryButtons[category] = button;
    });

    categoryButtons["All"].addClass("selected");

    let searchBar = createInput().parent(craftDiv);
    searchBar.class("search-bar");
    searchBar.attribute("placeholder", "Search recipes...");
    
    searchBar.elt.addEventListener("focus", () => {
        console.log("🔍 Search focused - gameState was:", gameState);
        lastGameState = gameState;
        gameState = "search";
        console.log("🔍 Search focused - gameState now:", gameState);
    });
    searchBar.elt.addEventListener("blur", () => {
        console.log("🔍 Search blurred - gameState was:", gameState);
        if (gameState === "search") {
            gameState = lastGameState;
        }
        console.log("🔍 Search blurred - gameState now:", gameState);
    });
    
    searchBar.input(() => {
        let searchTerm = searchBar.value().toLowerCase();
        curPlayer.invBlock.craftList.forEach((recipe) => {
            let isVisible = recipe.name.toLowerCase().includes(searchTerm);
            recipe.uiElement.style("display", isVisible ? "block" : "none");
        });
    });

    let bottomDiv = createDiv().parent(craftDiv);
    bottomDiv.class("bottom-area");

    craftListDiv = createDiv().parent(bottomDiv);
    craftListDiv.class("item-list");

    curCraftItemDiv = createDiv().parent(bottomDiv);
    curCraftItemDiv.class("item-details");

    let closeButton = createImg("images/ui/x.png", "").parent(topBar);
    closeButton.addClass("icon-btn");
    closeButton.class("close-button");
    applyStyle(closeButton, {
        marginLeft: "auto",
        position: "absolute",
        right: "0",
        width: "22px",
        height: "22px",
        cursor: "pointer",
        imageRendering: "pixelated",
        border: "none",
    });

    closeButton.mousePressed(() => {
        gameState = "playing"
        curPlayer.invBlock.useTimer = 10;
        craftDiv.hide();
        spaceBarDiv.hide();
    });

    updateCraftList();
    updatecurCraftItemDiv();
}

// Safe helpers for item images
function _getFrameURLSafe(imgNum) {
    const frames = (typeof imgNum === "number" && itemImgs) ? itemImgs[imgNum] : undefined;
    const frame0 = Array.isArray(frames) ? frames[0] : undefined;
    const canvas = frame0 && frame0.canvas;
    return (canvas && typeof canvas.toDataURL === "function") ? canvas.toDataURL() : undefined;
}

function resolveItemImgURL(itemName, entry) {
    const imgNum = (entry && typeof entry.imgNum === "number")
        ? entry.imgNum
        : (itemDic && itemDic[itemName] ? itemDic[itemName].img : undefined);
    const dataURL = _getFrameURLSafe(imgNum);
    if (dataURL) return dataURL;
    const path = (typeof imgNum === "number" && Array.isArray(itemImgPaths)) ? itemImgPaths[imgNum] : undefined;
    if (typeof path === "string" && path.length > 0) return path;
    return undefined;
}

function rarityColorCSS(itemName) {
    try {
        if (typeof window !== 'undefined' && typeof window.getItemRarityCSSByName === 'function') {
            const color = window.getItemRarityCSSByName(itemName);
            return color;
        }
        if (itemDic && itemDic[itemName]) {
            const rarity = itemDic[itemName].rarity || 'white';
            if (typeof RARITY_RGB !== 'undefined' && RARITY_RGB[rarity]) {
                const rgb = RARITY_RGB[rarity];
                return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            }
        }
        return 'rgb(235,235,235)';
    } catch (e) {
        console.warn(`[rarityColorCSS] Error for item "${itemName}":`, e);
        return 'rgb(235,235,235)';
    }
}

// Batch highlight updates
function highlightItemList() {
    if (!itemListDiv || !itemListDiv.elt) return;
    const selected = curPlayer?.invBlock?.curItem;
    const children = itemListDiv.elt.children;
    const apply = () => {
        for (let i = 0; i < children.length; i++) {
            const row = children[i];
            const name = row.getAttribute('data-item');
            const isSel = name === selected;
            row.style.backgroundColor = isSel ? 'rgb(120,120,120)' : '';
            row.style.fontStyle = isSel ? 'italic' : 'normal';
        }
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply); else apply();
}

function highlightCraftList() {
    if (!craftListDiv || !craftListDiv.elt) return;
    const selected = curPlayer?.invBlock?.curItem;
    const children = craftListDiv.elt.children;
    const apply = () => {
        for (let i = 0; i < children.length; i++) {
            const row = children[i];
            const name = row.getAttribute('data-item');
            const isSel = name === selected;
            row.style.backgroundColor = isSel ? 'rgb(120,120,120)' : '';
            row.style.fontStyle = isSel ? 'italic' : 'normal';
        }
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply); else apply();
}

function updateItemList() {
    if (!curPlayer) return;
    itemListDiv.html("");

    let arr = Object.keys(curPlayer.invBlock.items || {});
    arr = arr.filter((itemName) => {
        const entry = curPlayer.invBlock.items[itemName];
        const tag = curPlayer.invBlock.curTag;
        if (tag === "All") return true;
        if (tag === "Tools/Seeds") return entry.type === "Shovel" || entry.type === "Seed";
        if (tag === "Weapons") return entry.type === "Melee" || entry.type === "Ranged";
        if (tag === "Equipment") return entry.type === "Equipment";
        if (tag === "Consumables") return entry.type === "Food" || entry.type === "Potion";
        return false;
    });

    const ROW_H = 50;
    arr.forEach((itemName) => {
        let itemDiv = createDiv().parent(itemListDiv);
        itemDiv.attribute('data-item', itemName);
        itemDiv.style("width", "100%");
        itemDiv.style("height", ROW_H + "px");
        itemDiv.style("display", "flex");
        itemDiv.style("align-items", "center");
        itemDiv.style("justify-content", "center");
        itemDiv.style("border-bottom", "2px solid black");
        itemDiv.style("cursor", "pointer");
        itemDiv.style("position", "relative");
        itemDiv.mousePressed(() => {
            curPlayer.invBlock.curItem = itemName;
            highlightItemList();
            updatecurItemDiv();
        });

        let itemInfoDiv = createDiv().parent(itemDiv);
        itemInfoDiv.style("width", "80%");
        itemInfoDiv.style("height", ROW_H + "px");
        itemInfoDiv.style("display", "flex");
        itemInfoDiv.style("align-items", "center");
        itemInfoDiv.style("justify-content", "space-between");

        let imgDiv = createDiv().parent(itemInfoDiv);
        imgDiv.style("width", "2.2em");
        imgDiv.style("height", "2.2em");
        imgDiv.style("minWidth", "28px");
        imgDiv.style("minHeight", "28px");
        imgDiv.style("marginRight", "0.5em");
        imgDiv.style("display", "flex");
        imgDiv.style("align-items", "center");

        const url = resolveItemImgURL(itemName, curPlayer.invBlock.items[itemName]);
        if (url) {
            let imgEl = createImg(url, '').parent(imgDiv);
            imgEl.style("width", "100%");
            imgEl.style("height", "100%");
            imgEl.style("imageRendering", "pixelated");
            imgEl.style("pointerEvents", "none");
        } else {
            const placeholder = createDiv('•').parent(imgDiv);
            placeholder.style("width", "100%");
            placeholder.style("height", "100%");
            placeholder.style("display", "flex");
            placeholder.style("alignItems", "center");
            placeholder.style("justifyContent", "center");
        }

        let itemNameP = createP(itemName).parent(itemInfoDiv);
        itemNameP.style("font-size", "20px");
        itemNameP.style("color", rarityColorCSS(itemName));

        let itemAmountP = createP(curPlayer.invBlock.items[itemName].amount).parent(itemInfoDiv);
        itemAmountP.style("font-size", "20px");
        itemAmountP.style("color", "white");
    });
    highlightItemList();
}

function updatecurItemDiv() {
    if (curPlayer == undefined) return;
    curItemDiv.html("");

    if (curPlayer.invBlock.curItem == "") {
        let curItemNone = createP("No Selected Item");
        curItemNone.parent(curItemDiv);
        curItemNone.class("inventory-title");
        applyStyle(curItemNone, {
            paddingTop: "7%",
            textDecoration: "none"
        });
        return;
    }

    let itemCardDiv = createDiv();
    itemCardDiv.style("width", "100%");
    itemCardDiv.style("height", "30%");
    itemCardDiv.style("display", "flex");
    itemCardDiv.style("margin-bottom", "20px");
    itemCardDiv.parent(curItemDiv);

    let itemImgDiv = createDiv();
    itemImgDiv.style("width", "50%");
    itemImgDiv.style("height", "100%");
    itemImgDiv.style("border", "2px solid black");
    itemImgDiv.style("border-radius", "10px");

    const curEntry = curPlayer.invBlock.items[curPlayer.invBlock.curItem];
    const curURL = resolveItemImgURL(curPlayer.invBlock.curItem, curEntry);
    if (curURL) {
        itemImgDiv.style("background-image", "url('" + curURL + "')");
    } else {
        itemImgDiv.style("display", "flex");
        itemImgDiv.style("align-items", "center");
        itemImgDiv.style("justify-content", "center");
        const dot = createDiv("•");
        dot.style("font-size", "28px");
        dot.style("color", "#ccc");
        dot.parent(itemImgDiv);
    }
    itemImgDiv.style("background-size", "contain");
    itemImgDiv.style("background-repeat", "no-repeat");
    itemImgDiv.style("background-position", "center");
    itemImgDiv.style("image-rendering", "pixelated");
    itemImgDiv.parent(itemCardDiv);

    let itemNameDescDiv = createDiv();
    itemNameDescDiv.style("width", "calc(50% - 8px)");
    itemNameDescDiv.style("height", "100%");
    itemNameDescDiv.parent(itemCardDiv);

    let itemNameDiv = createDiv();
    itemNameDiv.style("width", "100%");
    itemNameDiv.style("height", "20%");
    itemNameDiv.style("border", "2px solid black");
    itemNameDiv.style("border-radius", "10px");
    itemNameDiv.parent(itemNameDescDiv);

    let itemNameP = createP(curPlayer.invBlock.curItem);
    itemNameP.style("font-size", "20px");
    itemNameP.style("color", rarityColorCSS(curPlayer.invBlock.curItem));
    itemNameP.style("margin", "5px");
    itemNameP.style("padding", "0");
    itemNameP.style("word-wrap", "break-word");
    itemNameP.style("overflow-wrap", "break-word");
    itemNameP.style("white-space", "normal");
    itemNameP.parent(itemNameDiv);

    let itemDescDiv = createDiv();
    itemDescDiv.style("width", "100%");
    itemDescDiv.style("height", "calc(80% - 5px)");
    itemDescDiv.style("border", "2px solid black");
    itemDescDiv.style("border-radius", "10px");
    itemDescDiv.parent(itemNameDescDiv);

    let itemDescP = createP(curPlayer.invBlock.items[curPlayer.invBlock.curItem].desc);
    itemDescP.style("font-size", "20px");
    itemDescP.style("color", "white");
    itemDescP.style("margin", "5px");
    itemDescP.parent(itemDescDiv);

    let itemStatsDiv = createDiv();
    itemStatsDiv.style("width", "100%");
    itemStatsDiv.style("height", "calc(70% - 10px)");
    itemStatsDiv.parent(curItemDiv);

    if (curPlayer.invBlock.items[curPlayer.invBlock.curItem].type != "Simple") {
        let durabilityDiv = createDiv();
        durabilityDiv.style("width", "calc(100% - 14px)");
        durabilityDiv.style("height", "10%");
        durabilityDiv.style("padding", "5px");
        durabilityDiv.style("border", "2px solid black");
        durabilityDiv.style("border-radius", "10px");
        durabilityDiv.style("display", "flex");
        durabilityDiv.style("align-items", "center");
        durabilityDiv.style("justify-content", "center");
        durabilityDiv.style("margin-bottom", "5px");
        durabilityDiv.parent(itemStatsDiv);

        let durabilityText = createP("Durability:");
        durabilityText.style("font-size", "20px");
        durabilityText.style("color", "white");
        durabilityText.parent(durabilityDiv);

        let durabilityBar = createDiv();
        durabilityBar.style("width", "80%");
        durabilityBar.style("height", "20px");
        durabilityBar.style("background-color", "red");
        durabilityBar.style("border", "2px solid black");
        durabilityBar.style("border-radius", "10px");
        durabilityBar.parent(durabilityDiv);

        let durabilityFill = createDiv();
        durabilityFill.style("width", ((curPlayer.invBlock.items[curPlayer.invBlock.curItem].durability / curPlayer.invBlock.items[curPlayer.invBlock.curItem].maxDurability) * 100) + "%");
        durabilityFill.style("height", "100%");
        durabilityFill.style("background-color", "green");
        durabilityFill.style("border-radius", "10px");
        durabilityFill.parent(durabilityBar);
    }

    let statsText = createDiv("Stats");
    statsText.style("font-size", "20px");
    statsText.style("color", "white");
    statsText.style("text-align", "center");
    statsText.style("border", "2px solid black");
    statsText.style("border-radius", "10px");
    statsText.style("padding", "10px");
    statsText.style("margin-bottom", "5px");
    statsText.parent(itemStatsDiv);

    let statsList = createDiv();
    statsList.style("width", "100%");
    statsList.style("height", "calc(90% - 10px)");
    statsList.style("overflow-y", "auto");
    statsList.parent(itemStatsDiv);

    let stats = curPlayer.invBlock.items[curPlayer.invBlock.curItem].getStats();
    stats.forEach(stat => {
        if (stat[0] == "Durability") { }
        else {
            let statDiv = createDiv();
            statDiv.style("width", "100%");
            statDiv.style("height", "20px");
            statDiv.style("display", "flex");
            statDiv.style("margin-bottom", "12px");
            statDiv.parent(statsList);

            let statNameDiv = createDiv(stat[0] + ":");
            statNameDiv.style("width", "50%");
            statNameDiv.style("height", "100%");
            statNameDiv.style("color", "white");
            statNameDiv.style("text-align", "center");
            statNameDiv.style("font-size", "20px");
            statNameDiv.style("border", "2px solid black");
            statNameDiv.style("border-radius", "10px");
            statNameDiv.style("padding", "5px");
            statNameDiv.parent(statDiv);

            let statNumDiv = createDiv(stat[1]);
            statNumDiv.style("width", "50%");
            statNumDiv.style("height", "100%");
            statNumDiv.style("color", "white");
            statNumDiv.style("text-align", "center");
            statNumDiv.style("font-size", "20px");
            statNumDiv.style("border", "2px solid black");
            statNumDiv.style("border-radius", "10px");
            statNumDiv.style("padding", "5px");
            statNumDiv.parent(statDiv);
        }
    });

    updateSpaceBarDiv();
}

function updateCraftList() {
    if (!curPlayer) return;
    craftListDiv.html("");

    let arr = curPlayer.invBlock.craftList.filter((recipe) => {
        const tag = curPlayer.invBlock.curTag;
        if (tag === "All") return true;
        if (tag === "Tools/Seeds") return recipe.type === "Shovel" || recipe.type === "Seed";
        if (tag === "Weapons") return recipe.type === "Melee" || recipe.type === "Ranged";
        if (tag === "Equipment") return recipe.type === "Equipment";
        if (tag === "Consumables") return recipe.type === "Food" || recipe.type === "Potion";
        return false;
    });

    const ROW_H = 50;
    arr.forEach((recipe) => {
        let recipeDiv = createDiv().parent(craftListDiv);
        recipeDiv.attribute('data-item', recipe.name);
        recipeDiv.style("width", "100%");
        recipeDiv.style("height", ROW_H + "px");
        recipeDiv.style("display", "flex");
        recipeDiv.style("align-items", "center");
        recipeDiv.style("justify-content", "center");
        recipeDiv.style("border-bottom", "2px solid black");
        recipeDiv.style("cursor", "pointer");
        recipeDiv.style("position", "relative");
        recipeDiv.mousePressed(() => {
            curPlayer.invBlock.curItem = recipe.name;
            highlightCraftList();
            updatecurCraftItemDiv();
        });

        recipe.uiElement = recipeDiv;

        let recipeInfoDiv = createDiv().parent(recipeDiv);
        recipeInfoDiv.style("width", "80%");
        recipeInfoDiv.style("height", ROW_H + "px");
        recipeInfoDiv.style("display", "flex");
        recipeInfoDiv.style("align-items", "center");
        recipeInfoDiv.style("justify-content", "space-between");

        let imgDiv = createDiv().parent(recipeInfoDiv);
        imgDiv.style("width", "2.2em");
        imgDiv.style("height", "2.2em");
        imgDiv.style("minWidth", "28px");
        imgDiv.style("minHeight", "28px");
        imgDiv.style("marginRight", "0.5em");
        imgDiv.style("display", "flex");
        imgDiv.style("align-items", "center");

        const url = resolveItemImgURL(recipe.name, { imgNum: recipe.img });
        if (url) {
            let imgEl = createImg(url, '').parent(imgDiv);
            imgEl.style("width", "100%");
            imgEl.style("height", "100%");
            imgEl.style("imageRendering", "pixelated");
            imgEl.style("pointerEvents", "none");
        } else {
            const placeholder = createDiv('•').parent(imgDiv);
            placeholder.style("width", "100%");
            placeholder.style("height", "100%");
            placeholder.style("display", "flex");
            placeholder.style("alignItems", "center");
            placeholder.style("justifyContent", "center");
        }

        let recipeNameP = createP(recipe.name).parent(recipeInfoDiv);
        recipeNameP.style("font-size", "20px");
        recipeNameP.style("color", rarityColorCSS(recipe.name));
    });
    highlightCraftList();
}

function updatecurCraftItemDiv() {
    if (curPlayer == undefined) return;
    curCraftItemDiv.html("");

    if (curPlayer.invBlock.curItem == "") {
        let curItemNone = createP("No Selected Recipe");
        curItemNone.parent(curCraftItemDiv);
        curItemNone.class("inventory-title");
        applyStyle(curItemNone, {
            paddingTop: "7%",
            textDecoration: "none"
        });
        return;
    }

    let recipe = curPlayer.invBlock.craftList.find(r => r.name === curPlayer.invBlock.curItem);
    if (!recipe) return;

    let itemCardDiv = createDiv();
    itemCardDiv.style("width", "100%");
    itemCardDiv.style("height", "30%");
    itemCardDiv.style("display", "flex");
    itemCardDiv.style("margin-bottom", "20px");
    itemCardDiv.parent(curCraftItemDiv);

    let itemImgDiv = createDiv();
    itemImgDiv.style("width", "50%");
    itemImgDiv.style("height", "100%");
    itemImgDiv.style("border", "2px solid black");
    itemImgDiv.style("border-radius", "10px");

    const curURL = resolveItemImgURL(recipe.name, { imgNum: recipe.img });
    if (curURL) {
        itemImgDiv.style("background-image", "url('" + curURL + "')");
    } else {
        itemImgDiv.style("display", "flex");
        itemImgDiv.style("align-items", "center");
        itemImgDiv.style("justify-content", "center");
        const dot = createDiv("•");
        dot.style("font-size", "28px");
        dot.style("color", "#ccc");
        dot.parent(itemImgDiv);
    }
    itemImgDiv.style("background-size", "contain");
    itemImgDiv.style("background-repeat", "no-repeat");
    itemImgDiv.style("background-position", "center");
    itemImgDiv.style("image-rendering", "pixelated");
    itemImgDiv.parent(itemCardDiv);

    let itemNameDescDiv = createDiv();
    itemNameDescDiv.style("width", "calc(50% - 8px)");
    itemNameDescDiv.style("height", "100%");
    itemNameDescDiv.parent(itemCardDiv);

    let itemNameDiv = createDiv();
    itemNameDiv.style("width", "100%");
    itemNameDiv.style("height", "20%");
    itemNameDiv.style("border", "2px solid black");
    itemNameDiv.style("border-radius", "10px");
    itemNameDiv.parent(itemNameDescDiv);

    let itemNameP = createP(recipe.name);
    itemNameP.style("font-size", "20px");
    itemNameP.style("color", rarityColorCSS(recipe.name));
    itemNameP.style("margin", "5px");
    itemNameP.style("padding", "0");
    itemNameP.parent(itemNameDiv);

    let itemDescDiv = createDiv();
    itemDescDiv.style("width", "100%");
    itemDescDiv.style("height", "calc(80% - 5px)");
    itemDescDiv.style("border", "2px solid black");
    itemDescDiv.style("border-radius", "10px");
    itemDescDiv.parent(itemNameDescDiv);

    let itemDescP = createP("Cost: " + JSON.stringify(recipe.cost));
    itemDescP.style("font-size", "16px");
    itemDescP.style("color", "white");
    itemDescP.style("margin", "5px");
    itemDescP.parent(itemDescDiv);

    let itemStatsDiv = createDiv();
    itemStatsDiv.style("width", "100%");
    itemStatsDiv.style("height", "calc(70% - 10px)");
    itemStatsDiv.parent(curCraftItemDiv);

    let costDiv = createDiv();
    costDiv.style("width", "100%");
    costDiv.style("height", "100%");
    costDiv.style("border", "2px solid black");
    costDiv.style("border-radius", "10px");
    costDiv.style("padding", "10px");
    costDiv.style("overflow-y", "auto");
    costDiv.parent(itemStatsDiv);

    let costText = createP("Recipe Cost:");
    costText.style("color", "white");
    costText.style("font-size", "18px");
    costText.style("margin", "0 0 10px 0");
    costText.parent(costDiv);

    recipe.cost.forEach(([mat, amt]) => {
        let matDiv = createP(mat + " x" + amt);
        matDiv.style("color", "white");
        matDiv.style("font-size", "14px");
        matDiv.style("margin", "5px 0");
        matDiv.parent(costDiv);
    });

    const canCraft = curPlayer?.invBlock?.craftCheck?.(recipe.name);

    let craftButton = createButton("Craft").parent(curCraftItemDiv);
    craftButton.style("width", "100%");
    craftButton.style("padding", "10px");
    craftButton.style("font-size", "16px");
    craftButton.style("background-color", canCraft ? "#2e8b57" : "#444");
    craftButton.style("color", canCraft ? "white" : "#aaa");
    craftButton.style("border", "1px solid black");
    craftButton.elt.disabled = !canCraft;
    craftButton.mousePressed(() => {
        craftItem(recipe.name);
    });

    let craftAllButton = createButton("Craft All").parent(curCraftItemDiv);
    craftAllButton.style("width", "100%");
    craftAllButton.style("padding", "10px");
    craftAllButton.style("font-size", "16px");
    craftAllButton.style("margin-top", "8px");
    craftAllButton.style("background-color", canCraft ? "#3b7dd8" : "#444");
    craftAllButton.style("color", canCraft ? "white" : "#aaa");
    craftAllButton.style("border", "1px solid black");
    craftAllButton.elt.disabled = !canCraft;
    craftAllButton.mousePressed(() => {
        craftItemAll(recipe.name);
    });
}

/**
 * Craft a specific item a given number of times (defaults to 1). Uses the recipe's
 * cost[0] as the output quantity and subtracts ingredient costs safely.
 */
function craftItem(itemName, count = 1) {
    if (!curPlayer?.invBlock || !itemDic?.[itemName]) return;

    const recipe = itemDic[itemName];
    const cost = Array.isArray(recipe.cost) ? recipe.cost : [];
    if (cost.length < 1) return;

    // Cap the craft count to the maximum possible with available resources
    const maxCrafts = getMaxCrafts(itemName);
    const craftCount = Math.max(1, Math.min(count, maxCrafts));
    if (craftCount <= 0) return;

    const outputAmount = (cost[0] || 1) * craftCount;
    curPlayer.invBlock.addItem(itemName, outputAmount, true);

    // Subtract ingredients starting at index 1 (index 0 is output quantity)
    for (let i = 1; i < cost.length; i++) {
        const ingredientName = cost[i][0];
        const ingredientAmt = cost[i][1] * craftCount;
        if (ingredientName === "Dirt") {
            dirtInv -= ingredientAmt;
        } else {
            curPlayer.invBlock.decreaseAmount(ingredientName, ingredientAmt);
        }
    }

    updateCraftList();
    updatecurCraftItemDiv();
}

/**
 * Craft as many items as possible with current resources.
 */
function craftItemAll(itemName) {
    const maxCrafts = getMaxCrafts(itemName);
    if (maxCrafts > 0) {
        craftItem(itemName, maxCrafts);
    }
}

/**
 * Determine the maximum number of crafts possible with current resources.
 */
function getMaxCrafts(itemName) {
    if (!curPlayer?.invBlock || !itemDic?.[itemName]) return 0;
    const cost = itemDic[itemName].cost || [];
    if (cost.length < 2) return 0; // need at least one ingredient

    let maxCrafts = Infinity;
    for (let i = 1; i < cost.length; i++) {
        const ingredientName = cost[i][0];
        const required = cost[i][1];
        const available = (ingredientName === "Dirt")
            ? dirtInv
            : (curPlayer.invBlock.items[ingredientName]?.amount || 0);
        const possible = Math.floor(available / required);
        maxCrafts = Math.min(maxCrafts, possible);
    }

    return Number.isFinite(maxCrafts) ? maxCrafts : 0;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * Swap Inventory UI Module (Rewritten)
 * Handles: player inventory ↔ chest/bag/other inventory
 *
 * Architecture:
 *   - One consolidated close function:      closeSwapInv()
 *   - One consolidated Take All function:   swapTakeAll()
 *   - One detail panel updater:             updateSwapItemDetails()
 *     (updatecurSwapItemDiv is gone — it was a competing function
 *      that nuked the DOM with html("") and leaked p5 elements)
 *   - Mobile transfer supports "Move Stack" via long-press
 *   - All styling via CSS classes, no inline styles on rebuild
 * ═══════════════════════════════════════════════════════════════
 */

var swapInvDiv;
var itemListDivLeft;
var itemListDivRight;
var curSwapItemDiv;
var _swapDetailContent; // stable inner wrapper for detail panel content

/* ─── Show / Hide (always class-toggle — works on desktop & mobile) ─── */
function showSwapInv() {
    if (!swapInvDiv) return;
    if (typeof gameState !== 'undefined' && gameState !== 'playing' && gameState !== 'swap_inv') return;
    swapInvDiv.addClass('swap-open');
}
function hideSwapInv() {
    if (!swapInvDiv) return;
    swapInvDiv.removeClass('swap-open');
}

/* ─── Consolidated close (saves, emits, hides) ─── */
function closeSwapInv() {
    if (!curPlayer) return;
    // Push pending chest/bag changes to server
    if (curPlayer.otherInv && curPlayer.otherInv.pos) {
        const cp = testMap.globalToChunk(curPlayer.otherInv.pos.x, curPlayer.otherInv.pos.y);
        socket.emit("update_inv", {
            cx: cp.x, cy: cp.y,
            objName: curPlayer.otherInv.objName,
            pos: { x: curPlayer.otherInv.pos.x, y: curPlayer.otherInv.pos.y },
            z: curPlayer.otherInv.z,
            invId: curPlayer.otherInv.invBlock?.invId,
            items: curPlayer.otherInv.invBlock.items
        });
    }
    gameState = "playing";
    if (curPlayer.invBlock) curPlayer.invBlock.useTimer = 10;
    hideSwapInv();
    if (typeof spaceBarDiv !== 'undefined' && spaceBarDiv) spaceBarDiv.hide();
    curPlayer.otherInv = undefined;
}

/* ─── Consolidated Take All ─── */
function swapTakeAll() {
    if (!curPlayer || !curPlayer.otherInv || !curPlayer.otherInv.invBlock) return;
    const otherInv = curPlayer.otherInv.invBlock;
    const otherItems = otherInv.items || {};
    Object.keys(otherItems).forEach((itemName) => {
        const itemData = otherItems[itemName];
        if (itemData && itemData.amount > 0) {
            curPlayer.invBlock.addItem(itemName, itemData.amount, true);
            otherInv.decreaseAmount(itemName, itemData.amount);
        }
    });
    curPlayer.invBlock.curItem = "";
    otherInv.curItem = "";
    // Force full rebuild (cache will detect change)
    swapListCache.lastLeftHash = "";
    swapListCache.lastRightHash = "";
    updateSwapItemLists(otherInv);
    _syncOtherInv();
}

/* ─── Sync helper — emits update_inv for the other inventory ─── */
function _syncOtherInv() {
    if (!curPlayer || !curPlayer.otherInv || !curPlayer.otherInv.pos) return;
    const cp = testMap.globalToChunk(curPlayer.otherInv.pos.x, curPlayer.otherInv.pos.y);
    socket.emit("update_inv", {
        cx: cp.x, cy: cp.y,
        objName: curPlayer.otherInv.objName,
        pos: { x: curPlayer.otherInv.pos.x, y: curPlayer.otherInv.pos.y },
        z: curPlayer.otherInv.z,
        invId: curPlayer.otherInv.invBlock?.invId,
        items: curPlayer.otherInv.invBlock.items
    });
}

/* ─── Cache for smart list rebuilds ─── */
var swapListCache = {
    lastLeftHash: "",
    lastRightHash: "",
    leftSelected: "",
    rightSelected: ""
};

/* ═══ defineSwapInvUI — called once during setup() ═══ */
function defineSwapInvUI() {
    swapInvDiv = createDiv();
    swapInvDiv.id("swap-inventory");
    swapInvDiv.addClass("container");
    swapInvDiv.addClass("swap-inv-container");

    /* ── Desktop title bar ── */
    let titleBar = createDiv();
    titleBar.addClass("swap-inv-titlebar");
    titleBar.parent(swapInvDiv);

    createP("Your Inventory").parent(titleBar).addClass("swap-inv-section-title");
    createP("Selected Item").parent(titleBar).addClass("swap-inv-section-title");
    createP("Other Inventory").parent(titleBar).addClass("swap-inv-section-title");

    let closeBtn = createButton("✕");
    closeBtn.addClass("swap-inv-close-btn");
    closeBtn.parent(titleBar);
    closeBtn.mousePressed(() => closeSwapInv());

    /* ── Content area (3-column on desktop, stacked on mobile) ── */
    let content = createDiv();
    content.addClass("swap-inv-content");
    content.parent(swapInvDiv);

    // Left column — player inventory
    itemListDivLeft = createDiv();
    itemListDivLeft.addClass("swap-inv-column");
    itemListDivLeft.parent(content);

    // Middle column — item detail + Take All
    curSwapItemDiv = createDiv();
    curSwapItemDiv.addClass("swap-inv-column");
    curSwapItemDiv.addClass("swap-inv-middle");
    curSwapItemDiv.parent(content);

    // Stable inner wrapper — only this gets wiped on detail updates
    _swapDetailContent = createDiv();
    _swapDetailContent.addClass("swap-detail-content");
    _swapDetailContent.parent(curSwapItemDiv);

    let emptyMsg = createP("No item selected");
    emptyMsg.addClass("swap-inv-empty");
    emptyMsg.parent(_swapDetailContent);

    // Desktop Take All button (persists, never destroyed)
    let takeAllBtn = createButton("⬅ Take All");
    takeAllBtn.id("swap-take-all-btn");
    takeAllBtn.addClass("swap-take-all-btn");
    takeAllBtn.parent(curSwapItemDiv);
    takeAllBtn.mousePressed(() => swapTakeAll());

    // Right column — other inventory
    itemListDivRight = createDiv();
    itemListDivRight.addClass("swap-inv-column");
    itemListDivRight.parent(content);

    /* ── Tab bar + action bar (CSS hides on desktop, shows on mobile) ── */
    let tabBar = createDiv();
    tabBar.id("swap-mobile-tabs");
    tabBar.parent(swapInvDiv);

    let mobileClose = createButton("✕");
    mobileClose.id("swap-mobile-close");
    mobileClose.parent(tabBar);
    mobileClose.mousePressed(() => closeSwapInv());

    let tabYours = createButton("📦 Yours");
    tabYours.id("swap-tab-yours");
    tabYours.addClass("swap-tab-btn");
    tabYours.addClass("active");
    tabYours.parent(tabBar);
    tabYours.mousePressed(() => switchSwapMobileTab("yours"));

    let tabOther = createButton("🗃️ Other");
    tabOther.id("swap-tab-other");
    tabOther.addClass("swap-tab-btn");
    tabOther.parent(tabBar);
    tabOther.mousePressed(() => switchSwapMobileTab("other"));

    let actionBar = createDiv();
    actionBar.id("swap-mobile-actions");
    actionBar.parent(swapInvDiv);

    let xferBtn = createButton("→ Move to Other");
    xferBtn.id("swap-xfer-btn");
    xferBtn.addClass("swap-action-btn");
    xferBtn.parent(actionBar);
    xferBtn.mousePressed(() => swapMobileTransfer(false));

    let xferStackBtn = createButton("⇉ Move Stack");
    xferStackBtn.id("swap-xfer-stack-btn");
    xferStackBtn.addClass("swap-action-btn");
    xferStackBtn.addClass("swap-move-stack");
    xferStackBtn.parent(actionBar);
    xferStackBtn.mousePressed(() => swapMobileTransfer(true));

    let takeAllMobile = createButton("⬅ Take All");
    takeAllMobile.id("swap-take-all-mobile");
    takeAllMobile.addClass("swap-action-btn");
    takeAllMobile.addClass("swap-take-all");
    takeAllMobile.parent(actionBar);
    takeAllMobile.mousePressed(() => swapTakeAll());

    switchSwapMobileTab("yours");

    hideSwapInv();
}

/* ─── Mobile tab state ─── */
var _swapMobileTab = "yours";

function switchSwapMobileTab(tab) {
    _swapMobileTab = tab;
    const yoursBtn = document.getElementById("swap-tab-yours");
    const otherBtn = document.getElementById("swap-tab-other");
    if (yoursBtn) yoursBtn.classList.toggle("active", tab === "yours");
    if (otherBtn) otherBtn.classList.toggle("active", tab === "other");
    if (itemListDivLeft && itemListDivLeft.elt) {
        itemListDivLeft.elt.classList.toggle("swap-tab-hidden", tab !== "yours");
    }
    if (itemListDivRight && itemListDivRight.elt) {
        itemListDivRight.elt.classList.toggle("swap-tab-hidden", tab !== "other");
    }
    const xferBtn = document.getElementById("swap-xfer-btn");
    const xferStackBtn = document.getElementById("swap-xfer-stack-btn");
    if (xferBtn) xferBtn.textContent = tab === "yours" ? "→ Move to Other" : "← Take to Yours";
    if (xferStackBtn) xferStackBtn.textContent = tab === "yours" ? "⇉ Move Stack" : "⇇ Take Stack";
}

/* ─── Mobile transfer (single or whole stack) ─── */
function swapMobileTransfer(moveAll) {
    if (!curPlayer || !curPlayer.otherInv || !curPlayer.otherInv.invBlock) return;
    const otherInv = curPlayer.otherInv.invBlock;

    if (_swapMobileTab === "yours" && curPlayer.invBlock.curItem !== "") {
        const item = curPlayer.invBlock.curItem;
        const amt = moveAll ? (curPlayer.invBlock.items[item]?.amount || 1) : 1;
        otherInv.addItem(item, amt, false);
        curPlayer.invBlock.decreaseAmount(item, amt);
        if (!curPlayer.invBlock.items[item]) {
            otherInv.curItem = item;
            curPlayer.invBlock.curItem = "";
        }
    } else if (_swapMobileTab === "other" && otherInv.curItem !== "") {
        const item = otherInv.curItem;
        const amt = moveAll ? (otherInv.items[item]?.amount || 1) : 1;
        curPlayer.invBlock.addItem(item, amt, true);
        otherInv.decreaseAmount(item, amt);
        if (!otherInv.items[item]) {
            curPlayer.invBlock.curItem = item;
            otherInv.curItem = "";
        }
    }

    // Force full rebuild so amounts update
    swapListCache.lastLeftHash = "";
    swapListCache.lastRightHash = "";
    updateSwapItemLists(otherInv);
    _syncOtherInv();
}

/* ═══ Rebuild both inventory columns ═══ */
function updateSwapItemLists(otherInv) {
    if (!curPlayer || !curPlayer.invBlock) return;

    const myItems = curPlayer.invBlock.items || {};
    const otherItems = otherInv?.items || {};

    const leftHash = _hashItems(myItems);
    const rightHash = _hashItems(otherItems);

    const leftChanged = leftHash !== swapListCache.lastLeftHash;
    const rightChanged = rightHash !== swapListCache.lastRightHash;

    if (!leftChanged && !rightChanged &&
        curPlayer.invBlock.curItem === swapListCache.leftSelected &&
        (otherInv?.curItem || "") === swapListCache.rightSelected) {
        return;
    }

    swapListCache.lastLeftHash = leftHash;
    swapListCache.lastRightHash = rightHash;
    swapListCache.leftSelected = curPlayer.invBlock.curItem;
    swapListCache.rightSelected = otherInv?.curItem || "";

    if (leftChanged) {
        updateSwapColumn("left", myItems, curPlayer.invBlock.curItem, (itemName) => {
            curPlayer.invBlock.curItem = itemName;
            if (otherInv) otherInv.curItem = "";
            fastHighlightSwapLists(itemName, "");
            updateSwapItemDetails(itemName, myItems[itemName]);
        });
    }

    if (rightChanged) {
        updateSwapColumn("right", otherItems, otherInv?.curItem || "", (itemName) => {
            curPlayer.invBlock.curItem = "";
            if (otherInv) otherInv.curItem = itemName;
            fastHighlightSwapLists("", itemName);
            updateSwapItemDetails(itemName, otherItems[itemName]);
        });
    }

    // Update highlight if selection changed but lists didn't rebuild
    if (!leftChanged && !rightChanged) {
        fastHighlightSwapLists(curPlayer.invBlock.curItem, otherInv?.curItem || "");
    }

    // Update center detail panel
    const selectedItem = curPlayer.invBlock.curItem || otherInv?.curItem || "";
    const selectedData = curPlayer.invBlock.curItem
        ? myItems[selectedItem]
        : otherInv?.items?.[selectedItem];
    updateSwapItemDetails(selectedItem, selectedData);
}

/* ─── Build one column ─── */
function updateSwapColumn(side, items, selectedItem, onSelect) {
    const container = side === "left" ? itemListDivLeft : itemListDivRight;
    container.html("");

    const itemNames = Object.keys(items).sort();

    itemNames.forEach((itemName) => {
        const entry = items[itemName] || { amount: 0 };
        const isSelected = itemName === selectedItem;

        const row = createDiv();
        row.parent(container);
        row.addClass("swap-inv-item-row");
        row.attribute("data-item", itemName);
        if (isSelected) row.addClass("selected");
        row.mousePressed(() => onSelect(itemName));

        const imgWrap = createDiv();
        imgWrap.parent(row);
        imgWrap.addClass("swap-inv-item-image");

        const imgUrl = resolveItemImgURL(itemName, entry);
        if (imgUrl) {
            let img = createImg(imgUrl, itemName);
            img.addClass("swap-inv-img");
            img.parent(imgWrap);
        } else {
            let ph = createDiv("📦");
            ph.parent(imgWrap);
            ph.addClass("swap-inv-placeholder");
        }

        const info = createDiv();
        info.parent(row);
        info.addClass("swap-inv-item-info");

        let nameP = createP((isSelected ? "→ " : "") + itemName);
        nameP.parent(info);
        nameP.addClass("swap-inv-item-name");
        try {
            if (typeof window.getItemRarityCSSByName === 'function') {
                nameP.style("color", window.getItemRarityCSSByName(itemName));
            }
        } catch (e) {}

        let amtP = createP("×" + (entry.amount || 0));
        amtP.parent(info);
        amtP.addClass("swap-inv-item-amount");
    });

    if (itemNames.length === 0) {
        let empty = createP("(empty)");
        empty.parent(container);
        empty.addClass("swap-inv-empty");
    }
}

/* ─── Fast highlight toggle (no DOM rebuild) ─── */
function fastHighlightSwapLists(leftSelected, rightSelected) {
    [itemListDivLeft, itemListDivRight].forEach((list, idx) => {
        if (!list?.elt?.children) return;
        const sel = idx === 0 ? leftSelected : rightSelected;
        for (const row of list.elt.children) {
            const name = row.getAttribute("data-item");
            row.classList.toggle("selected", name === sel);
        }
    });
}

/* ─── Detail panel — wipes only _swapDetailContent, Take All persists ─── */
function updateSwapItemDetails(itemName, itemEntry) {
    if (!_swapDetailContent) return;
    _swapDetailContent.html("");

    if (!itemName || !itemEntry) {
        let noSel = createP("No item selected");
        noSel.parent(_swapDetailContent);
        noSel.addClass("swap-inv-empty");
        return;
    }

    // Hydrate images for loot bags
    if (curPlayer?.otherInv?.objName === "ItemBag" && itemEntry) {
        if (itemEntry.imgNum === undefined || itemEntry.imgNum === null) {
            const dictImg = itemDic?.[itemName]?.imgNum;
            if (dictImg !== undefined) itemEntry.imgNum = dictImg;
        }
    }

    // ── Image ──
    let imgDiv = createDiv();
    imgDiv.parent(_swapDetailContent);
    imgDiv.addClass("swap-inv-detail-image");

    const imgUrl = resolveItemImgURL(itemName, itemEntry);
    if (imgUrl) {
        let img = createImg(imgUrl, itemName);
        img.addClass("swap-inv-detail-img");
        img.parent(imgDiv);
    } else {
        let ph = createDiv("📦");
        ph.parent(imgDiv);
        ph.addClass("swap-inv-detail-placeholder");
    }

    // ── Name ──
    let nameP = createP(itemName);
    nameP.parent(_swapDetailContent);
    nameP.addClass("swap-inv-detail-name");
    try {
        if (typeof window.getItemRarityCSSByName === 'function') {
            nameP.style("color", window.getItemRarityCSSByName(itemName));
        }
    } catch (e) {}

    // ── Amount ──
    let amtP = createP("Amount: " + (itemEntry.amount || 0));
    amtP.parent(_swapDetailContent);
    amtP.addClass("swap-inv-detail-amount");

    // ── Description ──
    const desc = itemEntry.desc || itemDic?.[itemName]?.desc || "No description";
    let descP = createP(desc);
    descP.parent(_swapDetailContent);
    descP.addClass("swap-inv-detail-desc");

    // ── Durability bar (only for non-Simple items) ──
    if (itemEntry.type !== "Simple" &&
        typeof itemEntry.durability === "number" &&
        typeof itemEntry.maxDurability === "number" &&
        itemEntry.maxDurability > 0) {
        let durWrap = createDiv();
        durWrap.parent(_swapDetailContent);
        durWrap.addClass("swap-detail-durability");

        let durLabel = createP("Durability");
        durLabel.parent(durWrap);
        durLabel.addClass("swap-detail-dur-label");

        let barBg = createDiv();
        barBg.parent(durWrap);
        barBg.addClass("swap-detail-dur-bar");

        const pct = Math.max(0, Math.min(1, itemEntry.durability / itemEntry.maxDurability)) * 100;
        let barFill = createDiv();
        barFill.parent(barBg);
        barFill.addClass("swap-detail-dur-fill");
        barFill.style("width", pct + "%");
    }

    // ── Stats list ──
    let stats;
    const myCur = curPlayer?.invBlock?.curItem || "";
    if (myCur !== "" && typeof curPlayer.invBlock.getItemStats === "function") {
        stats = curPlayer.invBlock.getItemStats(itemName);
    } else if (curPlayer?.otherInv?.invBlock && typeof curPlayer.otherInv.invBlock.getItemStats === "function") {
        stats = curPlayer.otherInv.invBlock.getItemStats(itemName);
    }

    if (Array.isArray(stats) && stats.length > 0) {
        let statsWrap = createDiv();
        statsWrap.parent(_swapDetailContent);
        statsWrap.addClass("swap-detail-stats");

        stats.forEach(stat => {
            if (!Array.isArray(stat) || stat.length < 2) return;
            if (stat[0] === "Durability") return;

            let row = createDiv();
            row.parent(statsWrap);
            row.addClass("swap-detail-stat-row");

            let label = createDiv(String(stat[0]) + ":");
            label.parent(row);
            label.addClass("swap-detail-stat-label");

            let val = createDiv(String(stat[1]));
            val.parent(row);
            val.addClass("swap-detail-stat-value");
        });
    }

    if (typeof updateSpaceBarDiv === "function") updateSpaceBarDiv();
}

/* ─── Alias for backward-compat (callers that used updatecurSwapItemDiv) ─── */
function updatecurSwapItemDiv(otherInv) {
    if (!curPlayer || !curPlayer.invBlock) return;
    const myCur = curPlayer.invBlock.curItem || "";
    const theirCur = otherInv?.curItem || "";
    const selectedName = myCur || theirCur;
    const selectedData = myCur
        ? curPlayer.invBlock.items?.[myCur]
        : otherInv?.items?.[theirCur];
    updateSwapItemDetails(selectedName, selectedData);
}

/* ─── Hash for change detection ─── */
function _hashItems(obj) {
    if (!obj || typeof obj !== 'object') return "";
    const keys = Object.keys(obj).sort();
    let h = '';
    for (const k of keys) {
        h += k + ':' + (obj[k]?.amount || 0) + '|';
    }
    return h;
}

/**
 * Backfills missing imgNum fields for loot bags.
 */
function hydrateBagItemImages(inv) {
    if (!inv || !inv.items) return inv;
    if (!curPlayer || !curPlayer.otherInv || curPlayer.otherInv.objName !== "ItemBag") return inv;
    Object.keys(inv.items).forEach((name) => {
        const entry = inv.items[name];
        if (!entry) return;
        if (entry.imgNum === undefined || entry.imgNum === null) {
            const imgNum = itemDic?.[name]?.imgNum;
            if (imgNum !== undefined) entry.imgNum = imgNum;
        }
    });
    return inv;
}
