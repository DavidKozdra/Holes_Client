/**
 * Swap Inventory UI Module
 * Modern, reactive inventory swapping interface
 * Handles: player inventory ↔ chest/bag/other inventory
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Uses CSS classes instead of inline styles
 * - Partial DOM updates instead of full rebuilds
 * - fastHighlightSwapLists() for smart selection updates
 * - Batches DOM operations for minimal reflows
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
    swapInvDiv.id("swap-inventory");
    swapInvDiv.class("swap-inv-container");
    swapInvDiv.hide();

    // Title bar with three sections
    let titleBar = createDiv().parent(swapInvDiv);
    titleBar.class("swap-inv-titlebar");

    let yourInvTitle = createP("Your Inventory").parent(titleBar);
    yourInvTitle.class("swap-inv-section-title");

    let selectedTitle = createP("Selected Item").parent(titleBar);
    selectedTitle.class("swap-inv-section-title");

    let otherInvTitle = createP("Other Inventory").parent(titleBar);
    otherInvTitle.class("swap-inv-section-title");

    // Close button in title bar
    let closeButton = createImg("images/ui/x.png", "").parent(titleBar);
    closeButton.class("swap-inv-close-btn");
    closeButton.addClass("icon-btn");
    closeButton.style("width", "20px");
    closeButton.style("height", "20px");
    closeButton.style("cursor", "pointer");
    closeButton.style("image-rendering", "pixelated");
    closeButton.mousePressed(closeSwapInventory);

    // Main content area: three columns
    let contentArea = createDiv().parent(swapInvDiv);
    contentArea.class("swap-inv-content");

    // Left column - player inventory
    itemListDivLeft = createDiv().parent(contentArea);
    itemListDivLeft.class("swap-inv-column");
    itemListDivLeft.id("swap-inv-left");

    // Middle column - selected item details
    curSwapItemDiv = createDiv().parent(contentArea);
    curSwapItemDiv.class("swap-inv-column swap-inv-middle");
    curSwapItemDiv.id("swap-inv-selected");

    let noSelection = createP("No Item Selected").parent(curSwapItemDiv);
    noSelection.class("swap-inv-empty");

    // Right column - other inventory
    itemListDivRight = createDiv().parent(contentArea);
    itemListDivRight.class("swap-inv-column");
    itemListDivRight.id("swap-inv-right");
}

/**
 * Close the swap inventory UI and sync changes to server
 */
function closeSwapInventory() {
    // Sync other inventory back to server
    if (curPlayer.otherInv && curPlayer.otherInv.pos) {
        const chunkPos = testMap.globalToChunk(curPlayer.otherInv.pos.x, curPlayer.otherInv.pos.y);
        socket.emit("update_inv", {
            cx: chunkPos.x,
            cy: chunkPos.y,
            objName: curPlayer.otherInv.objName,
            pos: { x: curPlayer.otherInv.pos.x, y: curPlayer.otherInv.pos.y },
            z: curPlayer.otherInv.z,
            invId: curPlayer.otherInv.invBlock?.invId,
            items: curPlayer.otherInv.invBlock.items
        });
    }
    gameState = "playing";
    curPlayer.invBlock.useTimer = 10;
    swapInvDiv.hide();
    spaceBarDiv.hide();
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
    curSwapItemDiv.html("");

    if (!itemName || !itemEntry) {
        let noSel = createP("No Item Selected").parent(curSwapItemDiv);
        noSel.class("swap-inv-empty");
        return;
    }

    // Item image (larger)
    let imgDiv = createDiv().parent(curSwapItemDiv);
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
    let nameP = createP(itemName).parent(curSwapItemDiv);
    nameP.class("swap-inv-detail-name");

    let amountP = createP("Amount: " + (itemEntry.amount || 0)).parent(curSwapItemDiv);
    amountP.class("swap-inv-detail-amount");

    // Item description from dictionary
    const itemDesc = itemDic?.[itemName]?.desc || "No description";
    let descP = createP(itemDesc).parent(curSwapItemDiv);
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
