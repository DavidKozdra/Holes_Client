// Listen for movesSlots from server and store for use in ensureMoveSlots
if (typeof socket !== 'undefined') {
    socket.on('receive_my_items', function(data) {
        console.log('[CLIENT] receive_my_items:', data);
        // Only replace default moves if this is a returning user
        if (data.hasOldItems && Array.isArray(data.movesSlots)) {
            window.serverMovesSlots = data.movesSlots.slice();
            console.log('[CLIENT] Moves set received from server:', window.serverMovesSlots);
        } else {
            window.serverMovesSlots = null;
            console.log('[CLIENT] No moves set received, using defaults.');
        }
    });

}
// Main menu globals moved to mainMenu.js
// This file focuses on in-game UI only

// Lightweight perf toggle; enable with `window.__perfLog = true`



let timerDiv;

function setupUI() {
    // ----------------------------
    // Setup in-game UI elements only
    // ----------------------------

    defineSpaceBarUI();
    defineInvUI();
    definePauseUI();
    defineBuildUI();
    togglePlayerStatusTable();
    defineTeamPickUI();
    defineSwapInvUI();
    defineCraftingUI();
    defineDeathUI();
    defineTutorialUI();
    defineKeyBindingUI();
    defineSignUI();
    defineStatsPanel();
    defineRacePortrait();

    // Create player name button once
    nameBtn = createButton("");
    nameBtn.id('playerNameBtn');
    nameBtn.style('background', 'none');
    nameBtn.style('border', 'none');
    nameBtn.style('padding', '0');
    nameBtn.style('font-size', '20px');
    nameBtn.style('cursor', 'pointer');
    nameBtn.style('transform', 'translateX(-50%)');
    nameBtn.mousePressed(() => {
        gameState = "team_select";
        teamPickDiv.show();
    });
    nameBtn.hide(); // Hide initially until game starts

    timerDiv = createDiv("⏳ 15:00");
    timerDiv.position(width / 2 - 250, 10); // adjust as needed
    timerDiv.style("font-size", "32px");
    timerDiv.style("color", "white");
    timerDiv.style("text-align", "center");
    timerDiv.style("width", "100px");
    timerDiv.style("background-color", "black");
    timerDiv.style("z-index", "10");
    timerDiv.hide();

    // Setup race selection UI from mainMenu
    setupRaceSelectionUI();
    deathDiv.hide();
}

window.setupUI = setupUI;

// Show invite player UI - displays list of players not in a team
function showInvitePlayerUI() {
    // Create modal overlay
    let modalOverlay = createDiv();
    modalOverlay.id('invite-modal-overlay');
    modalOverlay.style('position', 'fixed');
    modalOverlay.style('top', '0');
    modalOverlay.style('left', '0');
    modalOverlay.style('width', '100%');
    modalOverlay.style('height', '100%');
    modalOverlay.style('background', 'rgba(0, 0, 0, 0.5)');
    modalOverlay.style('display', 'flex');
    modalOverlay.style('justify-content', 'center');
    modalOverlay.style('align-items', 'center');
    modalOverlay.style('z-index', '1000');
    
    // Modal content
    let modal = createDiv();
    modal.style('background', '#333');
    modal.style('padding', '30px');
    modal.style('border-radius', '10px');
    modal.style('border', '2px solid #4CAF50');
    modal.style('max-height', '500px');
    modal.style('overflow-y', 'auto');
    modal.style('min-width', '400px');
    modal.parent(modalOverlay);
    
    // Title
    let title = createP('Invite Player');
    title.style('font-size', '20px');
    title.style('font-weight', 'bold');
    title.style('margin-bottom', '20px');
    title.parent(modal);
    
    // Get list of players not in a team
    let availablePlayers = [];
    for (let id in players) {
        let player = players[id];
        if (player && !player.teamId && player.name !== curPlayer.name) {
            availablePlayers.push(player.name);
        }
    }
    
    if (availablePlayers.length === 0) {
        let noPlayersMsg = createP('No available players to invite');
        noPlayersMsg.style('color', '#888');
        noPlayersMsg.parent(modal);
    } else {
        // List of players with invite buttons
        for (let playerName of availablePlayers) {
            let playerContainer = createDiv();
            playerContainer.style('display', 'flex');
            playerContainer.style('justify-content', 'space-between');
            playerContainer.style('align-items', 'center');
            playerContainer.style('padding', '10px');
            playerContainer.style('margin', '5px 0');
            playerContainer.style('background', '#444');
            playerContainer.style('border-radius', '5px');
            playerContainer.parent(modal);
            
            let nameText = createSpan(playerName);
            nameText.style('color', '#fff');
            nameText.style('flex', '1');
            nameText.parent(playerContainer);
            
            let inviteBtn = createButton('Invite');
            inviteBtn.style('padding', '5px 15px');
            inviteBtn.style('background', '#4CAF50');
            inviteBtn.style('color', 'white');
            inviteBtn.style('border', 'none');
            inviteBtn.style('border-radius', '3px');
            inviteBtn.style('cursor', 'pointer');
            inviteBtn.mousePressed(() => {
                socket.emit('invite_player', {
                    teamId: curPlayer.teamId,
                    invitedPlayerName: playerName
                });
                // Close modal
                modalOverlay.remove();
                alert(`Invitation sent to ${playerName}`);
            });
            inviteBtn.parent(playerContainer);
        }
    }
    
    // Close button
    let closeBtn = createButton('Close');
    closeBtn.style('width', '100%');
    closeBtn.style('padding', '10px');
    closeBtn.style('margin-top', '15px');
    closeBtn.style('background', '#f44336');
    closeBtn.style('color', 'white');
    closeBtn.style('border', 'none');
    closeBtn.style('border-radius', '5px');
    closeBtn.style('cursor', 'pointer');
    closeBtn.mousePressed(() => {
        modalOverlay.remove();
    });
    closeBtn.parent(modal);
    
    // Close on overlay click
    modalOverlay.mousePressed(() => {
        modalOverlay.remove();
    });
    modal.mousePressed((e) => {
        e.stopPropagation();
    });
}

// Show invite prompt - called when player receives an invite
function showTeamInvitePrompt(teamName, inviterName, teamId) {
    // Create modal overlay
    let modalOverlay = createDiv();
    modalOverlay.id('invite-prompt-overlay');
    modalOverlay.style('position', 'fixed');
    modalOverlay.style('top', '0');
    modalOverlay.style('left', '0');
    modalOverlay.style('width', '100%');
    modalOverlay.style('height', '100%');
    modalOverlay.style('background', 'rgba(0, 0, 0, 0.7)');
    modalOverlay.style('display', 'flex');
    modalOverlay.style('justify-content', 'center');
    modalOverlay.style('align-items', 'center');
    modalOverlay.style('z-index', '1000');
    
    // Modal content
    let modal = createDiv();
    modal.style('background', '#333');
    modal.style('padding', '30px');
    modal.style('border-radius', '10px');
    modal.style('border', '2px solid #2196F3');
    modal.style('text-align', 'center');
    modal.style('min-width', '350px');
    modal.parent(modalOverlay);
    
    // Title
    let title = createP('Team Invitation');
    title.style('font-size', '20px');
    title.style('font-weight', 'bold');
    title.style('color', '#2196F3');
    title.style('margin-bottom', '15px');
    title.parent(modal);
    
    // Message
    let message = createP(`${inviterName} has invited you to join the team "${teamName}"`);
    message.style('font-size', '16px');
    message.style('margin-bottom', '20px');
    message.parent(modal);
    
    // Button container
    let buttonContainer = createDiv();
    buttonContainer.style('display', 'flex');
    buttonContainer.style('gap', '10px');
    buttonContainer.style('justify-content', 'center');
    buttonContainer.parent(modal);
    
    // Accept button
    let acceptBtn = createButton('Accept');
    acceptBtn.style('padding', '10px 30px');
    acceptBtn.style('background', '#4CAF50');
    acceptBtn.style('color', 'white');
    acceptBtn.style('border', 'none');
    acceptBtn.style('border-radius', '5px');
    acceptBtn.style('cursor', 'pointer');
    acceptBtn.style('font-size', '16px');
    acceptBtn.mousePressed(() => {
        socket.emit('accept_invite', {
            teamId: teamId
        });
        modalOverlay.remove();
    });
    acceptBtn.parent(buttonContainer);
    
    // Decline button
    let declineBtn = createButton('Decline');
    declineBtn.style('padding', '10px 30px');
    declineBtn.style('background', '#f44336');
    declineBtn.style('color', 'white');
    declineBtn.style('border', 'none');
    declineBtn.style('border-radius', '5px');
    declineBtn.style('cursor', 'pointer');
    declineBtn.style('font-size', '16px');
    declineBtn.mousePressed(() => {
        socket.emit('decline_invite', {
            teamId: teamId
        });
        modalOverlay.remove();
    });
    declineBtn.parent(buttonContainer);
}

var spaceBarDiv;
function defineSpaceBarUI() {
    // Spacebar Hotkey Div
    spaceBarDiv = createDiv("");
    spaceBarDiv.class("spacebar-hotkey");
    spaceBarDiv.html("Hotkey: Space");

    spaceBarDiv.mousePressed(() => {
        if (gameState == "inventory") {
            curPlayer.invBlock.hotbarItem(curPlayer.invBlock.curItem, curPlayer.invBlock.selectedHotBar);
        }
        else if (gameState == "swap_inv") {
            if (keyIsDown(16)) {
                if (curPlayer.invBlock.curItem != "") {
                    curPlayer.otherInv.invBlock.addItem(curPlayer.invBlock.curItem, curPlayer.invBlock.items[curPlayer.invBlock.curItem].amount, false);
                    curPlayer.invBlock.decreaseAmount(curPlayer.invBlock.curItem, curPlayer.invBlock.items[curPlayer.invBlock.curItem].amount);

                    curPlayer.otherInv.invBlock.curItem = curPlayer.invBlock.curItem;
                    curPlayer.invBlock.curItem = "";
                }
                else if (curPlayer.otherInv.invBlock.curItem != "") {
                    curPlayer.invBlock.addItem(curPlayer.otherInv.invBlock.curItem, curPlayer.otherInv.invBlock.items[curPlayer.otherInv.invBlock.curItem].amount, true);
                    curPlayer.otherInv.invBlock.decreaseAmount(curPlayer.otherInv.invBlock.curItem, curPlayer.otherInv.invBlock.items[curPlayer.otherInv.invBlock.curItem].amount);

                    curPlayer.invBlock.curItem = curPlayer.otherInv.invBlock.curItem;
                    curPlayer.otherInv.invBlock.curItem = "";
                }
            }
            else {
                if (curPlayer.invBlock.curItem != "") {
                    //console.log(curPlayer.otherInv);
                    curPlayer.otherInv.invBlock.addItem(curPlayer.invBlock.curItem, 1, false);
                    curPlayer.invBlock.decreaseAmount(curPlayer.invBlock.curItem, 1);

                    if (curPlayer.invBlock.items[curPlayer.invBlock.curItem] == undefined) {
                        curPlayer.otherInv.invBlock.curItem = curPlayer.invBlock.curItem;
                        curPlayer.invBlock.curItem = "";
                    }
                }
                else if (curPlayer.otherInv.invBlock.curItem != "") {
                    curPlayer.invBlock.addItem(curPlayer.otherInv.invBlock.curItem, 1, true);
                    curPlayer.otherInv.invBlock.decreaseAmount(curPlayer.otherInv.invBlock.curItem, 1);

                    if (curPlayer.otherInv.invBlock.items[curPlayer.otherInv.invBlock.curItem] == undefined) {
                        curPlayer.invBlock.curItem = curPlayer.otherInv.invBlock.curItem;
                        curPlayer.otherInv.invBlock.curItem = "";
                    }
                }
            }
            // Force full rebuild so amounts refresh
            swapListCache.lastLeftHash = "";
            swapListCache.lastRightHash = "";
            fastHighlightSwapLists(curPlayer.invBlock.curItem, curPlayer.otherInv.invBlock.curItem);
            updateSwapItemLists(curPlayer.otherInv.invBlock);
            _syncOtherInv();
            _syncPlayerInv();
        }
    });

    spaceBarDiv.hide();
}

function updateSpaceBarDiv() {
    if (curPlayer == undefined) return;

    if (gameState == "inventory") {
        if (curPlayer.invBlock.curItem == "") return;
        if (itemDic[curPlayer.invBlock.curItem].type == "Simple") {
            spaceBarDiv.hide();
        }
        else {
            spaceBarDiv.show();
            spaceBarDiv.style("bottom", "14%");
            let msg = "";
            if (curPlayer.invBlock.curItem == curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]) {
                msg = "(SpaceBar) - remove from hotbar";
            }
            else {
                msg = "(SpaceBar) - put in hotbar";
            }
            spaceBarDiv.html(msg);
        }
    }
    else if (gameState == "swap_inv") {
        spaceBarDiv.show();
        spaceBarDiv.style("bottom", "9%");
        let msg = "";
        if (keyIsDown(16)) {
            if (curPlayer.invBlock.curItem != "") {
                msg = "(SpaceBar) - move all to other inv";
            }
            else if (curPlayer.otherInv.invBlock.curItem != "") {
                msg = "(SpaceBar) - move all to your inv";
            }
        }
        else {
            if (curPlayer.invBlock.curItem != "") {
                msg = "(SpaceBar) - move to other inv";
            }
            else if (curPlayer.otherInv.invBlock.curItem != "") {
                msg = "(SpaceBar) - move to your inv";
            }
        }
        spaceBarDiv.html(msg);
    }
}

var invDiv;
var itemListDiv;
var curItemDiv;
var allTag;
var toolsTag;
var weaponsTag;
var equipmentTag;
var consumablesTag;
var racePortraitDiv;
var statsPanel;
var viewingPlayerProfile;
var nameBtn;

// Moves editor globals
var movesEditorDiv;
var movesSlotList;
var movesAllList;
var selectedMoveSlotIdx = 0;

