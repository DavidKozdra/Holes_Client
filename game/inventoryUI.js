// Inventory UI: Inventory display, item list, and controls
// Extracted from ui.js

var invDiv;
var itemListDiv;
var curItemDiv;
var allTag;
var toolsTag;
var weaponsTag;
var equipmentTag;
var consumablesTag;
var viewingPlayerProfile;
var nameBtn;

// Crafting UI
function defineCraftingUI() {
    craftDiv = createDiv();
    craftDiv.id("inventory");
    craftDiv.class("container");
    swapInvDiv.style("z-index", "50");
    applyStyle(craftDiv, {
        position: "absolute",
        top: "45%",
        left: "55%",
        transform: "translate(-50%, -50%)",
        display: "none",
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
        craftDiv.hide();
    });
    invTitle.style("cursor", "pointer");
    let craftingTitle = createP("Crafting").parent(topBar);
    craftingTitle.class("inventory-title");
    craftingTitle.style("color", "var(--color-gold)");
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
    itemListDiv = createDiv().parent(bottomDiv);
    itemListDiv.class("item-list");
    curItemDiv = createDiv().parent(bottomDiv);
    curItemDiv.class("item-details");
    let closeButton = createImg("images/ui/x.png", "").parent(topBar);
    closeButton.addClass("icon-btn");
    closeButton.class("close-button");
    closeButton.addClass("icon-btn");
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

// Swap Inventory UI - Defined in ui.js (this duplicate removed to avoid conflicts)

// Spacebar UI
function defineSpaceBarUI() {
    spaceBarDiv = createDiv("");
    spaceBarDiv.class("spacebar-hotkey");
    spaceBarDiv.html("Hotkey: Space");
    spaceBarDiv.style("position", "absolute");
    spaceBarDiv.style("bottom", "10px");
    spaceBarDiv.style("left", "50%");
    spaceBarDiv.style("transform", "translateX(-50%)");
    spaceBarDiv.style("z-index", "100");
    let keyCap = createDiv("SPACE").parent(spaceBarDiv);
    keyCap.class("key-cap");
    keyCap.style("display", "inline-block");
    keyCap.style("padding", "10px 20px");
    keyCap.style("background-color", "rgba(255, 255, 255, 0.2)");
    keyCap.style("border-radius", "5px");
    keyCap.style("font-weight", "bold");
    keyCap.style("text-align", "center");
    keyCap.style("cursor", "pointer");
    keyCap.mousePressed(() => {
        if (gameState === "inventory") {
            gameState = "playing";
            invDiv.hide();
            spaceBarDiv.hide();
        } else {
            gameState = "inventory";
            invDiv.show();
            spaceBarDiv.show();
        }
    });
}

// Export to global
window.defineCraftingUI = defineCraftingUI;
// window.defineSwapInvUI - defined in ui.js
window.defineSpaceBarUI = defineSpaceBarUI;

function defineInvUI() {
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
    invTitle.style("color", "var(--color-gold)");
    let craftingTitle = createP("Crafting").parent(topBar);
    craftingTitle.class("inventory-title");
    craftingTitle.mousePressed(() => {
        gameState = "crafting";
        craftDiv.show();
        curPlayer.invBlock.curItem = "";
        updateCraftList();
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
    closeButton.addClass("icon-btn");
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

window.defineInvUI = defineInvUI;

/**
 * Swap Inventory UI Module
 * Handles: player inventory ↔ chest/bag/other inventory
 */

var swapInvDiv;
var itemListDivLeft;
var itemListDivRight;
var curSwapItemDiv;

// Cache for quick updates - prevents unnecessary rebuilds
var swapListCache = {
    leftItems: {},
    rightItems: {},
    leftSelected: "",
    rightSelected: "",
    lastLeftHash: "",
    lastRightHash: ""
};

/**
 * Initialize the swap inventory UI
 * Called once during setup
 */
function defineSwapInvUI() {
    swapInvDiv = createDiv();
    swapInvDiv.id("inventory");
    swapInvDiv.class("container");
    swapInvDiv.style("position", "absolute");
    swapInvDiv.style("top", "50%");
    swapInvDiv.style("left", "50%");
    swapInvDiv.style("transform", "translate(-50%, -50%)");
    swapInvDiv.style("z-index", "50");
    
    let swapInvTitleBar = createDiv();
    swapInvTitleBar.parent(swapInvDiv);
    applyStyle(swapInvTitleBar, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "15px",
        borderBottom: "2px solid black"
    });

    let swapInvYourInvTittle = createP("Your Inventory");
    swapInvYourInvTittle.parent(swapInvTitleBar);
    swapInvYourInvTittle.class("inventory-title");
    swapInvYourInvTittle.style("margin-left", "25px");

    let swapInvCurItemTittle = createP("Selected Item");
    swapInvCurItemTittle.parent(swapInvTitleBar);
    swapInvCurItemTittle.class("inventory-title");

    let swapInvOtherInvTittle = createP("Other Inventory");
    swapInvOtherInvTittle.parent(swapInvTitleBar);
    swapInvOtherInvTittle.class("inventory-title");
    swapInvOtherInvTittle.style("margin-right", "25px");

    let swapInvDivInnerds = createDiv();
    swapInvDivInnerds.parent(swapInvDiv);
    swapInvDivInnerds.style("display", "flex");
    swapInvDivInnerds.style("flex-direction", "row");
    swapInvDivInnerds.style("justify-content", "space-evenly");
    swapInvDivInnerds.style("align-items", "start");

    //Left Item list
    itemListDivLeft = createDiv().parent(swapInvDivInnerds);
    itemListDivLeft.class("item-list");

    // Current item details (container)
    curSwapItemDiv = createDiv().parent(swapInvDivInnerds);
    curSwapItemDiv.class("item-details");
    
    // Inner div for item details content (this will be cleared when updating)
    var curSwapItemContentDiv = createDiv().parent(curSwapItemDiv);
    curSwapItemContentDiv.class("swap-item-content");
    curSwapItemContentDiv.id("swap-item-content-inner");

    let curSwapItemNone = createP("No Selected Item");
    curSwapItemNone.parent(curSwapItemContentDiv);
    curSwapItemNone.class("inventory-title");
    applyStyle(curSwapItemNone, {
        paddingTop: "7%",
        textDecoration: "none"
    });

    // Take All button (outside content div so it persists)
    let takeAllButton = createButton("⬅ Take All").parent(curSwapItemDiv);
    takeAllButton.id("swap-take-all-btn");
    applyStyle(takeAllButton, {
        padding: "10px 15px",
        cursor: "pointer",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "5px",
        fontWeight: "bold",
        marginTop: "20px",
        width: "90%"
    });
    takeAllButton.mousePressed(() => {
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
        updateSwapItemLists(otherInv);
        if (curPlayer.otherInv.pos) {
            const chunkPos = testMap.globalToChunk(curPlayer.otherInv.pos.x, curPlayer.otherInv.pos.y);
            socket.emit("update_inv", {
                cx: chunkPos.x, cy: chunkPos.y,
                objName: curPlayer.otherInv.objName,
                pos: { x: curPlayer.otherInv.pos.x, y: curPlayer.otherInv.pos.y },
                z: curPlayer.otherInv.z,
                invId: otherInv.invId,
                items: otherInv.items
            });
        }
    });

    //Right Item list
    itemListDivRight = createDiv().parent(swapInvDivInnerds);
    itemListDivRight.class("item-list");
    itemListDivRight.style("border-left", "2px solid black");

    // Close Button (image X)
    let closeButton = createImg("images/ui/x.png", "").parent(swapInvTitleBar);
    closeButton.class("close-button");
    closeButton.addClass("icon-btn");
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
        // Push any pending chest/bag changes before closing
        if (curPlayer.otherInv && curPlayer.otherInv.pos) {
            const chunkPos = testMap.globalToChunk(curPlayer.otherInv.pos.x, curPlayer.otherInv.pos.y);
            socket.emit("update_inv", {
                cx: chunkPos.x, cy: chunkPos.y,
                objName: curPlayer.otherInv.objName,
                pos: { x: curPlayer.otherInv.pos.x, y: curPlayer.otherInv.pos.y },
                z: curPlayer.otherInv.z,
                invId: curPlayer.otherInv.invBlock?.invId,
                items: curPlayer.otherInv.invBlock.items
            });
        }
        gameState = "playing"
        curPlayer.invBlock.useTimer = 10;
        swapInvDiv.hide();
        spaceBarDiv.hide();
    });

    swapInvDiv.hide();
}

/**
 * Quickly update swap list highlighting without full DOM rebuild.
 * Only updates background colors and font styles for selected rows.
 */
function fastHighlightSwapLists(leftSelected, rightSelected) {
    if (!itemListDivLeft || !itemListDivRight) return;
    
    const leftChildren = itemListDivLeft.elt?.children;
    const rightChildren = itemListDivRight.elt?.children;
    
    if (leftChildren) {
        for (let i = 0; i < leftChildren.length; i++) {
            const row = leftChildren[i];
            const name = row.getAttribute('data-item');
            const isSel = name === leftSelected;
            row.style.backgroundColor = isSel ? 'rgb(120, 120, 120)' : '';
            row.style.fontStyle = isSel ? 'italic' : 'normal';
        }
    }
    
    if (rightChildren) {
        for (let i = 0; i < rightChildren.length; i++) {
            const row = rightChildren[i];
            const name = row.getAttribute('data-item');
            const isSel = name === rightSelected;
            row.style.backgroundColor = isSel ? 'rgb(120, 120, 120)' : '';
            row.style.fontStyle = isSel ? 'italic' : 'normal';
        }
    }
}

/**
 * Backfills missing imgNum fields for loot bags while leaving chests/other containers untouched.
 * Only runs when the currently opened otherInv is an ItemBag.
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

/**
 * Rebuild both inventory columns when data changes
 * Uses smart cache detection to avoid unnecessary rebuilds
 * @param {Object} otherInv - The other inventory data
 */
function updateSwapItemLists(otherInv) {
    if (!curPlayer || !curPlayer.invBlock) return;

    const myItems = curPlayer.invBlock.items || {};
    const otherItems = (otherInv?.items) || {};

    // PERF: Generate hashes of item data to detect actual changes
    const leftHash = hashObject(myItems);
    const rightHash = hashObject(otherItems);
    
    const leftChanged = leftHash !== swapListCache.lastLeftHash;
    const rightChanged = rightHash !== swapListCache.lastRightHash;
    
    // Skip updates if nothing changed
    if (!leftChanged && !rightChanged && 
        curPlayer.invBlock.curItem === swapListCache.leftSelected &&
        otherInv?.curItem === swapListCache.rightSelected) {
        return;
    }
    
    swapListCache.lastLeftHash = leftHash;
    swapListCache.lastRightHash = rightHash;

    // Only rebuild columns that actually changed
    if (leftChanged) {
        updateSwapColumn("left", myItems, curPlayer.invBlock.curItem, (itemName) => {
            curPlayer.invBlock.curItem = itemName;
            if (otherInv) otherInv.curItem = "";
            updateSwapItemDetails(itemName, myItems[itemName]);
            fastHighlightSwapLists(curPlayer.invBlock.curItem, otherInv?.curItem || "");
        });
    }

    if (rightChanged) {
        updateSwapColumn("right", otherItems, otherInv?.curItem || "", (itemName) => {
            curPlayer.invBlock.curItem = "";
            if (otherInv) otherInv.curItem = itemName;
            updateSwapItemDetails(itemName, otherItems[itemName]);
            fastHighlightSwapLists(curPlayer.invBlock.curItem, otherInv?.curItem || "");
        });
    }

    // Always update center panel with selected item details
    const selectedItem = curPlayer.invBlock.curItem || otherInv?.curItem;
    const selectedData = curPlayer.invBlock.curItem 
        ? myItems[selectedItem]
        : otherInv?.items?.[selectedItem];

    updateSwapItemDetails(selectedItem, selectedData);
}

/**
 * Update a single swap inventory column
 * @param {string} side - "left" or "right"
 * @param {Object} items - Items object
 * @param {string} selectedItem - Currently selected item name
 * @param {Function} onSelect - Callback when item selected
 */
function updateSwapColumn(side, items, selectedItem, onSelect) {
    const container = side === "left" ? itemListDivLeft : itemListDivRight;
    container.html("");

    const itemNames = Object.keys(items).sort();

    itemNames.forEach((itemName) => {
        const entry = items[itemName] || { amount: 0 };
        const isSelected = itemName === selectedItem;

        // Item row
        const itemRow = createDiv().parent(container);
        itemRow.class("swap-inv-item-row");
        itemRow.attribute("data-item", itemName);
        if (isSelected) itemRow.class("selected");
        itemRow.mousePressed(() => onSelect(itemName));

        // Image
        const imgDiv = createDiv().parent(itemRow);
        imgDiv.class("swap-inv-item-image");
        
        const imgUrl = resolveItemImgURL(itemName, entry);
        if (imgUrl) {
            let img = createImg(imgUrl, itemName);
            img.class("swap-inv-img");
            img.parent(imgDiv);
        } else {
            let placeholder = createDiv("📦").parent(imgDiv);
            placeholder.class("swap-inv-placeholder");
        }

        // Name and amount
        const infoDiv = createDiv().parent(itemRow);
        infoDiv.class("swap-inv-item-info");

        let nameP = createP((isSelected ? "→ " : "") + itemName).parent(infoDiv);
        nameP.class("swap-inv-item-name");
        try {
            if (typeof window !== 'undefined' && typeof window.getItemRarityCSSByName === 'function') {
                nameP.style("color", window.getItemRarityCSSByName(itemName));
            }
        } catch (e) {}

        let amountP = createP("×" + (entry.amount || 0)).parent(infoDiv);
        amountP.class("swap-inv-item-amount");
    });

    if (itemNames.length === 0) {
        let empty = createP("(empty)").parent(container);
        empty.class("swap-inv-empty");
    }
}

/**
 * Update the center panel showing selected item details
 * @param {string} itemName - Item name
 * @param {Object} itemEntry - Item data
 */
function updateSwapItemDetails(itemName, itemEntry) {
    // Get the inner content div (created in defineSwapInvUI)
    let contentDiv = document.getElementById("swap-item-content-inner");
    if (!contentDiv) return; // If the inner div doesn't exist, bail
    
    // Create a p5.js wrapper around the existing element
    let contentP5 = select("#swap-item-content-inner");
    contentP5.html("");

    if (!itemName || !itemEntry) {
        let noSel = createP("No Item Selected").parent(contentP5);
        noSel.class("swap-inv-empty");
        return;
    }

    // Item image (larger)
    let imgDiv = createDiv().parent(contentP5);
    imgDiv.class("swap-inv-detail-image");

    const imgUrl = resolveItemImgURL(itemName, itemEntry);
    if (imgUrl) {
        let img = createImg(imgUrl, itemName);
        img.class("swap-inv-detail-img");
        img.parent(imgDiv);
    } else {
        let placeholder = createDiv("📦").parent(imgDiv);
        placeholder.class("swap-inv-detail-placeholder");
    }

    // Item info
    let nameP = createP(itemName).parent(contentP5);
    nameP.class("swap-inv-detail-name");
    try {
        if (typeof window !== 'undefined' && typeof window.getItemRarityCSSByName === 'function') {
            nameP.style("color", window.getItemRarityCSSByName(itemName));
        }
    } catch (e) {}

    let amountP = createP("Amount: " + (itemEntry.amount || 0)).parent(contentP5);
    amountP.class("swap-inv-detail-amount");

    // Item description from dictionary
    const itemDesc = itemDic?.[itemName]?.desc || "No description";
    let descP = createP(itemDesc).parent(contentP5);
    descP.class("swap-inv-detail-desc");
}

/**
 * Quick update of highlighting without full DOM rebuild
 * @param {string} leftSelected - Selected item on left
 * @param {string} rightSelected - Selected item on right
 */
function fastHighlightSwapLists(leftSelected, rightSelected) {
    if (itemListDivLeft?.elt?.children) {
        for (let row of itemListDivLeft.elt.children) {
            const itemName = row.getAttribute("data-item");
            if (itemName === leftSelected) {
                row.classList.add("selected");
            } else {
                row.classList.remove("selected");
            }
        }
    }

    if (itemListDivRight?.elt?.children) {
        for (let row of itemListDivRight.elt.children) {
            const itemName = row.getAttribute("data-item");
            if (itemName === rightSelected) {
                row.classList.add("selected");
            } else {
                row.classList.remove("selected");
            }
        }
    }
}

/**
 * Simple hash function for object comparison
 * Used to detect if inventory data actually changed
 * @param {Object} obj - Object to hash
 * @returns {string} Simple hash
 */
function hashObject(obj) {
    if (!obj || typeof obj !== 'object') return JSON.stringify(obj);
    
    const keys = Object.keys(obj).sort();
    let hash = '';
    
    for (let key of keys) {
        const item = obj[key];
        hash += key + ':' + (item?.amount || 0) + '|';
    }
    
    return hash;
}

/**
 * Update the center panel showing selected item details
 * Moved from ui.js for consolidation
 */
function updatecurSwapItemDiv(otherInv) {
    if (!curPlayer || !curPlayer.invBlock) return;

    const normalizedOther = hydrateBagItemImages(otherInv);
    const safeOther = normalizedOther || { items: {}, curItem: "" };

    let curSwapItem;
    const myCur = curPlayer.invBlock.curItem || "";
    const theirCur = safeOther.curItem || "";

    if (myCur !== "") {
        curSwapItem = (curPlayer.invBlock.items || {})[myCur];
        if (curSwapItem && !curSwapItem.itemName) curSwapItem.itemName = myCur;
    } else if (theirCur !== "") {
        curSwapItem = (safeOther.items || {})[theirCur];
        if (curSwapItem && !curSwapItem.itemName) curSwapItem.itemName = theirCur;
    }

    // Clear the div every time
    curSwapItemDiv.html("");

    if (!curSwapItem) {
        // Show a clean "None Selected" state
        const noneDiv = createDiv("No item selected");
        noneDiv.style("width", "100%");
        noneDiv.style("padding", "24px");
        noneDiv.style("color", "#aaa");
        noneDiv.style("text-align", "center");
        noneDiv.style("font-size", "22px");
        noneDiv.parent(curSwapItemDiv);
        
        // Re-add Take All button
        let takeAllButton = createButton("⬅ Take All").parent(curSwapItemDiv);
        applyStyle(takeAllButton, {
            padding: "10px 15px",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            marginTop: "20px",
            width: "90%"
        });
        takeAllButton.mousePressed(() => {
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
            updateSwapItemLists(otherInv);
            if (curPlayer.otherInv.pos) {
                const chunkPos = testMap.globalToChunk(curPlayer.otherInv.pos.x, curPlayer.otherInv.pos.y);
                socket.emit("update_inv", {
                    cx: chunkPos.x, cy: chunkPos.y,
                    objName: curPlayer.otherInv.objName,
                    pos: { x: curPlayer.otherInv.pos.x, y: curPlayer.otherInv.pos.y },
                    z: curPlayer.otherInv.z,
                    invId: otherInv.invId,
                    items: otherInv.items
                });
            }
        });
        return;
    }

    // ---- Item card (image + name/desc) ----
    const itemCardDiv = createDiv();
    itemCardDiv.style("width", "100%");
    itemCardDiv.style("height", "30%");
    itemCardDiv.style("display", "flex");
    itemCardDiv.style("margin-bottom", "20px");
    itemCardDiv.parent(curSwapItemDiv);

    const itemImgDiv = createDiv();
    itemImgDiv.style("width", "50%");
    itemImgDiv.style("border", "2px solid black");
    itemImgDiv.style("border-radius", "10px");
    const bgURL = resolveItemImgURL(curSwapItem.itemName, curSwapItem);
    if (bgURL) {
        itemImgDiv.style("background-image", "url('" + bgURL + "')");
        itemImgDiv.style("image-rendering", "pixelated");
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
    itemImgDiv.parent(itemCardDiv);

    const itemNameDescDiv = createDiv();
    itemNameDescDiv.style("width", "calc(50% - 8px)");
    itemNameDescDiv.style("height", "100%");
    itemNameDescDiv.parent(itemCardDiv);

    const itemNameDiv = createDiv();
    itemNameDiv.style("width", "100%");
    itemNameDiv.style("height", "20%");
    itemNameDiv.style("border", "2px solid black");
    itemNameDiv.style("border-radius", "10px");
    itemNameDiv.parent(itemNameDescDiv);

    const itemNameP = createP(String(curSwapItem.itemName || "Unknown Item"));
    itemNameP.style("font-size", "20px");
    itemNameP.style("color", rarityColorCSS(curSwapItem.itemName));
    itemNameP.style("margin", "5px");
    itemNameP.style("padding", "0");
    itemNameP.style("word-wrap", "break-word");
    itemNameP.style("overflow-wrap", "break-word");
    itemNameP.style("white-space", "normal");
    itemNameP.parent(itemNameDiv);

    // Description
    const itemDescDiv = createDiv();
    itemDescDiv.style("width", "100%");
    itemDescDiv.style("height", "calc(80% - 5px)");
    itemDescDiv.style("border", "2px solid black");
    itemDescDiv.style("border-radius", "10px");
    itemDescDiv.parent(itemNameDescDiv);

    const itemDescP = createP(String(curSwapItem.desc || "No description."));
    itemDescP.style("font-size", "20px");
    itemDescP.style("color", "white");
    itemDescP.style("margin", "5px");
    itemDescP.parent(itemDescDiv);

    // ---- Stats area ----
    const itemStatsDiv = createDiv();
    itemStatsDiv.style("width", "100%");
    itemStatsDiv.style("height", "calc(70% - 10px)");
    itemStatsDiv.parent(curSwapItemDiv);

    // Durability (only when applicable)
    if (curSwapItem.type !== "Simple" && typeof curSwapItem.durability === "number" && typeof curSwapItem.maxDurability === "number" && curSwapItem.maxDurability > 0) {
        const durabilityDiv = createDiv();
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

        const durabilityText = createP("Durability:");
        durabilityText.style("font-size", "20px");
        durabilityText.style("color", "white");
        durabilityText.parent(durabilityDiv);

        const durabilityBar = createDiv();
        durabilityBar.style("width", "80%");
        durabilityBar.style("height", "20px");
        durabilityBar.style("background-color", "red");
        durabilityBar.style("border", "2px solid black");
        durabilityBar.style("border-radius", "10px");
        durabilityBar.parent(durabilityDiv);

        const pct = Math.max(0, Math.min(1, curSwapItem.durability / curSwapItem.maxDurability)) * 100;
        const durabilityFill = createDiv();
        durabilityFill.style("width", pct + "%");
        durabilityFill.style("height", "100%");
        durabilityFill.style("background-color", "green");
        durabilityFill.style("border-radius", "10px");
        durabilityFill.parent(durabilityBar);
    }

    const statsText = createDiv("Stats");
    statsText.style("font-size", "20px");
    statsText.style("color", "white");
    statsText.style("text-align", "center");
    statsText.style("border", "2px solid black");
    statsText.style("border-radius", "10px");
    statsText.style("padding", "10px");
    statsText.style("margin-bottom", "5px");
    statsText.parent(itemStatsDiv);

    const statsList = createDiv();
    statsList.style("width", "100%");
    statsList.style("height", "calc(90% - 10px)");
    statsList.style("overflow-y", "auto");
    statsList.parent(itemStatsDiv);

    // Safely fetch stats
    let stats;
    if (myCur !== "" && typeof curPlayer.invBlock.getItemStats === "function") {
        stats = curPlayer.invBlock.getItemStats(curSwapItem.itemName || myCur);
    } else if (theirCur !== "" && typeof safeOther.getItemStats === "function") {
        stats = safeOther.getItemStats(curSwapItem.itemName || theirCur);
    }

    if (Array.isArray(stats)) {
        stats.forEach(stat => {
            if (!Array.isArray(stat) || stat.length < 2) return;
            if (stat[0] === "Durability") return;

            const statDiv = createDiv();
            statDiv.style("width", "100%");
            statDiv.style("height", "20px");
            statDiv.style("display", "flex");
            statDiv.style("margin-bottom", "12px");
            statDiv.parent(statsList);

            const statNameDiv = createDiv(String(stat[0]) + ":");
            statNameDiv.style("width", "50%");
            statNameDiv.style("height", "100%");
            statNameDiv.style("color", "white");
            statNameDiv.style("text-align", "center");
            statNameDiv.style("font-size", "20px");
            statNameDiv.style("border", "2px solid black");
            statNameDiv.style("border-radius", "10px");
            statNameDiv.style("padding", "5px");
            statNameDiv.parent(statDiv);

            const statNumDiv = createDiv(String(stat[1]));
            statNumDiv.style("width", "50%");
            statNumDiv.style("height", "100%");
            statNumDiv.style("color", "white");
            statNumDiv.style("text-align", "center");
            statNumDiv.style("font-size", "20px");
            statNumDiv.style("border", "2px solid black");
            statNumDiv.style("border-radius", "10px");
            statNumDiv.style("padding", "5px");
            statNumDiv.parent(statDiv);
        });
    }

    if (typeof updateSpaceBarDiv === "function") {
        updateSpaceBarDiv();
    }
}