function defineInvUI() {
    // Main inventory container
    invDiv = createDiv();
    invDiv.id("inventory");
    invDiv.class("container");
    // Bring swapInvDiv above other elements
    invDiv.style("z-index", "50");
    // Minimal inline styles – rely on CSS for the main visuals
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
        invDiv.hide();
        spaceBarDiv.hide();
    });
    craftingTitle.style("cursor", "pointer");

    // Moves tab
    let movesTitle = createP("Moves").parent(topBar);
    movesTitle.class("inventory-title");
    movesTitle.style("cursor", "pointer");
    movesTitle.mousePressed(() => {
        invDiv.hide();
        spaceBarDiv.hide();
        showMovesEditor();
    });

    let tagBar = createDiv().parent(invDiv);
    tagBar.class("tag-bar");

    const categories = ["All", "Tools/Seeds", "Weapons", "Equipment", "Consumables"];
    let categoryButtons = {};

    categories.forEach((category) => {
        let button = createButton(category).parent(tagBar);
        button.class("tag-button");
        // If you want minimal inline styles:
        // applyStyle(button, { width: "120px" });

        button.mousePressed(() => {
            curPlayer.invBlock.curTag = category;
            updateItemList();

            // Highlight the selected button
            Object.values(categoryButtons).forEach((btn) => {
                btn.removeClass("selected");
            });
            button.addClass("selected");
        });

        categoryButtons[category] = button;
    });

    // Default selection highlight
    categoryButtons["All"].addClass("selected");

    // Bottom area (item list + details)
    let bottomDiv = createDiv().parent(invDiv);
    bottomDiv.class("bottom-area");

    // Item list
    itemListDiv = createDiv().parent(bottomDiv);
    itemListDiv.class("item-list");

    // Current item details
    curItemDiv = createDiv().parent(bottomDiv);
    curItemDiv.class("item-details");

    // Close Button (image X)
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
        invDiv.hide(); // Hides the inventory when clicked
        spaceBarDiv.hide();
    });

    // Finally, populate items
    updateItemList();
    updatecurItemDiv();
}

// Ensure movesSlots exists and has 10 entries
function ensureMoveSlots() {
    if (!curPlayer) return;
    // If movesSlots is provided by server, use it
    if (!Array.isArray(curPlayer.movesSlots) || curPlayer.movesSlots.length === 0) {
        if (window.serverMovesSlots && Array.isArray(window.serverMovesSlots)) {
            curPlayer.movesSlots = window.serverMovesSlots.slice();
        } else {
            curPlayer.movesSlots = ['forceField', 'combustion', 'meditate', 'dash', null, null, null, null, null, null];
        }
    }
    while (curPlayer.movesSlots.length < 10) curPlayer.movesSlots.push(null);
}


// Safe helpers for item images in inventory UI
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

// Get CSS color string for an item's rarity (uses centralized helper from items.js)
function rarityColorCSS(itemName){
    try{
        // Prefer centralized global helper when available
        if (typeof window !== 'undefined' && typeof window.getItemRarityCSSByName === 'function') {
            const color = window.getItemRarityCSSByName(itemName);
            return color;
        }
        // Fallback to local lookup if global not ready
        if (itemDic && itemDic[itemName]) {
            const rarity = itemDic[itemName].rarity || 'white';
            if (typeof RARITY_RGB !== 'undefined' && RARITY_RGB[rarity]) {
                const rgb = RARITY_RGB[rarity];
                return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            }
        }
        // Default white
        return 'rgb(235,235,235)';
    }catch(e){
        console.warn(`[rarityColorCSS] Error for item "${itemName}":`, e);
        return 'rgb(235,235,235)';
    }
}

// Batch highlight updates for inventory item list
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
    // Use rAF to coalesce style writes
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply); else apply();
}

// Batch highlight updates for crafting list
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
    // Reset container

    itemListDiv.html("");

    // Build filtered item name list by current tag
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
        itemDiv.style("height", ROW_H+"px");
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
        itemInfoDiv.style("height", ROW_H+"px");
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

    //clear the div (timed when perfLog is on)
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
    };


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

    itemImgDiv.src = "";
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

    // fastHighlightSwapLists lives in ui/inventoryUI.js; remove duplicate definitions here to avoid overrides.
}

// Render build UI container
var buildDiv;


//   var buildOptions = [
//     { type: "Wall", key: 49, params: { color: curPlayer.color } },
//     { type: "Floor", key: 50, params: { color: curPlayer.color } },
//     { type: "Door", key: 51, params: { color: curPlayer.color } },
//     { type: "Rug", key: 52, params: { color: curPlayer.color } },
//     { type: "Mug", key: 53, params: { color: curPlayer.color } },
//     { type: "BearTrap", key: 54, params: { color: curPlayer.color } },
//     { type: "Turret", key: 55, params: { obj: curPlayer.obj } },
//     { type: "PlacedBomb", key: 56, params: { obj: curPlayer.obj } },
//   ];

// 1) Set up the container DIV
function defineBuildUI() {
    buildDiv = createDiv();
    buildDiv.id('buildOptionsDiv');
    buildDiv.class("build-ui-container");
    buildDiv.style("position", "absolute");
    buildDiv.style("bottom", "28%");
    buildDiv.style("left", "90%");
    buildDiv.style("transform", "translate(-50%, -50%)");
    buildDiv.style("display", "none");
    buildDiv.style("min-width", "200px");
    buildDiv.style("max-width", "280px");
    buildDiv.style("background", "linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(34, 34, 34, 0.98) 100%)");
    buildDiv.style("border", "2px solid #5a3a1a");
    buildDiv.style("border-radius", "12px");
    buildDiv.style("padding", "16px");
    buildDiv.style("box-shadow", "0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset");
    buildDiv.style("font-family", "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");
    buildDiv.style("backdrop-filter", "blur(8px)");
    buildDiv.style("overflow-y", "auto");
    buildDiv.style("max-height", "60vh");
}

function renderDirtBagUI() {
    // Dynamic UI scale based on screen size
    const uiScale = typeof isMobileDevice !== 'undefined' && isMobileDevice ? Math.min(width, height) / 1080 : 1;
    const bagW = 180 * uiScale;
    const bagH = 186 * uiScale;
    const bagMargin = 10 * uiScale;

    // Dirt Inventory
    push();

    if (dirtBagUI.shake.length > 0) {
        //dirt bag shake sound
        if (!dirtBagShakeSound.isLooping()) dirtBagShakeSound.loop();
        if (dirtBagUI.vel.mag() < 1) {
            dirtBagUI.vel.x = dirtBagUI.shake.intensity;
        }
        dirtBagUI.vel.setMag(dirtBagUI.vel.mag() + dirtBagUI.shake.intensity);
        if (dirtBagUI.vel.mag() > dirtBagUI.shake.intensity * 5) {
            dirtBagUI.vel.setMag(dirtBagUI.shake.intensity * 5);
        }
        dirtBagUI.vel.rotate(random(45, 180));
        dirtBagUI.shake.length -= 1;
    }
    else {
        //stop dirt bag shake sound
        dirtBagShakeSound.stop();
        dirtBagUI.shake.intensity = 0;
        dirtBagUI.vel.x = ((width - bagW - bagMargin) - dirtBagUI.pos.x);
        dirtBagUI.vel.y = ((height - bagH - bagMargin) - dirtBagUI.pos.y);
        dirtBagUI.vel.setMag(dirtBagUI.vel.mag() / 10);
    }
    dirtBagUI.pos.add(dirtBagUI.vel);

    let dirtBagOpen = true;
    if (buildMode) {
        dirtBagOpen = true;
    }
    else if (curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar] == "") {
        if (dirtInv >= maxDirtInv - curPlayer.statBlock.stats.handDigSpeed) {
            dirtBagOpen = false;
        }
    }
    else {
        // Check if item exists before accessing its properties
        const heldItemName = curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar];
        const heldItem = curPlayer.invBlock.items[heldItemName];
        
        if (heldItem && heldItem.type == "Shovel") {
            if (dirtInv >= maxDirtInv - heldItem.digSpeed) {
                dirtBagOpen = false;
            }
        }
        else if (dirtInv >= maxDirtInv - DIGSPEED) {
            dirtBagOpen = false;
        }
    }

    if (dirtBagOpen) image(dirtBagOpenImg, dirtBagUI.pos.x, dirtBagUI.pos.y, bagW, bagH);
    else image(dirtBagImg, dirtBagUI.pos.x, dirtBagUI.pos.y, bagW, bagH);

    fill("#70443C");
    rect(dirtBagUI.pos.x + 30 * uiScale, dirtBagUI.pos.y + 35 * uiScale + (120 * uiScale * (1 - (dirtInv / maxDirtInv))), 120 * uiScale, 120 * uiScale * (dirtInv / maxDirtInv));

    if (!dirtBagOpen) {
        fill(255);
        stroke(0);
        strokeWeight(5);
        textAlign(CENTER, CENTER);
        textSize(50 * uiScale);
        text("Full", dirtBagUI.pos.x + 90 * uiScale, dirtBagUI.pos.y + 100 * uiScale);
    }
    pop();
}

function renderBuildOptions() {
    buildDiv.html('');

    let option = buildOptions[curPlayer.invBlock.selectedHotBar];
    if (!option) return;

    // Header section
    const headerDiv = createDiv();
    headerDiv.style('padding', '8px 12px');
    headerDiv.style('background', 'rgba(255, 193, 7, 0.12)');
    headerDiv.style('border-radius', '8px');
    headerDiv.style('margin-bottom', '12px');
    headerDiv.style('border-left', '4px solid #ffc107');
    headerDiv.parent(buildDiv);

    // Option name
    const nameDiv = createDiv(`Build: ${option.objName}`);
    nameDiv.style('font-size', '1.1rem');
    nameDiv.style('font-weight', 'bold');
    nameDiv.style('color', '#ffc107');
    nameDiv.style('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.6)');
    nameDiv.style('letter-spacing', '0.3px');
    nameDiv.parent(headerDiv);

    // Cost section label
    const costLabelDiv = createDiv('Required Materials:');
    costLabelDiv.style('font-size', '0.75rem');
    costLabelDiv.style('color', '#999');
    costLabelDiv.style('margin-bottom', '8px');
    costLabelDiv.style('text-transform', 'uppercase');
    costLabelDiv.style('letter-spacing', '0.5px');
    costLabelDiv.style('font-weight', 'bold');
    costLabelDiv.parent(buildDiv);

    // Cost details container
    const costsDetailsDiv = createDiv();
    costsDetailsDiv.style('display', 'flex');
    costsDetailsDiv.style('flex-direction', 'column');
    costsDetailsDiv.style('gap', '6px');
    costsDetailsDiv.parent(buildDiv);

    let canAfford = true;

    option.cost.forEach(([material, requiredAmount]) => {
        let playerHas = 0;
        if (material === "dirt") {
            playerHas = dirtInv;
        } else if (curPlayer.invBlock.items[material]) {
            playerHas = curPlayer.invBlock.items[material].amount;
        }
        
        const enough = playerHas >= requiredAmount;
        if (!enough) canAfford = false;

        // Material row
        const materialRow = createDiv();
        materialRow.style('padding', '8px 10px');
        materialRow.style('background', enough ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 68, 68, 0.15)');
        materialRow.style('border-radius', '6px');
        materialRow.style('border-left', `3px solid ${enough ? '#4caf50' : '#ff4444'}`);
        materialRow.style('display', 'flex');
        materialRow.style('justify-content', 'space-between');
        materialRow.style('align-items', 'center');
        materialRow.style('transition', 'transform 0.15s ease');
        materialRow.parent(costsDetailsDiv);

        // Material name
        const matName = createSpan(material);
        matName.style('color', '#ddd');
        matName.style('font-size', '0.9rem');
        matName.style('font-weight', '500');
        matName.parent(materialRow);

        // Material count
        const countText = createSpan(`${Math.floor(playerHas)} / ${Math.floor(requiredAmount)}`);
        countText.style('color', enough ? '#4caf50' : '#ff4444');
        countText.style('font-weight', 'bold');
        countText.style('font-size', '0.9rem');
        countText.parent(materialRow);
        
    });

    // Result message
    if (!canAfford) {
        const affordMsg = createDiv('⚠ Not enough resources!');
        affordMsg.style('font-size', '0.85rem');
        affordMsg.style('font-weight', 'bold');
        affordMsg.style('margin-top', '12px');
        affordMsg.style('padding', '8px 12px');
        affordMsg.style('background', 'rgba(255, 68, 68, 0.2)');
        affordMsg.style('border-radius', '6px');
        affordMsg.style('color', '#ff4444');
        affordMsg.style('text-align', 'center');
        affordMsg.style('border', '1px solid rgba(255, 68, 68, 0.4)');
        affordMsg.parent(buildDiv);
    } else {
        const readyMsg = createDiv('✓ Ready to build!');
        readyMsg.style('font-size', '0.85rem');
        readyMsg.style('font-weight', 'bold');
        readyMsg.style('margin-top', '12px');
        readyMsg.style('padding', '8px 12px');
        readyMsg.style('background', 'rgba(76, 175, 80, 0.2)');
        readyMsg.style('border-radius', '6px');
        readyMsg.style('color', '#4caf50');
        readyMsg.style('text-align', 'center');
        readyMsg.style('border', '1px solid rgba(76, 175, 80, 0.4)');
        readyMsg.parent(buildDiv);
    }
}


// Helper function to translate key codes to human-friendly strings
function keyCodeToHuman(keyCode) {
    if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 65 && keyCode <= 90)) {
        return String.fromCharCode(keyCode);
    }
    switch (keyCode) {
        case 32:
            return "Space";
        default:
            return keyCode.toString();
    }
}


// Create the race portrait as an HTML element
function defineRacePortrait() {
    racePortraitDiv = createDiv();
    racePortraitDiv.style("position", "fixed");
    racePortraitDiv.id("racePortraitDiv");
    racePortraitDiv.style("top", "7px");
    racePortraitDiv.style("right", "30px");
    racePortraitDiv.style("width", "98px");
    racePortraitDiv.style("height", "98px");
    racePortraitDiv.style("border", "2px solid #868686");
    racePortraitDiv.style("border-radius", "10px");
    racePortraitDiv.style("background-color", "#70443c");
    racePortraitDiv.style("cursor", "pointer");
    racePortraitDiv.style("z-index", "100");
    racePortraitDiv.style("overflow", "hidden");
    racePortraitDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.4)");
    
    // Add hover effect
    racePortraitDiv.mouseOver(() => {
        racePortraitDiv.style("border-color", "#ffff00");
        racePortraitDiv.style("box-shadow", "0 4px 12px rgba(255, 255, 0, 0.5)");
    });
    
    racePortraitDiv.mouseOut(() => {
        racePortraitDiv.style("border-color", "#868686");
        racePortraitDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.4)");
    });
    
    // Click to toggle stats panel
    racePortraitDiv.mousePressed(() => {
        if (statsPanel.style("display") === "none") {
            updateStatsPanel();
            statsPanel.show();
        } else {
            statsPanel.hide();
        }
    });
    
    // Setup health event listener (once)
    if (!window.healthEventListenerSetup) {
        window.addEventListener('playerHealthChange', (event) => {
            if (curPlayer && curPlayer.statBlock) {
                updateHealthDisplay(event.detail.hp, event.detail.mhp);
            }
        });
        window.healthEventListenerSetup = true;
    }
    
    // Setup mana event listener (once)
    if (!window.manaEventListenerSetup) {
        window.addEventListener('playerManaChange', (event) => {
            if (curPlayer && curPlayer.statBlock) {
                updateManaDisplay(event.detail.mp, event.detail.mmp);
            }
        });
        window.manaEventListenerSetup = true;
    }
    
    racePortraitDiv.hide(); // Initially hidden until game starts
}

// Update the race portrait image based on current player
function updateRacePortrait() {
    if (!racePortraitDiv || !curPlayer) return;
    
    let raceName = races[curPlayer.race];
    if (raceImages[raceName] && raceImages[raceName].portrait) {
        // Create an img element with the portrait
        let portraitSrc = raceImages[raceName].portrait.canvas.toDataURL();
        racePortraitDiv.html(`<img src="${portraitSrc}" style="width: 100%; height: 100%; object-fit: cover;">`);
        racePortraitDiv.show();
    }
}

// Create the stats panel
function defineStatsPanel() {
    statsPanel = createDiv();
    statsPanel.id("stats-panel");
    statsPanel.style("position", "fixed");
    statsPanel.style("top", "110px");
    statsPanel.style("right", "30px");
    statsPanel.style("width", "300px");
    statsPanel.style("background", "rgba(34, 34, 34, 0.95)");
    statsPanel.style("border", "2px solid #868686");
    statsPanel.style("border-radius", "10px");
    statsPanel.style("padding", "15px");
    statsPanel.style("z-index", "99");
    statsPanel.style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.6)");
    statsPanel.style("backdrop-filter", "blur(5px)");
    statsPanel.style("color", "#fff");
    statsPanel.style("font-family", "Arial, sans-serif");
    statsPanel.style("display", "none");

    /* ── Mobile HUD strip (always created — CSS hides on desktop) ── */
    _createMobileHUD();
}

/* ─── Mobile HUD ─── */
var _mobileHUD = null;

function _createMobileHUD() {
    if (_mobileHUD) return;

    const hud = document.createElement('div');
    hud.id = 'mobile-hud';
    hud.innerHTML = `
        <div id="mhud-portrait"></div>
        <div id="mhud-bars">
            <div id="mhud-name-row">
                <span id="mhud-name"></span>
                <span id="mhud-level">Lv 1</span>
            </div>
            <div class="mhud-bar-track">
                <div id="mhud-hp-fill" class="mhud-bar-fill mhud-hp"></div>
                <span id="mhud-hp-text" class="mhud-bar-label">HP</span>
            </div>
            <div class="mhud-bar-track">
                <div id="mhud-mp-fill" class="mhud-bar-fill mhud-mp"></div>
                <span id="mhud-mp-text" class="mhud-bar-label">MP</span>
            </div>
            <div id="mhud-xp-row">
                <div id="mhud-xp-fill"></div>
            </div>
        </div>
    `;
    document.body.appendChild(hud);

    // Tap the HUD strip → toggle stats panel
    hud.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
        if (statsPanel && statsPanel.style("display") === "none") {
            updateStatsPanel();
            statsPanel.show();
        } else if (statsPanel) {
            statsPanel.hide();
        }
    });

    _mobileHUD = hud;
}

function updateMobileHUD() {
    if (!_mobileHUD || !curPlayer || !curPlayer.statBlock) {
        if (_mobileHUD) _mobileHUD.style.display = 'none';
        return;
    }
    _mobileHUD.style.display = 'flex';
    const s = curPlayer.statBlock.stats;
    const sb = curPlayer.statBlock;

    // Name + level
    const nameEl = document.getElementById('mhud-name');
    const lvlEl = document.getElementById('mhud-level');
    if (nameEl) nameEl.textContent = curPlayer.name || '';
    if (lvlEl) lvlEl.textContent = 'Lv ' + (sb.level || 1);

    // HP bar
    const maxHp = Math.max(1, s.mhp || 1);
    const hpPct = Math.min(1, Math.max(0, s.hp / maxHp)) * 100;
    const hpFill = document.getElementById('mhud-hp-fill');
    const hpText = document.getElementById('mhud-hp-text');
    if (hpFill) hpFill.style.width = hpPct + '%';
    if (hpText) hpText.textContent = Math.floor(s.hp) + ' / ' + Math.floor(maxHp);

    // HP color shift: green → yellow → red
    if (hpFill) {
        if (hpPct > 50) hpFill.style.background = 'linear-gradient(90deg, #27f50e, #1a9e0a)';
        else if (hpPct > 25) hpFill.style.background = 'linear-gradient(90deg, #f5e60e, #c9a800)';
        else hpFill.style.background = 'linear-gradient(90deg, #f54e0e, #c91800)';
    }

    // MP bar
    const maxMp = Math.max(1, s.mmp || 1);
    const mpPct = Math.min(1, Math.max(0, s.mp / maxMp)) * 100;
    const mpFill = document.getElementById('mhud-mp-fill');
    const mpText = document.getElementById('mhud-mp-text');
    if (mpFill) mpFill.style.width = mpPct + '%';
    if (mpText) mpText.textContent = Math.floor(s.mp) + ' / ' + Math.floor(maxMp);

    // XP bar (thin bar under the others)
    const xpPct = sb.xpNeeded > 0 ? Math.min(1, sb.xp / sb.xpNeeded) * 100 : 0;
    const xpFill = document.getElementById('mhud-xp-fill');
    if (xpFill) xpFill.style.width = xpPct + '%';

    // Portrait (update once, cache)
    const portraitEl = document.getElementById('mhud-portrait');
    if (portraitEl && !portraitEl.dataset.loaded) {
        let raceName = typeof races !== 'undefined' ? races[curPlayer.race] : null;
        if (raceName && raceImages[raceName] && raceImages[raceName].portrait) {
            let src = raceImages[raceName].portrait.canvas.toDataURL();
            portraitEl.style.backgroundImage = `url(${src})`;
            portraitEl.dataset.loaded = '1';
        }
    }

    // Team color on name
    if (nameEl) {
        let dc;
        if (typeof curPlayer.color === 'object' && curPlayer.color !== null && curPlayer.color.r !== undefined) {
            dc = curPlayer.color;
        } else if (curPlayer.teamId && window.allTeams?.[curPlayer.teamId]) {
            dc = window.allTeams[curPlayer.teamId].color;
        } else {
            dc = teamColors[curPlayer.color] || teamColors[0];
        }
        if (dc) nameEl.style.color = `rgb(${dc.r}, ${dc.g}, ${dc.b})`;
    }
}

// Update stats panel content with current player stats
function updateStatsPanel() {
    if (!statsPanel || !curPlayer || !curPlayer.statBlock) return;
    
    let stats = curPlayer.statBlock.stats;
    let raceName = races[curPlayer.race];
    
    let html = `
        <div style="text-align: center; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #ffff00; text-shadow: 2px 2px 4px #000;">${curPlayer.name || "Player"}</h2>
            <p style="margin: 5px 0; color: #aaa; font-size: 14px;">${raceName.charAt(0).toUpperCase() + raceName.slice(1)} - Level ${curPlayer.statBlock.level}</p>
        </div>
        <div style="margin-bottom: 10px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 5px;">
            <div style="margin: 5px 0;">
                <strong style="color: #27f50e;">HP:</strong> <span id="hp-text">${Math.floor(stats.hp)} / ${Math.floor(stats.mhp)}</span>
                <div style="width: 100%; height: 10px; background: #333; border-radius: 5px; margin-top: 3px; overflow: hidden;">
                    <div id="hp-bar" style="width: ${(stats.hp / stats.mhp) * 100}%; height: 100%; background: linear-gradient(90deg, #27f50e, #1a9e0a); transition: width 0.3s;"></div>
                </div>
            </div>
            <div style="margin: 5px 0;">
                <strong style="color: #00d4ff;">MP:</strong> <span id="mp-text">${Math.floor(stats.mp)} / ${Math.floor(stats.mmp)}</span>
                <div style="width: 100%; height: 10px; background: #333; border-radius: 5px; margin-top: 3px; overflow: hidden;">
                    <div id="mp-bar" style="width: ${(stats.mp / stats.mmp) * 100}%; height: 100%; background: linear-gradient(90deg, #00d4ff, #0080cc); transition: width 0.3s;"></div>
                </div>
            </div>
        </div>
        <div style="margin-bottom: 10px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 5px;">
            <div style="margin: 3px 0;"><strong style="color: #ffaa00;">XP:</strong> ${curPlayer.statBlock.xp} / ${curPlayer.statBlock.xpNeeded}</div>
        </div>
        <div style="padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 5px; font-size: 14px;">
            <div style="margin: 3px 0;"><strong style="color: #ff6666;">Attack:</strong> ${stats.attack.toFixed(1)}</div>
            <div style="margin: 3px 0;"><strong style="color: #9966ff;">Magic:</strong> ${stats.magic.toFixed(1)}</div>
            <div style="margin: 3px 0;"><strong style="color: #66ccff;">Magic Resist:</strong> ${stats.magicResistance.toFixed(1)}</div>
            <div style="margin: 3px 0;"><strong style="color: #99ff99;">Health Regen:</strong> ${stats.healthRegen.toFixed(2)}/s</div>
            <div style="margin: 3px 0;"><strong style="color: #ffff66;">Luck:</strong> ${stats.luck}</div>
            <div style="margin: 3px 0;"><strong style="color: #ff9966;">Dig Speed:</strong> ${stats.handDigSpeed.toFixed(2)}</div>
            <div style="margin: 3px 0;"><strong style="color: #66ffcc;">Run Speed:</strong> ${stats.runningSpeed.toFixed(2)}</div>
        </div>
    `;
    
    statsPanel.html(html);
}

// Event-driven health update for stats panel
function updateHealthDisplay(hp, mhp) {
    const hpText = document.getElementById('hp-text');
    const hpBar = document.getElementById('hp-bar');
    
    if (hpText) {
        hpText.textContent = `${Math.floor(hp)} / ${Math.floor(mhp)}`;
    }
    if (hpBar) {
        hpBar.style.width = `${(hp / mhp) * 100}%`;
    }
}

// Event-driven mana update for stats panel
function updateManaDisplay(mp, mmp) {
    const mpText = document.getElementById('mp-text');
    const mpBar = document.getElementById('mp-bar');
    
    if (mpText) {
        mpText.textContent = `${Math.floor(mp)} / ${Math.floor(mmp)}`;
    }
    if (mpBar) {
        mpBar.style.width = `${(mp / mmp) * 100}%`;
    }
}


function renderPlayerCardUI() {
    // ── Mobile: skip the complex canvas card, use DOM HUD instead ──
    const _isMobile = (typeof isMobileDevice !== 'undefined' && isMobileDevice) ||
                      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (_isMobile) {
        updateMobileHUD();
        updateMoveHotbarDOM(curPlayer);
        if (nameBtn) nameBtn.hide();
        return;
    }

    const uiScale = 1;
    const cardW = 510 * uiScale;
    const cardH = 125 * uiScale;
    const cardX = width - cardW - 20 * uiScale;
    push();

    fill(0);
    noStroke();
    rect(width - 530, 0, 510, 125);

    stroke(134);
    strokeWeight(4);
    rect(width - 530 + 6, -20, 510 - 12, 120 + 20 - 6, 10);

    strokeWeight(2);
    line(width - 30 - 115 + 6, 7, width - 30 - 115 + 6, 120 - 6);
    line(width - 530 + 6 + 5, 42, width - 30 - 115 + 6 - 5, 42);

    noStroke();
    fill(134);
    rect(width - 530 + 6 + 79, 52, 295, 21);
    rect(width - 530 + 6 + 79, 83, 295, 21);

    fill(112, 68, 60);
    rect(width - 30 - 115 + 6 + 7, 7, 98, 98);

    fill(0);
    rect(width - 530 + 91, 52, 36, 19);
    rect(width - 530 + 128, 52, 33, 19);
    rect(width - 530 + 163, 52, 34, 19);
    rect(width - 530 + 199, 52, 33, 19);
    rect(width - 530 + 233, 52, 35, 19);
    rect(width - 530 + 269, 52, 33, 19);
    rect(width - 530 + 304, 52, 34, 19);
    rect(width - 530 + 340, 52, 36, 19);

    rect(width - 530 + 91, 83, 36, 19);
    rect(width - 530 + 128, 83, 33, 19);
    rect(width - 530 + 163, 83, 34, 19);
    rect(width - 530 + 199, 83, 33, 19);
    rect(width - 530 + 233, 83, 35, 19);
    rect(width - 530 + 269, 83, 33, 19);
    rect(width - 530 + 304, 83, 34, 19);
    rect(width - 530 + 340, 83, 36, 19);

    const maxHp = Math.max(1, curPlayer.statBlock.stats.mhp || 1);
    const hpRatio = Math.min(1, Math.max(0, curPlayer.statBlock.stats.hp / maxHp));
    const hpWidth = 281 * hpRatio;
    image(
        hpBarImg,
        width - 530 + 93,
        52,
        hpWidth,
        14,
        0,
        0,
        hpWidth,
        14
    );

    let heldItem =
        curPlayer.invBlock.items[
            curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]
        ];

    if (buildMode || curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar] == "" || !heldItem) {
        let manaRatio = Math.min(
            curPlayer.statBlock.stats.mp / curPlayer.statBlock.stats.mmp,
            1
        );
        image(manaBarImg, width - 530 + 93, 83, 281 * manaRatio, 14);
    } else if (heldItem.manaCost == 0 && heldItem.type == "Ranged") {
        let ammoBarLength;

        if (heldItem.reloadBool) {
            ammoBarLength =
                (heldItem.reloadSpeed - curPlayer.invBlock.useTimer) /
                heldItem.reloadSpeed;
            if (curPlayer.invBlock.useTimer <= 0) {
                heldItem.reloadBool = false;
            }
        } else if (!curPlayer.invBlock.items[heldItem.ammoName]) {
            ammoBarLength = 0.00000001;
        } else if (
            curPlayer.invBlock.items[heldItem.ammoName].amount <
            heldItem.bulletsLeft
        ) {
            ammoBarLength =
                curPlayer.invBlock.items[heldItem.ammoName].amount /
                heldItem.roundSize;
        } else {
            ammoBarLength = heldItem.bulletsLeft / heldItem.roundSize;
        }

        image(ammoBarImg, width - 530 + 93, 83, 281 * ammoBarLength, 14);

        stroke(0);
        strokeWeight(1);
        for (let i = 1; i < heldItem.roundSize; i++) {
            let lx = width - 530 + 93 + (281 * i) / heldItem.roundSize;
            line(lx, 83, lx, 97);
        }
    } else {
        let manaRatio = Math.min(
            curPlayer.statBlock.stats.mp / curPlayer.statBlock.stats.mmp,
            1
        );
        image(manaBarImg, width - 530 + 93, 83, 281 * manaRatio, 14);
    }

    textFont(gameUIFont);
    textSize(20);
    strokeWeight(1);

    fill(134);
    text("lvl", width - 530 + 26, 35);

    fill(0, 255, 0);
    text(
        curPlayer.statBlock.level +
            "   " +
            `${curPlayer.statBlock.xp} / ${curPlayer.statBlock.xpNeeded} XP`,
        width - 530 + 45,
        35
    );

    fill(134);
    text("HP:", width - 530 + 36, 70);

    fill(0, 255, 255);
    text("Mana:", width - 530 + 36, 100);

    // ✅ DOM hotbar replaces ALL canvas hotbar code
    updateMoveHotbarDOM(curPlayer);

    // Team color name
    let displayColor;
    if (typeof curPlayer.color === 'object' && curPlayer.color !== null && curPlayer.color.r !== undefined) {
        // Team color (RGB object)
        displayColor = curPlayer.color;
    } else if (curPlayer.teamId && window.allTeams?.[curPlayer.teamId]) {
        // Fall back to team data
        displayColor = window.allTeams[curPlayer.teamId].color;
    } else {
        // Use index-based color
        displayColor = teamColors[curPlayer.color] || teamColors[0];
    }

    fill(displayColor.r, displayColor.g, displayColor.b);
    textAlign(CENTER, CENTER);

    nameBtn.html(curPlayer.name);
    nameBtn.style(
        "color",
        `rgb(${displayColor.r}, ${displayColor.g}, ${displayColor.b})`
    );

    let nx, ny;
    nx = width - 530 + 6 + 45 + 350 / 2;
    ny = 19;
    nameBtn.style('font-size', '20px');
    nameBtn.position(nx, ny);
    nameBtn.show();

    // Draw underline on canvas
    let box = gameUIFont.textBounds(curPlayer.name, nx, ny);
    line(box.x, box.y + box.h + 4, box.x + box.w, box.y + box.h + 4);

    pop();
}



var teamPickDiv;
var pendingRequests = [];

function defineTeamPickUI() {
    teamPickDiv = createDiv();
    teamPickDiv.class("container");
    teamPickDiv.id("teamPickDiv");
    teamPickDiv.style("position", "absolute");
    teamPickDiv.style("top", "50%");
    teamPickDiv.style("left", "50%");
    teamPickDiv.style("transform", "translate(-50%, -50%)");
    teamPickDiv.style("display", "none");
    teamPickDiv.style("width", "600px");
    teamPickDiv.style("max-height", "80vh");
    teamPickDiv.style("overflow-y", "auto");
    teamPickDiv.style("border", "2px solid black");
    teamPickDiv.style("border-radius", "10px");
    teamPickDiv.style("text-align", "center");
    teamPickDiv.style("padding", "20px");

    updateTeamManagementUI();
}

function addTeamRequest(data) {
    pendingRequests.push(data);
    if (gameState === "team_select") {
        updateTeamManagementUI();
    }
}

function updateTeamManagementUI() {
    if (!teamPickDiv) return;
    teamPickDiv.html("");

    let title = createP("Team Management");
    title.style("font-size", "28px");
    title.style("font-weight", "bold");
    title.style("color", "white");
    title.style("margin", "0 0 20px 0");
    title.parent(teamPickDiv);

    // Close button
    let closeBtn = createImg("images/ui/x.png", "");
    closeBtn.addClass("icon-btn");
    closeBtn.style("position", "absolute");
    closeBtn.style("top", "10px");
    closeBtn.style("right", "10px");
    closeBtn.style("width", "24px");
    closeBtn.style("height", "24px");
    closeBtn.style("cursor", "pointer");
    closeBtn.style("image-rendering", "pixelated");
    closeBtn.mousePressed(() => {
        teamPickDiv.hide();
        gameState = "playing";
        curPlayer.invBlock.useTimer = 10;
    });
    closeBtn.parent(teamPickDiv);

    // Show current team or creation option
    if (curPlayer && curPlayer.teamId && window.allTeams && window.allTeams[curPlayer.teamId]) {
        showCurrentTeam();
    } else {
        showTeamCreationAndList();
    }

    // Show pending requests if creator
    if (curPlayer && curPlayer.teamId && window.allTeams && window.allTeams[curPlayer.teamId]) {
        const team = window.allTeams[curPlayer.teamId];
        if (team.creator === curPlayer.name && team.requests && team.requests.length > 0) {
            showPendingRequests();
        }
    }
}

function showCurrentTeam() {
    const team = window.allTeams[curPlayer.teamId];
    
    let teamContainer = createDiv();
    teamContainer.style("background", "rgba(0,0,0,0.5)");
    teamContainer.style("padding", "15px");
    teamContainer.style("border-radius", "10px");
    teamContainer.style("margin", "10px 0");
    teamContainer.parent(teamPickDiv);

    let teamName = createP(`Team: ${team.name}`);
    teamName.style("font-size", "24px");
    teamName.style("color", `rgb(${team.color.r}, ${team.color.g}, ${team.color.b})`);
    teamName.style("margin", "0 0 10px 0");
    teamName.style("font-weight", "bold");
    teamName.parent(teamContainer);

    // Color preview
    let colorBox = createDiv();
    colorBox.style("width", "60px");
    colorBox.style("height", "60px");
    colorBox.style("background", `rgb(${team.color.r}, ${team.color.g}, ${team.color.b})`);
    colorBox.style("margin", "10px auto");
    colorBox.style("border", "2px solid white");
    colorBox.style("border-radius", "5px");
    colorBox.parent(teamContainer);

    // Members list
    let membersTitle = createP("Members:");
    membersTitle.style("color", "white");
    membersTitle.style("margin", "15px 0 5px 0");
    membersTitle.parent(teamContainer);

    team.members.forEach(memberName => {
        // Find the player by name
        const memberPlayer = Object.values(players).find(p => p.name === memberName);
        if (memberPlayer) {
            // Check if this member is a leader
            const isLeader = (team.leaders && team.leaders.includes(memberName)) || team.creator === memberName;
            const currentPlayerIsLeader = (team.leaders && team.leaders.includes(curPlayer.name)) || team.creator === curPlayer.name;
            
            // Create member row container
            let memberRowDiv = createDiv();
            memberRowDiv.style("display", "flex");
            memberRowDiv.style("align-items", "center");
            memberRowDiv.style("justify-content", "space-between");
            memberRowDiv.style("margin", "8px 0");
            memberRowDiv.style("padding", "8px");
            memberRowDiv.style("background", "rgba(255,255,255,0.05)");
            memberRowDiv.style("border-radius", "5px");
            memberRowDiv.parent(teamContainer);

            // Member name with crown emoji
            let memberInfoDiv = createDiv();
            memberInfoDiv.style("display", "flex");
            memberInfoDiv.style("align-items", "center");
            memberInfoDiv.style("gap", "8px");
            memberInfoDiv.parent(memberRowDiv);

            let memberNameP = createP(`${isLeader ? '👑 ' : '• '}${memberName}`);
            memberNameP.style("color", "white");
            memberNameP.style("margin", "0");
            memberNameP.parent(memberInfoDiv);

            // Action buttons (only visible if current player is a leader)
            if (currentPlayerIsLeader && memberName !== curPlayer.name) {
                let actionsDiv = createDiv();
                actionsDiv.style("display", "flex");
                actionsDiv.style("gap", "5px");
                actionsDiv.parent(memberRowDiv);

                // Promote button
                if (!isLeader) {
                    let promoteBtn = createButton("Promote");
                    promoteBtn.style("padding", "4px 10px");
                    promoteBtn.style("background", "#FFD700");
                    promoteBtn.style("color", "#000");
                    promoteBtn.style("border", "none");
                    promoteBtn.style("border-radius", "3px");
                    promoteBtn.style("cursor", "pointer");
                    promoteBtn.style("font-size", "12px");
                    promoteBtn.mousePressed(() => {
                        socket.emit('promote_member', { teamId: curPlayer.teamId, memberName: memberName });
                    });
                    promoteBtn.parent(actionsDiv);
                }

                // Remove button (only for non-leaders)
                if (!isLeader) {
                    let removeBtn = createButton("Remove");
                    removeBtn.style("padding", "4px 10px");
                    removeBtn.style("background", "#f44336");
                    removeBtn.style("color", "white");
                    removeBtn.style("border", "none");
                    removeBtn.style("border-radius", "3px");
                    removeBtn.style("cursor", "pointer");
                    removeBtn.style("font-size", "12px");
                    removeBtn.mousePressed(() => {
                        if (confirm(`Remove ${memberName} from team?`)) {
                            socket.emit('remove_member', { teamId: curPlayer.teamId, memberName: memberName });
                        }
                    });
                    removeBtn.parent(actionsDiv);
                }
            }
        }
    });

    // Team creator controls
    if (team.creator === curPlayer.name) {
        let creatorSection = createDiv();
        creatorSection.style("margin-top", "20px");
        creatorSection.style("padding", "15px");
        creatorSection.style("background", "rgba(255,215,0,0.1)");
        creatorSection.style("border-radius", "8px");
        creatorSection.parent(teamContainer);

        let creatorTitle = createP("Leader Controls");
        creatorTitle.style("color", "#ffd700");
        creatorTitle.style("font-weight", "bold");
        creatorTitle.style("margin", "0 0 10px 0");
        creatorTitle.parent(creatorSection);

        // Change name
        let nameInput = createInput(team.name);
        nameInput.attribute("placeholder", "Team Name");
        nameInput.style("width", "200px");
        nameInput.style("padding", "8px");
        nameInput.style("margin", "5px");
        nameInput.style("border-radius", "5px");
        nameInput.parent(creatorSection);

        let nameBtn = createButton("Update Name");
        nameBtn.style("padding", "8px 15px");
        nameBtn.style("background", "#4CAF50");
        nameBtn.style("color", "white");
        nameBtn.style("border", "none");
        nameBtn.style("border-radius", "5px");
        nameBtn.style("cursor", "pointer");
        nameBtn.style("margin", "5px");
        nameBtn.mousePressed(() => {
            socket.emit('update_team', { teamId: curPlayer.teamId, name: nameInput.value() });
        });
        nameBtn.parent(creatorSection);

        // Change color
        let colorLabel = createP("Team Color:");
        colorLabel.style("color", "white");
        colorLabel.style("margin", "15px 0 5px 0");
        colorLabel.parent(creatorSection);

        // Convert current team color to hex
        const toHex = (n) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        const currentHex = '#' + toHex(team.color.r) + toHex(team.color.g) + toHex(team.color.b);

        let colorInputEdit = createInput(currentHex);
        colorInputEdit.attribute("type", "color");
        colorInputEdit.style("width", "100px");
        colorInputEdit.style("height", "40px");
        colorInputEdit.style("margin", "5px");
        colorInputEdit.style("border", "2px solid white");
        colorInputEdit.style("border-radius", "5px");
        colorInputEdit.style("cursor", "pointer");
        colorInputEdit.parent(creatorSection);

        // Color preview for editing
        let colorPreviewEdit = createDiv();
        colorPreviewEdit.style("width", "100px");
        colorPreviewEdit.style("height", "40px");
        colorPreviewEdit.style("background", currentHex);
        colorPreviewEdit.style("margin", "5px auto");
        colorPreviewEdit.style("border", "2px solid white");
        colorPreviewEdit.style("border-radius", "5px");
        colorPreviewEdit.style("display", "inline-block");
        colorPreviewEdit.parent(creatorSection);

        // Update preview on color change
        colorInputEdit.input(() => {
            colorPreviewEdit.style("background", colorInputEdit.value());
        });

        let colorBtn = createButton("Update Color");
        colorBtn.style("padding", "8px 15px");
        colorBtn.style("background", "#2196F3");
        colorBtn.style("color", "white");
        colorBtn.style("border", "none");
        colorBtn.style("border-radius", "5px");
        colorBtn.style("cursor", "pointer");
        colorBtn.style("margin", "5px");
        colorBtn.mousePressed(() => {
            const hex = colorInputEdit.value();
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            socket.emit('update_team', {
                teamId: curPlayer.teamId,
                color: { r, g, b }
            });
        });
        colorBtn.parent(creatorSection);
    }

    // Invite button (for leaders)
    if ((team.leaders && team.leaders.includes(curPlayer.name)) || team.creator === curPlayer.name) {
        let inviteBtn = createButton("Invite Player");
        inviteBtn.style("padding", "10px 20px");
        inviteBtn.style("background", "#4CAF50");
        inviteBtn.style("color", "white");
        inviteBtn.style("border", "none");
        inviteBtn.style("border-radius", "5px");
        inviteBtn.style("cursor", "pointer");
        inviteBtn.style("margin-top", "10px");
        inviteBtn.mousePressed(() => {
            showInvitePlayerUI();
        });
        inviteBtn.parent(teamContainer);
    }

    // Leave team button
    let leaveBtn = createButton(team.creator === curPlayer.name ? "Disband Team" : "Leave Team");
    leaveBtn.style("padding", "10px 20px");
    leaveBtn.style("background", "#f44336");
    leaveBtn.style("color", "white");
    leaveBtn.style("border", "none");
    leaveBtn.style("border-radius", "5px");
    leaveBtn.style("cursor", "pointer");
    leaveBtn.style("margin-top", "20px");
    leaveBtn.mousePressed(() => {
        if (confirm(team.creator === curPlayer.name ? "Disband team?" : "Leave team?")) {
            socket.emit('leave_team');
        }
    });
    leaveBtn.parent(teamContainer);
}

function showTeamCreationAndList() {
    // Create team section
    let createSection = createDiv();
    createSection.style("background", "rgba(0,0,0,0.5)");
    createSection.style("padding", "15px");
    createSection.style("border-radius", "10px");
    createSection.style("margin", "10px 0");
    createSection.parent(teamPickDiv);

    let createTitle = createP("Create New Team");
    createTitle.style("color", "white");
    createTitle.style("font-size", "20px");
    createTitle.style("margin", "0 0 10px 0");
    createTitle.parent(createSection);

    let nameInput = createInput("");
    nameInput.attribute("placeholder", "Team Name");
    nameInput.style("width", "200px");
    nameInput.style("padding", "8px");
    nameInput.style("margin", "5px");
    nameInput.style("border-radius", "5px");
    nameInput.parent(createSection);

    let colorLabel = createP("Team Color:");
    colorLabel.style("color", "white");
    colorLabel.style("margin", "10px 0 5px 0");
    colorLabel.parent(createSection);

    let colorInput = createInput("#ff0000");
    colorInput.attribute("type", "color");
    colorInput.style("width", "100px");
    colorInput.style("height", "40px");
    colorInput.style("margin", "5px");
    colorInput.style("border", "2px solid white");
    colorInput.style("border-radius", "5px");
    colorInput.style("cursor", "pointer");
    colorInput.parent(createSection);

    // Create color preview box
    let colorPreview = createDiv();
    colorPreview.style("width", "100px");
    colorPreview.style("height", "40px");
    colorPreview.style("background", "#ff0000");
    colorPreview.style("margin", "5px auto");
    colorPreview.style("border", "2px solid white");
    colorPreview.style("border-radius", "5px");
    colorPreview.style("display", "inline-block");
    colorPreview.parent(createSection);

    // Update preview on color change
    colorInput.input(() => {
        colorPreview.style("background", colorInput.value());
    });

    let createBtn = createButton("Create Team");
    createBtn.style("padding", "10px 20px");
    createBtn.style("background", "#4CAF50");
    createBtn.style("color", "white");
    createBtn.style("border", "none");
    createBtn.style("border-radius", "5px");
    createBtn.style("cursor", "pointer");
    createBtn.style("margin", "10px 5px");
    createBtn.mousePressed(() => {
        const name = nameInput.value().trim();
        if (!name) {
            alert("Please enter a team name");
            return;
        }
        // Convert hex color to RGB
        const hex = colorInput.value();
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        socket.emit('create_team', {
            name,
            color: { r, g, b }
        });
    });
    createBtn.parent(createSection);

    // Available teams
    if (window.allTeams && Object.keys(window.allTeams).length > 0) {
        let teamsSection = createDiv();
        teamsSection.style("background", "rgba(0,0,0,0.5)");
        teamsSection.style("padding", "15px");
        teamsSection.style("border-radius", "10px");
        teamsSection.style("margin", "10px 0");
        teamsSection.parent(teamPickDiv);

        let teamsTitle = createP("Available Teams");
        teamsTitle.style("color", "white");
        teamsTitle.style("font-size", "20px");
        teamsTitle.style("margin", "0 0 10px 0");
        teamsTitle.parent(teamsSection);

        Object.values(window.allTeams).forEach(team => {
            let teamDiv = createDiv();
            teamDiv.style("background", "rgba(255,255,255,0.1)");
            teamDiv.style("padding", "10px");
            teamDiv.style("margin", "5px 0");
            teamDiv.style("border-radius", "5px");
            teamDiv.style("display", "flex");
            teamDiv.style("justify-content", "space-between");
            teamDiv.style("align-items", "center");
            teamDiv.parent(teamsSection);

            let teamInfo = createDiv();
            teamInfo.parent(teamDiv);

            let teamNameP = createP(team.name);
            teamNameP.style("color", `rgb(${team.color.r}, ${team.color.g}, ${team.color.b})`);
            teamNameP.style("margin", "0");
            teamNameP.style("font-weight", "bold");
            teamNameP.parent(teamInfo);

            let teamMembersP = createP(`${team.members.length} member${team.members.length !== 1 ? 's' : ''}`);
            teamMembersP.style("color", "white");
            teamMembersP.style("margin", "0");
            teamMembersP.style("font-size", "12px");
            teamMembersP.parent(teamInfo);

            let joinBtn = createButton("Request Join");
            joinBtn.style("padding", "8px 15px");
            joinBtn.style("background", "#2196F3");
            joinBtn.style("color", "white");
            joinBtn.style("border", "none");
            joinBtn.style("border-radius", "5px");
            joinBtn.style("cursor", "pointer");
            joinBtn.mousePressed(() => {
                socket.emit('request_join_team', { teamId: team.id });
            });
            joinBtn.parent(teamDiv);
        });
    }
}

function showPendingRequests() {
    const team = window.allTeams[curPlayer.teamId];
    if (!team || !team.requests || team.requests.length === 0) return;

    let requestsSection = createDiv();
    requestsSection.style("background", "rgba(255,215,0,0.1)");
    requestsSection.style("padding", "15px");
    requestsSection.style("border-radius", "10px");
    requestsSection.style("margin", "20px 0");
    requestsSection.parent(teamPickDiv);

    let requestsTitle = createP("Pending Join Requests");
    requestsTitle.style("color", "#ffd700");
    requestsTitle.style("font-size", "18px");
    requestsTitle.style("margin", "0 0 10px 0");
    requestsTitle.parent(requestsSection);

    team.requests.forEach((playerName) => {
        // playerName is now directly the username (not socket ID)

        let reqDiv = createDiv();
        reqDiv.style("background", "rgba(255,255,255,0.1)");
        reqDiv.style("padding", "10px");
        reqDiv.style("margin", "5px 0");
        reqDiv.style("border-radius", "5px");
        reqDiv.style("display", "flex");
        reqDiv.style("justify-content", "space-between");
        reqDiv.style("align-items", "center");
        reqDiv.parent(requestsSection);

        let nameP = createP(playerName);
        nameP.style("color", "white");
        nameP.style("margin", "0");
        nameP.parent(reqDiv);

        let btnContainer = createDiv();
        btnContainer.style("display", "flex");
        btnContainer.style("gap", "5px");
        btnContainer.parent(reqDiv);

        let acceptBtn = createButton("✓");
        acceptBtn.style("padding", "5px 10px");
        acceptBtn.style("background", "#4CAF50");
        acceptBtn.style("color", "white");
        acceptBtn.style("border", "none");
        acceptBtn.style("border-radius", "5px");
        acceptBtn.style("cursor", "pointer");
        acceptBtn.mousePressed(() => {
            socket.emit('accept_team_request', { teamId: curPlayer.teamId, playerName: playerName });
            updateTeamManagementUI();
        });
        acceptBtn.parent(btnContainer);

        let denyBtn = createButton("✗");
        denyBtn.style("padding", "5px 10px");
        denyBtn.style("background", "#f44336");
        denyBtn.style("color", "white");
        denyBtn.style("border", "none");
        denyBtn.style("border-radius", "5px");
        denyBtn.style("cursor", "pointer");
        denyBtn.mousePressed(() => {
            socket.emit('deny_team_request', { teamId: curPlayer.teamId, playerName: playerName });
            updateTeamManagementUI();
        });
        denyBtn.parent(btnContainer);
    });
}

// Timer UI code - see below at line 2621

function setTimeUI(data) {
    if (data && data.disabled) {
        timerEnabled = false;
        if (timerDiv) timerDiv.hide();
        return;
    }
    timerEnabled = true;
    if (data && typeof data.endsAt === "number") {
        timerEndsAt = data.endsAt;
        timerRemaining = Math.max(0, Math.round((timerEndsAt - Date.now()) / 1000));
    } else {
        timerRemaining = data.totalSeconds ?? (data.minutes * 60 + data.seconds);
    }
    updateTimerDisplay();
}


function updateTimerDisplay() {
    const years = Math.floor(timerRemaining / (365 * 24 * 3600));
    const days = Math.floor((timerRemaining % (365 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((timerRemaining % (24 * 3600)) / 3600);
    const minutes = Math.floor((timerRemaining % 3600) / 60);
    const seconds = timerRemaining % 60;

    // Optional: pad values
    const pad = (v) => v.toString().padStart(2, '0');

    let parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (days > 0 || years > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0 || years > 0) parts.push(`${pad(hours)}h`);
    parts.push(`${pad(minutes)}m`, `${pad(seconds)}s`);

    timerDisplay = parts.join(' ');
    //console.log("Timer:", timerDisplay);

    // PERF FIX #7: Only adjust font when thresholds change
    adjustFontSize(timerRemaining);
}

function adjustFontSize(timerRemaining) {
    if (!timerEnabled || !timerDiv) return;

    let size;
    if (timerRemaining >= 365 * 24 * 3600) {
        size = "1.2rem"; // Years
    } else if (timerRemaining >= 24 * 3600) {
        size = "1.5rem"; // Days
    } else if (timerRemaining >= 3600) {
        size = "2rem"; // Hours
    } else {
        size = "2.5rem"; // MM:SS
    }

    if (size !== lastTimerFontSize) {
        timerDiv.style("font-size", size);
        lastTimerFontSize = size;
    }
}


// fastHighlightSwapLists is defined in ui/inventoryUI.js; remove legacy copy here to prevent overrides and DOM churn.

/**
 * @typedef {{ amount: number, imgNum?: number }} ItemEntry
 * @typedef {{ items: Record<string, ItemEntry>, curItem?: string }} Inventory
 */

// fastHighlightSwapLists is defined in ui/inventoryUI.js; keep this file free of duplicates so events use that implementation.

/**
 * Safely resolves a data URL for the first frame of an item's image.
 * Returns undefined if not available.
 * @param {number|undefined} imgNum
 * @returns {string|undefined}
 */
function getItemFrameDataURL(imgNum) {
    // Expecting itemImgs to be something like: Array<Array<{canvas: HTMLCanvasElement}>> 
    const frames = (typeof imgNum === "number" && itemImgs) ? itemImgs[imgNum] : undefined;
    const frame0 = Array.isArray(frames) ? frames[0] : undefined;
    const canvas = frame0 && frame0.canvas;
    return (canvas && typeof canvas.toDataURL === "function") ? canvas.toDataURL() : undefined;
}

/**
 * Backfills missing imgNum fields for loot bags while leaving chests/other containers untouched.
 * Only runs when the currently opened otherInv is an ItemBag.
 * @param {Inventory} inv
 * @returns {Inventory}
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
 * @typedef {{ amount: number, imgNum?: number, itemName?: string, desc?: string, type?: string, durability?: number, maxDurability?: number }} ItemEntry
 * @typedef {{ items: Record<string, ItemEntry>, curItem?: string, getItemStats?: (name: string) => Array<[string, number|string]> }} Inventory
 */

/**
 * Return a data URL for the first frame of itemImgs[imgNum], or undefined.
 * Expects global itemImgs: Array<Array<{canvas: HTMLCanvasElement}>>
 * @param {number|undefined} imgNum
 * @returns {string|undefined}
 */
function getItemFrameDataURL(imgNum) {
    const frames = (typeof imgNum === "number" && itemImgs) ? itemImgs[imgNum] : undefined;
    const frame0 = Array.isArray(frames) ? frames[0] : undefined;
    const canvas = frame0 && frame0.canvas;
    return (canvas && typeof canvas.toDataURL === "function") ? canvas.toDataURL() : undefined;
}



//render timer on the top of the screen 
let timerEnabled = true;
let timerRemaining = 15 * 60; // in seconds
let lastUpdateTime = 0;
let timerEndsAt = null;
// PERF FIX #6: Use timerDiv directly for font size; avoid DOM queries
let lastTimerFontSize = "";
let lastTimerDisplay = ""; // PERF FIX #8: Only write to DOM when changed

let timerDisplay = "15:00";
function setTimeUI(data) {
    if (data && data.disabled) {
        timerEnabled = false;
        if (timerDiv) timerDiv.hide();
        return;
    }
    timerEnabled = true;
    if (data && typeof data.endsAt === "number") {
        timerEndsAt = data.endsAt;
        timerRemaining = Math.max(0, Math.round((timerEndsAt - Date.now()) / 1000));
    } else {
        timerRemaining = data.totalSeconds ?? (data.minutes * 60 + data.seconds);
    }
    updateTimerDisplay();
}


function updateTimerDisplay() {
    const years = Math.floor(timerRemaining / (365 * 24 * 3600));
    const days = Math.floor((timerRemaining % (365 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((timerRemaining % (24 * 3600)) / 3600);
    const minutes = Math.floor((timerRemaining % 3600) / 60);
    const seconds = timerRemaining % 60;

    // Optional: pad values
    const pad = (v) => v.toString().padStart(2, '0');

    let parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (days > 0 || years > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0 || years > 0) parts.push(`${pad(hours)}h`);
    parts.push(`${pad(minutes)}m`, `${pad(seconds)}s`);

    timerDisplay = parts.join(' ');
    //console.log("Timer:", timerDisplay);

    // PERF FIX #7: Only adjust font when thresholds change
    adjustFontSize(timerRemaining);
}

function adjustFontSize(timerRemaining) {
    if (!timerEnabled || !timerDiv) return;

    let size;
    if (timerRemaining >= 365 * 24 * 3600) {
        size = "1.2rem"; // Years
    } else if (timerRemaining >= 24 * 3600) {
        size = "1.5rem"; // Days
    } else if (timerRemaining >= 3600) {
        size = "2rem"; // Hours
    } else {
        size = "2.5rem"; // MM:SS
    }

    if (size !== lastTimerFontSize) {
        timerDiv.style("font-size", size);
        lastTimerFontSize = size;
    }
}


function renderTimeUI() {
    if (!timerEnabled || !timerDiv) return;

    const now = millis();
    if (now - lastUpdateTime >= 1000) {
        if (typeof timerEndsAt === "number") {
            timerRemaining = Math.max(0, Math.round((timerEndsAt - Date.now()) / 1000));
        } else if (timerRemaining > 0) {
            timerRemaining--;
        }

        updateTimerDisplay();
        lastUpdateTime = now;

        // PERF: Only write to DOM when the display actually changes
        if (timerDisplay !== lastTimerDisplay) {
            timerDiv.html(" ⏳ " + timerDisplay);
            lastTimerDisplay = timerDisplay;
        }
    }
}

var craftDiv;
var craftListDiv;
var curCraftItemDiv;

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
    craftingTitle.style("color", "yellow");

    // Moves tab
    let movesTitle = createP("Moves").parent(topBar);
    movesTitle.class("inventory-title");
    movesTitle.style("cursor", "pointer");
    movesTitle.mousePressed(() => {
        craftDiv.hide();
        showMovesEditor();
    });

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

    // ✅ Search Bar
    let searchBar = createInput().parent(craftDiv);
    searchBar.id("craftSearch");
    searchBar.attribute("placeholder", "Search...");
    searchBar.input(() => updateCraftList());
    applyStyle(searchBar, {
        width: "95%",
        padding: "5px",
        margin: "5px 0",
        fontSize: "16px",
        borderRadius: "5px",
        border: "2px solid black"
    });

    let bottomDiv = createDiv().parent(craftDiv);
    bottomDiv.class("bottom-area");

    craftListDiv = createDiv().parent(bottomDiv);
    craftListDiv.class("item-list");

    curCraftItemDiv = createDiv().parent(bottomDiv);
    curCraftItemDiv.class("item-details");

    let closeButton = createImg("images/ui/x.png", "").parent(topBar);
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
        gameState = "playing";
        curPlayer.invBlock.useTimer = 10;
        craftDiv.hide();
    });

    updateCraftList();
    updatecurCraftItemDiv();
}

function updateCraftList() {
    if (!curPlayer) return;
    craftListDiv.html("");

    let arr = JSON.parse(JSON.stringify(craftOptions));

  for (let i = 0; i < testMap.chunks[getPlayerChunk()].objects.length; i++) {
    let obj = testMap.chunks[getPlayerChunk()].objects[i];

    // Check for nearby campfire
    if (obj.objName === "Campfire" && curPlayer.pos.dist(obj.pos) < 100) {

        // 🔥 CAMPFIRE ITEMS — only add if missing
        const itemsToAdd = [
            {
                type: "SimpleItem",
                itemName: "Metal",
                imgNum: 23,
                cost: [1, ["Raw Metal", 1]]
            },
            {
                type: "Food",
                itemName: "Roasted Tail",
                imgNum: 35,
                cost: [1, ["Skizzard Tail", 1]]
            }
        ];

        for (const item of itemsToAdd) {
            // === LIST GATE: block duplicates ===
            const exists = arr.some(x => x.itemName === item.itemName);

            if (!exists) {
                arr.push(item);
            }
        }
    }
}


    arr = arr.filter((item) => {
        let tag = curPlayer.invBlock.curTag;
        if (tag === "All") return true;
        if (tag === "Tools/Seeds") return item.type === "Shovel" || item.type === "Seed";
        if (tag === "Weapons") return item.type === "Melee" || item.type === "Ranged";
        if (tag === "Equipment") return ["Equipment", "Teleport Receiver", "Dirt Bag Upgrade", "Compass", "Map"].includes(item.itemName) || item.type === "Equipment" || item.type === "CustomItem";
        if (tag === "Consumables") return item.type === "Food" || item.type === "Potion";
        return false;
    });
    let searchQuery = select("#craftSearch")?.value()?.toLowerCase() ?? "";

    if (searchQuery !== "") {
        // Escape regex-special chars so user input can't break it
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const regex = new RegExp(escaped, "i"); // i = case-insensitive

        arr = arr.filter(item => regex.test(item.itemName));
    }


    arr.forEach((entry) => {
        let itemName = entry.itemName;
        let itemDiv = createDiv().parent(craftListDiv);
        itemDiv.attribute('data-item', itemName);
        applyStyle(itemDiv, {
            width: "100%",
            minHeight: "70px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "2px solid black",
            cursor: "pointer",
            position: "relative",
            padding: "8px 0"
        });
        itemDiv.mousePressed(() => {
            curPlayer.invBlock.curItem = itemName;
            highlightCraftList();
            updatecurCraftItemDiv();
        });
        let itemInfoDiv = createDiv().parent(itemDiv);
        applyStyle(itemInfoDiv, {
            width: "80%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px"
        });
        let imgDiv = createDiv().parent(itemInfoDiv);
        applyStyle(imgDiv, {
            width: "2.8em",
            height: "2.8em",
            minWidth: "36px",
            minHeight: "36px",
            marginRight: "0.5em",
            display: "flex",
            alignItems: "center",
            flexShrink: "0"
        });
        const craftURL = resolveItemImgURL(itemName, { imgNum: entry.imgNum });
        if (craftURL) {
            let imgEl = createImg(craftURL, '').parent(imgDiv);
            applyStyle(imgEl, {
                width: "100%",
                height: "100%",
                imageRendering: "pixelated",
                pointerEvents: "none"
            });
        } else {
            const placeholder = createDiv('•').parent(imgDiv);
            applyStyle(placeholder, {
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            });
        }
        // Name + ingredient preview container
        let nameAndIngsDiv = createDiv().parent(itemInfoDiv);
        nameAndIngsDiv.style("flex", "1");
        nameAndIngsDiv.style("min-width", "0");

        let itemNameP = createP(itemName).parent(nameAndIngsDiv);
        itemNameP.style("font-size", "16px");
        itemNameP.style("color", rarityColorCSS(itemName));
        itemNameP.style("margin", "0");
        itemNameP.style("line-height", "1.3");

        // Mini ingredient icons row
        const entryData = itemDic[itemName] || entry;
        if (entryData && entryData.cost && entryData.cost.length > 1) {
            let ingsRow = createDiv().parent(nameAndIngsDiv);
            ingsRow.class("craft-row-ingredients");
            for (let ci = 1; ci < entryData.cost.length; ci++) {
                const ingName = entryData.cost[ci][0];
                const ingAmt  = entryData.cost[ci][1];
                const ingHave = (ingName === "Dirt") ? dirtInv : (curPlayer.invBlock.items[ingName]?.amount ?? 0);
                const ingEnough = ingHave >= ingAmt;

                let ingChip = createDiv().parent(ingsRow);
                ingChip.class("craft-row-ing-chip" + (ingEnough ? "" : " craft-row-ing-missing"));

                const ingUrl = resolveItemImgURL(ingName);
                if (ingUrl) {
                    let ingImg = createImg(ingUrl, '').parent(ingChip);
                    ingImg.class("craft-row-ing-img");
                }
                let ingLabel = createSpan("×" + ingAmt).parent(ingChip);
                ingLabel.class("craft-row-ing-label");
            }
        }

        const canCraft = curPlayer.invBlock.craftCheck(itemName);

        // Dim the entire row if unaffordable
        if (!canCraft) {
            itemDiv.style("opacity", "0.5");
        }

        let craftIndicator;
        if (canCraft) {
            craftIndicator = createP("✔");
            craftIndicator.style("color", "green");
            craftIndicator.style("font-size", "20px");
        } else {
            craftIndicator = createImg("images/ui/x.png", "");
            craftIndicator.style("width", "20px");
            craftIndicator.style("height", "20px");
            craftIndicator.style("imageRendering", "pixelated");
            craftIndicator.style("pointerEvents", "none");
        }
        craftIndicator.parent(itemInfoDiv);
        craftIndicator.style("flex-shrink", "0");
    });
    highlightCraftList();
}

function updatecurCraftItemDiv() {
    if (!curPlayer) return;
    curCraftItemDiv.html("");

    if (curPlayer.invBlock.curItem == "") {
        let noneSelected = createP("No Selected Item").parent(curCraftItemDiv);
        noneSelected.class("inventory-title");
        applyStyle(noneSelected, {
            paddingTop: "7%",
            textDecoration: "none"
        });
        return;
    }

    let curItem = curPlayer.invBlock.curItem;
    let itemData = itemDic[curItem];

    let itemCardDiv = createDiv().parent(curCraftItemDiv);
    applyStyle(itemCardDiv, {
        width: "100%",
        height: "30%",
        display: "flex",
        marginBottom: "20px"
    });

    let itemImgDiv = createDiv().parent(itemCardDiv);
    const craftBG = resolveItemImgURL(curItem, { imgNum: itemData?.img });
    applyStyle(itemImgDiv, {
        width: "50%",
        height: "100%",
        border: "2px solid black",
        borderRadius: "10px",
        backgroundImage: craftBG ? `url('${craftBG}')` : "none",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        imageRendering: "pixelated"
    });
    if (!craftBG) {
        // placeholder dot for missing art
        itemImgDiv.style("display", "flex");
        itemImgDiv.style("align-items", "center");
        itemImgDiv.style("justify-content", "center");
        const dot = createDiv("•");
        dot.style("font-size", "28px");
        dot.style("color", "#ccc");
        dot.parent(itemImgDiv);
    }

    let itemNameDescDiv = createDiv().parent(itemCardDiv);
    itemNameDescDiv.style("width", "calc(50% - 8px)");

    let itemNameDiv = createDiv().parent(itemNameDescDiv);
    applyStyle(itemNameDiv, {
        width: "100%",
        height: "20%",
        border: "2px solid black",
        borderRadius: "10px"
    });

    let itemNameP = createP(curItem).parent(itemNameDiv);
    applyStyle(itemNameP, {
        fontSize: "20px",
        margin: "5px",
        padding: "0",
        wordWrap: "break-word",
        overflowWrap: "break-word",
        whiteSpace: "normal"
    });
    itemNameP.style("color", rarityColorCSS(curItem));

    let itemDescDiv = createDiv().parent(itemNameDescDiv);
    applyStyle(itemDescDiv, {
        width: "100%",
        height: "calc(80% - 5px)",
        border: "2px solid black",
        borderRadius: "10px"
    });

    let itemDescP = createP(itemData.desc).parent(itemDescDiv);
    applyStyle(itemDescP, {
        fontSize: "20px",
        color: "white",
        margin: "5px"
    });

    // Durability display if item has it
    if (itemData.durability && itemData.durability > 0) {
        let durabilityDiv = createDiv().parent(curCraftItemDiv);
        applyStyle(durabilityDiv, {
            width: "calc(100% - 14px)",
            height: "8%",
            padding: "5px",
            border: "2px solid black",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "5px"
        });

        let durabilityText = createP("Durability: " + itemData.durability).parent(durabilityDiv);
        applyStyle(durabilityText, {
            fontSize: "16px",
            color: "white",
            margin: "0"
        });
    }

    let itemCostDiv = createDiv().parent(curCraftItemDiv);
    itemCostDiv.style("width", "100%");
    itemCostDiv.style("height", "61%");

    let craftButton = createButton("Craft").parent(itemCostDiv);
    applyStyle(craftButton, {
        height: "15%",
        fontSize: "25px",
        padding: "5px",
        border: "2px solid black",
        borderRadius: "10px",
        marginBottom: "5px",
        backgroundColor: curPlayer.invBlock.craftCheck(curItem) ? "green" : "red",
        opacity: curPlayer.invBlock.craftCheck(curItem) ? "1" : "0.5",
        pointerEvents: curPlayer.invBlock.craftCheck(curItem) ? "auto" : "none"
    });

    craftButton.mousePressed(() => {
        if (curPlayer.invBlock.craftCheck(curItem)) {
            curPlayer.invBlock.addItem(curItem, itemData.cost[0], true);
            for (let i = 1; i < itemData.cost.length; i++) {
                let item = itemData.cost[i][0];
                let amount = itemData.cost[i][1];
                if (item == "Dirt") dirtInv -= amount;
                else curPlayer.invBlock.decreaseAmount(item, amount);
            }
            updateCraftList();
            updatecurCraftItemDiv();
        }
    });

    let craftAllButton = createButton("Craft All").parent(itemCostDiv);

    applyStyle(craftAllButton, {
        height: "15%",
        fontSize: "25px",
        padding: "5px",
        border: "2px solid black",
        borderRadius: "10px",
        marginBottom: "10px",
        marginLeft:"20%",
        color: "white",
        cursor: "pointer"
    });

// Disable if not enough materials to craft even once
if (!curPlayer.invBlock.craftCheck(curItem)) {
    craftAllButton.style("opacity", "0.5");
    craftAllButton.style("pointerEvents", "none");
}

craftAllButton.mousePressed(() => {
    let maxCraft = Infinity;

    for (let i = 1; i < itemData.cost.length; i++) {
        let itemName = itemData.cost[i][0];
        let required = itemData.cost[i][1];
        let available = (itemName == "Dirt") ? dirtInv : (curPlayer.invBlock.items[itemName]?.amount ?? 0);
        let possible = Math.floor(available / required);
        maxCraft = Math.min(maxCraft, possible);
    }

    if (maxCraft > 0) {
        // Add outputs
        curPlayer.invBlock.addItem(curItem, itemData.cost[0] * maxCraft, true);

        // Subtract ingredients
        for (let i = 1; i < itemData.cost.length; i++) {
            let itemName = itemData.cost[i][0];
            let amount = itemData.cost[i][1] * maxCraft;
            if (itemName == "Dirt") {
                dirtInv -= amount;
            } else {
                curPlayer.invBlock.decreaseAmount(itemName, amount);
            }
        }

        updateCraftList();
        updatecurCraftItemDiv();
    }
});

    let costText = createDiv("Ingredients").parent(itemCostDiv);
    applyStyle(costText, {
        fontSize: "18px",
        color: "var(--color-gold)",
        textAlign: "center",
        border: "2px solid black",
        borderRadius: "10px",
        padding: "8px",
        marginBottom: "5px",
        textTransform: "uppercase",
        letterSpacing: "1px"
    });

    let costList = createDiv().parent(itemCostDiv);
    applyStyle(costList, {
        width: "100%",
        height: "calc(90% - 10px)",
        overflowY: "auto"
    });

  // Output row
  const outputDiv = createDiv().parent(costList);
  outputDiv.class("craft-cost-row");
  let outImgWrap = createDiv().parent(outputDiv);
  outImgWrap.class("craft-cost-img-wrap");
  const outImgUrl = resolveItemImgURL(curItem, { imgNum: itemData?.img });
  if (outImgUrl) {
      let outImg = createImg(outImgUrl, '').parent(outImgWrap);
      outImg.class("craft-cost-img");
  }
  let outLabel = createDiv("Output:").parent(outputDiv);
  outLabel.class("craft-cost-label");
  let outAmt = createDiv("×" + itemData.cost[0]).parent(outputDiv);
  outAmt.class("craft-cost-amount");
  outAmt.style("color", "white");

  // Ingredient rows with images
  for (let i = 1; i < itemData.cost.length; i++) {
    const item   = itemData.cost[i][0];
    const needed = itemData.cost[i][1];
    const have   = (item === "Dirt") ? dirtInv : (curPlayer.invBlock.items[item]?.amount ?? 0);
    const enough = have >= needed;

    const costDiv = createDiv().parent(costList);
    costDiv.class("craft-cost-row" + (enough ? "" : " craft-cost-missing"));

    // Ingredient image
    let ingImgWrap = createDiv().parent(costDiv);
    ingImgWrap.class("craft-cost-img-wrap");
    const ingImgUrl = resolveItemImgURL(item);
    if (ingImgUrl) {
        let ingImg = createImg(ingImgUrl, '').parent(ingImgWrap);
        ingImg.class("craft-cost-img");
    } else {
        let dot = createDiv("•").parent(ingImgWrap);
        dot.style("color", "#666");
    }

    // Name
    let nameDiv = createDiv(item).parent(costDiv);
    nameDiv.class("craft-cost-label");
    nameDiv.style("color", rarityColorCSS(item));

    // Have / Need
    let amtDiv = createDiv(`${have}/${needed}`).parent(costDiv);
    amtDiv.class("craft-cost-amount");
    amtDiv.style("color", enough ? "#27f50e" : "#ff4444");
  }

}

var deathDiv;
var respawnButton;
var hardcoreNotice;

function defineDeathUI() {
    deathDiv = createDiv();
    deathDiv.id("deathDiv");
    deathDiv.class("container");
    deathDiv.style("position", "absolute");
    deathDiv.style("top", "50%");
    deathDiv.style("left", "50%");
    deathDiv.style("transform", "translate(-50%, -50%)");
    deathDiv.style("width", "clamp(280px, 60vw, 400px)");
    deathDiv.style("height", "auto");
    deathDiv.style("min-height", "20%");
    deathDiv.style("border", "2px solid black");
    deathDiv.style("border-radius", "10px");
    deathDiv.style("text-align", "center");
    deathDiv.style("padding", "20px");
    deathDiv.style("display", "flex");
    deathDiv.style("flex-direction", "column");
    deathDiv.style("align-items", "center");
    deathDiv.style("justify-content", "center");
    deathDiv.style("background-color", "rgba(0, 0, 0, 0.8)");

    let title = createP("Dead").parent(deathDiv);
    title.style("font-size", "28px");
    title.style("font-weight", "bold");
    title.style("color", "white");

    hardcoreNotice = createP("");
    hardcoreNotice.parent(deathDiv);
    hardcoreNotice.style("font-size", "16px");
    hardcoreNotice.style("color", "#ff5555");
    hardcoreNotice.style("margin-bottom", "8px");
    hardcoreNotice.hide();

    respawnButton = createButton("Respawn").parent(deathDiv);
    respawnButton.class("system-button");
    respawnButton.style("width", "80%");
    respawnButton.style("padding", "12px");
    respawnButton.style("margin", "10px auto");
    respawnButton.style("min-height", "48px");
    respawnButton.style("font-size", "clamp(14px, 3vw, 16px)");
    respawnButton.style("border-radius", "8px");
    respawnButton.style("cursor", "pointer");
    respawnButton.style("color", "white");
    respawnButton.style("background-color", "#4CAF50");
    respawnButton.style("border", "none");
    respawnButton.style("transition", "background-color 0.3s");
    respawnButton.mouseOver(() => respawnButton.style("background-color", "#45a049"));
    respawnButton.mouseOut(() => {
        const hardcore = !!window.isHardcoreServer;
        respawnButton.style("background-color", hardcore ? "#d32f2f" : "#4CAF50");
    });
    respawnButton.mousePressed(() => {
        const hardcore = !!window.isHardcoreServer;
        
        if (hardcore) {
            // Hardcore: redirect to main menu
            deathDiv.hide();
            gameState = "initial";
            location.reload();
            return;
        }
        
        // Normal respawn
        curPlayer.pos.x = random(-200 * TILESIZE, 200 * TILESIZE);
        curPlayer.pos.y = random(-200 * TILESIZE, 200 * TILESIZE);

        //load in some chunks for easy start
        let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
        for (let yOff = -1; yOff < 2; yOff++) {
            for (let xOff = -1; xOff < 2; xOff++) {
                testMap.getChunk(chunkPos.x + xOff, chunkPos.y + yOff);
            }
        }
        // Clear a small area around the player
        for (let y = -5; y < 5; y++) {
            for (let x = -5; x < 5; x++) {
                dig(curPlayer.pos.x + x * TILESIZE, curPlayer.pos.y + y * TILESIZE, 1, false);
                mine(curPlayer.pos.x + x * TILESIZE, curPlayer.pos.y + y * TILESIZE, 1, false);
            }
        }

        curPlayer.statBlock.stats.hp = 100;

        // Sync position through the batcher + send HP update
        if (typeof playerStateBatcher !== 'undefined') {
            playerStateBatcher.setPosition(curPlayer.pos);
            playerStateBatcher.setHolding(curPlayer.holding);
            playerStateBatcher.addUpdate("stats.hp", curPlayer.statBlock.stats.hp);
            playerStateBatcher.flushImmediate();
        }

        giveDefaultItems();
        curPlayer.invBlock.useTimer = 10;

        gameState = "playing";
        deathDiv.hide();
    });

    //disconnect button
    let disconnectButton = createButton("Disconnect").parent(deathDiv);
    disconnectButton.class("system-button");
    disconnectButton.style("width", "80%");
    disconnectButton.style("padding", "12px");
    disconnectButton.style("margin", "10px");
    disconnectButton.style("font-size", "16px");
    disconnectButton.style("border-radius", "8px");
    disconnectButton.style("cursor", "pointer");
    disconnectButton.style("color", "white");
    disconnectButton.style("background-color", "#333");
    disconnectButton.style("border", "none");
    disconnectButton.style("transition", "background-color 0.3s");
    disconnectButton.mouseOver(() => disconnectButton.style("background-color", "#555"));
    disconnectButton.mouseOut(() => disconnectButton.style("background-color", "#333"));
    disconnectButton.mousePressed(() => {
        // Save player data before disconnecting
        try {
            if (curPlayer && socket && socket.connected) {
                const playerData = {
                    invBlock: curPlayer.invBlock ? {
                        items: curPlayer.invBlock.items || {},
                        hotbar: curPlayer.invBlock.hotbar || ["","","","",""],
                        selectedHotBar: curPlayer.invBlock.selectedHotBar || 0,
                        equiped: curPlayer.invBlock.equiped || {}
                    } : null,
                    statBlock: curPlayer.statBlock || null,
                    pos: curPlayer.pos ? { x: curPlayer.pos.x, y: curPlayer.pos.y } : null,
                    teamId: curPlayer.teamId || null,
                    race: curPlayer.race || null,
                    color: curPlayer.color || 0,
                    name: curPlayer.name || null,
                    movesSlots: Array.isArray(curPlayer.movesSlots) ? curPlayer.movesSlots : null
                };
                console.log('[Disconnect] Saving player data:', playerData);
                socket.emit('save_player_state', playerData);
                socket.disconnect();
            }
        } catch (e) {
            console.error('[Disconnect] Error during save:', e);
        }
        deathDiv.hide();
        // Always reload — delay lets the final packets flush
        setTimeout(() => { location.reload(); }, 150);
    });
}

// Show death UI with hardcore-aware button
function showDeathUI() {
    if (!deathDiv) return;
    
    // Don't show death UI in main menu or other non-play states
    if (!curPlayer) return;
    const nonPlayStates = [
        "initial",
        "server_select",
        "race_select",
        "race_selection",
        "settings",
        undefined,
        null
    ];
    if (nonPlayStates.includes(gameState)) {
        // turn off
        deathDiv.hide();
        return;
    };
    
    const hardcore = !!window.isHardcoreServer;
    
    if (hardcore) {
        respawnButton.html("☠ Restart");
        respawnButton.style("background-color", "#d32f2f");
        hardcoreNotice.html("Permadeath server - character deleted");
        hardcoreNotice.show();
    } else {
        respawnButton.html("Respawn");
        respawnButton.style("background-color", "#4CAF50");
        hardcoreNotice.hide();
    }
    
    respawnButton.show();
    deathDiv.show();
}

var tutorialDiv;
var pages;
var currentTutorialPage = 0;
var seen = localStorage.getItem("tut_seen");
var pages = [];
var currentTutorialPage = 0;
var tutorialDiv;
var pageNumberText;

function defineTutorialUI() {
    // MAIN CONTAINER
    tutorialDiv = createDiv();
    tutorialDiv.id("tutorialDiv");
    tutorialDiv.class("container");
    applyStyle(tutorialDiv, {
        width: "50%",
        height: "50%",
        position: "absolute",
        top: "0", left: "0", bottom: "0", right: "0",
        margin: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px",
    });
    tutorialDiv.hide();

    // TOP BAR (close button)
    let topBar = createDiv().parent(tutorialDiv);
    applyStyle(topBar, {
        display: "flex",
        width: "100%",
        justifyContent: "flex-end",
    });
    let closeButton = createImg("images/ui/x.png", "").parent(topBar);
    closeButton.id("tutorialCloseBtn");
    closeButton.addClass("icon-btn");
    applyStyle(closeButton, {
        width: "36px",
        height: "36px",
        padding: "6px",
        cursor: "pointer",
        imageRendering: "pixelated",
        touchAction: "manipulation",
    });
    closeButton.mousePressed(() => {
        gameState = "playing";
        curPlayer.invBlock.useTimer = 10;
        tutorialDiv.hide();
    });

    // PAGE HOLDER
    let pageHolder = createDiv().parent(tutorialDiv);
    pageHolder.class("tutorial-content");
    applyStyle(pageHolder, {
        flexGrow: "1",
        width: "100%",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
    });

    // BOTTOM BAR
    let bottomBar = createDiv().parent(tutorialDiv);
    applyStyle(bottomBar, {
        display: "flex",
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
    });

    // ← BUTTON WRAPPER
    let leftDiv = createDiv().parent(bottomBar);
    applyStyle(leftDiv, {
        flex: "1",
        display: "flex",
        justifyContent: "flex-start",
    });
    let leftButton = createButton("<").parent(leftDiv);
    leftButton.class("tutorial-nav-btn");

    // PAGE NUMBER WRAPPER
    let centerDiv = createDiv().parent(bottomBar);
    applyStyle(centerDiv, {
        flex: "1",
        display: "flex",
        justifyContent: "center",
    });
    pageNumberText = createP("").parent(centerDiv);
    pageNumberText.class("tutorial-page-number");

    // → BUTTON WRAPPER
    let rightDiv = createDiv().parent(bottomBar);
    applyStyle(rightDiv, {
        flex: "1",
        display: "flex",
        justifyContent: "flex-end",
    });
    let rightButton = createButton(">").parent(rightDiv);
    rightButton.class("tutorial-nav-btn");

    // NAVIGATION LOGIC
    leftButton.mousePressed(() => {
        pages[currentTutorialPage].hide();
        currentTutorialPage = (currentTutorialPage - 1 + pages.length) % pages.length;
        pages[currentTutorialPage].show();
        updatePageNumber();
    });
    rightButton.mousePressed(() => {
        pages[currentTutorialPage].hide();
        currentTutorialPage = (currentTutorialPage + 1) % pages.length;
        pages[currentTutorialPage].show();
        updatePageNumber();
    });

    // SETUP PAGES
    setupTutorialPages(pageHolder);
    updatePageNumber();
}


function setupTutorialPages(pageHolder) {
    // --- Page 1 ---
    let page1 = createDiv().parent(pageHolder);

    let skipText = createP("Press X above to skip").parent(page1);
    skipText.class("tutorial-title");

    addTutorialStep(page1, "images/items/shovel1.png", "You can dig with an empty hand or shovel.");
    addTutorialStep(page1, "images/items/apple.png", "Any type of food will heal you.");
    addTutorialStep(page1, "images/ui/dirtbag.png", "Don't fill your dirt bag unless you know where to empty it.");
    addTutorialStep(page1, "images/items/sword1.png", "Use your sword to break things.");
    addTutorialStep(page1, "images/ui/f_tutorial_icon.png", "Move your mouse close to objects to interact with them (F key).");
    pages.push(page1);

    // --- Page 2 ---
    let page2 = createDiv().parent(pageHolder);
    let controlsTitle = createP("Controls:").parent(page2);
    controlsTitle.class("tutorial-section-title");

    keyToVisualKey(Controls_Up_key);
    keyToVisualKey(Controls_Left_key);
    keyToVisualKey(Controls_Down_key);
    keyToVisualKey(Controls_Right_key);
    //console.log(Controls_Up_key, Controls_Left_key)
    addControlStep(page2, "" + Controls_Up_key + Controls_Left_key + Controls_Down_key + Controls_Right_key, "Move around");
    addControlStep(page2, "Left/Right Click", "Use item");
    addControlStep(page2, Controls_Dash_key, "Dash");
    addControlStep(page2, Controls_Interact_key, "Interact");
    addControlStep(page2, Controls_MoveHotBarLeft_key + "&" + Controls_MoveHotBarRight_key + " / Mouse Wheel", "Switch Hotbar slot");
    addControlStep(page2, Controls_Build_key, "Build menu");
    addControlStep(page2, "ESC", "Pause");
    addControlStep(page2, "TAB", "Leaderboard");
    addControlStep(page2, Controls_Inventory_key, "Inventory");
    addControlStep(page2, Controls_Crafting_key, "Crafting");
    addControlStep(page2, Controls_Space_key, "Do stuff in Inventory");

    page2.hide();
    pages.push(page2);
}

function addTutorialStep(parent, imgPath, text) {
    let step = createDiv().parent(parent);
    step.class("tutorial-step");
    applyStyle(step, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "15px",
    });
    let img = createImg(imgPath).parent(step);
    img.style("width", "50px");
    img.style("height", "50px");
    img.style("image-rendering", "pixelated");
    let label = createP(text).parent(step);
    label.class("tutorial-label");
    applyStyle(label, {
        marginTop: "5px",
        fontSize: "14px",
    });
}

function addControlStep(parent, control, description) {
    let key =keyToVisualKey(control);
    let line = createP(key + " - " + description).parent(parent);
    line.class("tutorial-label");
    applyStyle(line, {
        marginBottom: "5px",
        fontSize: "14px",
    });
}

function updatePageNumber() {
    pageNumberText.html(`Page ${currentTutorialPage + 1} of ${pages.length}`);
}

var popups = [];

class Popup {
    constructor(img, text, lifespan, x, y, rarity) {
        this.img = img;
        this.txt = text;
        this.lifespan = lifespan;
        this.pos = createVector(x, y);
        this.deleteTag = false;
        this.yOffset = 0;
        this.h = 50;
        this.rarity = rarity;
    }

    render(i) {
        if (this.lifespan <= 0) {
            this.h -= 5;
            if (this.h <= 0) {
                this.deleteTag = true;
                return;
            }
        }

        this.lifespan -= 1;

        this.yOffset = 0;
        for (let j = 0; j < i; j++) {
            if (this.pos.x == popups[j].pos.x && (this.pos.y + this.yOffset) == (popups[j].pos.y + popups[j].yOffset)) {
                this.yOffset = popups[j].yOffset + popups[j].h;
            }
        }
        push();
        textSize(20);
        beginClip();
        rect(this.pos.x, this.pos.y + this.yOffset, 50 + 5 + textWidth(this.txt), this.h);
        endClip();
        fill(0);
        stroke(255);
        strokeWeight(2);
        rect(this.pos.x, this.pos.y + this.yOffset - (50 - this.h), 50 + 5 + textWidth(this.txt), 50, 10);

        // Set text color to item rarity
        if (typeof getItemRarityRGB === 'function') {
            const rgb = getItemRarityRGB(this.rarity);
            fill(rgb[0], rgb[1], rgb[2]);
        } else {
            fill(255);
        }
        noStroke();
        textAlign(CENTER, CENTER);
        text(this.txt, this.pos.x + 50 - 5 + textWidth(this.txt) / 2, this.pos.y + 25 + this.yOffset - (50 - this.h));

        image(this.img, this.pos.x, this.pos.y + this.yOffset - (50 - this.h), 50, 50);
        pop();
    }
}

function renderPopups() {
    for (let i = 0; i < popups.length; i++) {
        popups[i].render(i);
    }
    //loop through popups backwards so we can remove them
    for (let i = popups.length - 1; i >= 0; i--) {
        if (popups[i].deleteTag) {
            popups.splice(i, 1);
        }
    }
}





var signDiv;
var signTextDiv;

function defineSignUI(){
    signDiv = createDiv();
    signDiv.class("container");
    applyStyle(signDiv, {
        position: "absolute",
        top: "45%",
        left: "55%",
        transform: "translate(-50%, -50%)",
        display: "none",
        height: "70%",
        width: "50%",
        padding: "13px"
    });

    let topBar = createDiv().parent(signDiv);

    applyStyle(topBar, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    });

    let title = createP("Sign Editor").parent(topBar);
    title.class("inventory-title");

    // Close Button (image X)
    let closeButton = createImg("images/ui/x.png", "").parent(topBar);
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

        //grab the text from the txt inputs
        for(let i=0; i<signTextDiv.elt.children.length; i++){
            curPlayer.sign.txt[i] = signTextDiv.elt.children[i].value;
        }
        //send across server
        let chunkPos = testMap.globalToChunk(curPlayer.sign.pos.x,curPlayer.sign.pos.y);
        socket.emit("update_obj", {
            cx: chunkPos.x, 
            cy: chunkPos.y, 
            objName: curPlayer.sign.objName, 
            pos: {x: curPlayer.sign.pos.x, y: curPlayer.sign.pos.y}, 
            z: curPlayer.sign.z, 
            update_name: "txt", 
            update_value: curPlayer.sign.txt
        });
        curPlayer.sign = undefined;

        signDiv.hide(); // Hides the inventory when clicked
    });

    signTextDiv = createDiv();
    signTextDiv.id("Sign_Text_Div");
    signTextDiv.style("display", "flex");
    signTextDiv.style("flex-direction", "column");
    signTextDiv.style("margin", "10px");
    signTextDiv.style("overflow-y", "scroll");
    signTextDiv.style("height", "89%");
    signTextDiv.parent(signDiv);

    updateSignUI([]);

    let bottomBar = createDiv().parent(signDiv);
    applyStyle(bottomBar, {
        display: "flex",
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
    });

    addLineButton = createButton("+");
    addLineButton.parent(bottomBar);
    addLineButton.mousePressed(() => {
        txtInput = createInput("");
        txtInput.style("padding", "3px");
        txtInput.style("border-radius", "5px");
        txtInput.style("text-align", "center");
        txtInput.style("color", "#fff");
        txtInput.style("background-color", "#222");
        txtInput.parent(signTextDiv);
    });
}

function updateSignUI(txt){
    signTextDiv.html("");
    for(let i=0; i<txt.length; i++){
        txtInput = createInput(txt[i]);
        txtInput.style("padding", "3px");
        txtInput.style("border-radius", "5px");
        txtInput.style("text-align", "center");
        txtInput.style("color", "#fff");
        txtInput.style("background-color", "#222");
        txtInput.parent(signTextDiv);
    }
    if(txt.length == 0){
        txtInput = createInput("");
        txtInput.style("padding", "3px");
        txtInput.style("border-radius", "5px");
        txtInput.style("text-align", "center");
        txtInput.style("color", "#fff");
        txtInput.style("background-color", "#222");
        txtInput.parent(signTextDiv);
    }
}

// HTML-based player profile panel
function renderPlayerProfile() {
    let profilePanel = select('#playerProfilePanel');
    
    if (!viewingPlayerProfile) {
        if (profilePanel) profilePanel.hide();
        return;
    }
    
    const player = viewingPlayerProfile;
    if (!player || !player.statBlock) {
        viewingPlayerProfile = null;
        if (profilePanel) profilePanel.hide();
        return;
    }
    
    // Create panel if doesn't exist
    if (!profilePanel) {
        profilePanel = createDiv();
        profilePanel.id('playerProfilePanel');
        profilePanel.style('position', 'fixed');
        profilePanel.style('top', '50%');
        profilePanel.style('left', '50%');
        profilePanel.style('transform', 'translate(-50%, -50%)');
        profilePanel.style('width', '400px');
        profilePanel.style('max-height', '80vh');
        profilePanel.style('background', 'rgba(0, 0, 0, 0.95)');
        profilePanel.style('border', '3px solid #444');
        profilePanel.style('border-radius', '10px');
        profilePanel.style('padding', '20px');
        profilePanel.style('z-index', '1000');
        profilePanel.style('overflow-y', 'auto');
        profilePanel.style('box-shadow', '0 0 30px rgba(0,0,0,0.8)');
        profilePanel.style('color', 'white');
        profilePanel.style('font-family', 'Arial, sans-serif');
    }
    
    // Rebuild content
    profilePanel.html('');
    
    // Close button
    let closeBtn = createButton('\u2715');
    closeBtn.parent(profilePanel);
    closeBtn.style('position', 'absolute');
    closeBtn.style('top', '10px');
    closeBtn.style('right', '10px');
    closeBtn.style('background', 'rgba(255, 0, 0, 0.7)');
    closeBtn.style('border', 'none');
    closeBtn.style('color', 'white');
    closeBtn.style('font-size', '20px');
    closeBtn.style('width', '30px');
    closeBtn.style('height', '30px');
    closeBtn.style('border-radius', '5px');
    closeBtn.style('cursor', 'pointer');
    closeBtn.mousePressed(() => {
        viewingPlayerProfile = null;
    });
    
    // Player name
    let nameDiv = createDiv(player.name);
    nameDiv.parent(profilePanel);
    nameDiv.style('font-size', '28px');
    nameDiv.style('font-weight', 'bold');
    nameDiv.style('text-align', 'center');
    nameDiv.style('margin-bottom', '15px');
    nameDiv.style('color', '#FFD700');
    
    // Race
    let raceDiv = createDiv(`Race: ${races[player.race]}`);
    raceDiv.parent(profilePanel);
    raceDiv.style('text-align', 'center');
    raceDiv.style('font-size', '18px');
    raceDiv.style('margin-bottom', '10px');
    raceDiv.style('color', '#AAA');
    
    // Level and XP
    let levelDiv = createDiv(`Level ${player.statBlock.level}`);
    levelDiv.parent(profilePanel);
    levelDiv.style('font-size', '20px');
    levelDiv.style('text-align', 'center');
    levelDiv.style('margin-bottom', '5px');
    
    // XP Bar
    let xpContainer = createDiv();
    xpContainer.parent(profilePanel);
    xpContainer.style('width', '100%');
    xpContainer.style('height', '25px');
    xpContainer.style('background', '#333');
    xpContainer.style('border', '2px solid #666');
    xpContainer.style('border-radius', '5px');
    xpContainer.style('position', 'relative');
    xpContainer.style('margin-bottom', '20px');
    
    let xpFill = createDiv();
    xpFill.parent(xpContainer);
    let xpPercent = (player.statBlock.xp / player.statBlock.xpNeeded) * 100;
    xpFill.style('width', xpPercent + '%');
    xpFill.style('height', '100%');
    xpFill.style('background', 'linear-gradient(90deg, #00ff00, #00aa00)');
    xpFill.style('border-radius', '3px');
    xpFill.style('transition', 'width 0.3s');
    
    let xpText = createDiv(`${player.statBlock.xp} / ${player.statBlock.xpNeeded} XP`);
    xpText.parent(xpContainer);
    xpText.style('position', 'absolute');
    xpText.style('top', '50%');
    xpText.style('left', '50%');
    xpText.style('transform', 'translate(-50%, -50%)');
    xpText.style('font-size', '14px');
    xpText.style('font-weight', 'bold');
    xpText.style('color', 'white');
    xpText.style('text-shadow', '1px 1px 2px black');
    
    // Stats section
    let statsTitle = createDiv('Statistics');
    statsTitle.parent(profilePanel);
    statsTitle.style('font-size', '22px');
    statsTitle.style('font-weight', 'bold');
    statsTitle.style('margin-top', '15px');
    statsTitle.style('margin-bottom', '10px');
    statsTitle.style('border-bottom', '2px solid #666');
    statsTitle.style('padding-bottom', '5px');
    
    // Stats grid
    let statsGrid = createDiv();
    statsGrid.parent(profilePanel);
    statsGrid.style('display', 'grid');
    statsGrid.style('grid-template-columns', '1fr 1fr');
    statsGrid.style('gap', '10px');
    statsGrid.style('margin-bottom', '15px');
    
    const stats = player.statBlock.stats;
    const statEntries = [
        ['HP', `${Math.floor(stats.hp)}/${stats.mhp}`],
        ['MP', `${Math.floor(stats.mp)}/${stats.mmp}`],
        ['Attack', stats.attack],
        ['Defense', stats.defense],
        ['Magic', stats.magic],
        ['Speed', stats.runningSpeed.toFixed(2)],
        ['HP Regen', stats.healthRegen],
        ['Dig Speed', stats.handDigSpeed]
    ];
    
    statEntries.forEach(([label, value]) => {
        let statDiv = createDiv();
        statDiv.parent(statsGrid);
        statDiv.style('background', 'rgba(255, 255, 255, 0.1)');
        statDiv.style('padding', '8px');
        statDiv.style('border-radius', '5px');
        statDiv.style('border', '1px solid #555');
        
        let statLabel = createDiv(label + ':');
        statLabel.parent(statDiv);
        statLabel.style('font-size', '14px');
        statLabel.style('color', '#AAA');
        statLabel.style('margin-bottom', '3px');
        
        let statValue = createDiv(value);
        statValue.parent(statDiv);
        statValue.style('font-size', '18px');
        statValue.style('font-weight', 'bold');
        statValue.style('color', '#0F0');
    });
    
    // Team info
    if (player.teamId && window.allTeams && window.allTeams[player.teamId]) {
        const team = window.allTeams[player.teamId];
        let teamDiv = createDiv(`Team: ${team.name}`);
        teamDiv.parent(profilePanel);
        teamDiv.style('font-size', '18px');
        teamDiv.style('margin-top', '15px');
        teamDiv.style('padding', '10px');
        teamDiv.style('background', `rgba(${team.color.r}, ${team.color.g}, ${team.color.b}, 0.2)`);
        teamDiv.style('border', `2px solid rgb(${team.color.r}, ${team.color.g}, ${team.color.b})`);
        teamDiv.style('border-radius', '5px');
        teamDiv.style('text-align', 'center');
    }
    
    // Combat stats
    let combatTitle = createDiv('Combat Stats');
    combatTitle.parent(profilePanel);
    combatTitle.style('font-size', '22px');
    combatTitle.style('font-weight', 'bold');
    combatTitle.style('margin-top', '20px');
    combatTitle.style('margin-bottom', '10px');
    combatTitle.style('border-bottom', '2px solid #666');
    combatTitle.style('padding-bottom', '5px');
    
    let killsDiv = createDiv(`Kills: ${player.kills || 0}`);
    killsDiv.parent(profilePanel);
    killsDiv.style('font-size', '16px');
    killsDiv.style('margin-bottom', '5px');
    
    let deathsDiv = createDiv(`Deaths: ${player.statBlock.deaths || 0}`);
    deathsDiv.parent(profilePanel);
    deathsDiv.style('font-size', '16px');
    
    profilePanel.show();
}