// Main menu globals moved to mainMenu.js
// This file focuses on in-game UI only

// Lightweight perf toggle; enable with `window.__perfLog = true`
window.__perfLog = window.__perfLog ?? false;

function perfTimed(label, fn) {
    if (!window.__perfLog) return fn();
    const t0 = performance.now();
    const res = fn();
    const t1 = performance.now();
    console.log(`[perf] ${label}: ${(t1 - t0).toFixed(2)}ms`);
    return res;
}

function updateResponsiveDesign() {
    // Update positions for in-game UI elements
    if (typeof dirtBagUI !== 'undefined') {
        dirtBagUI.pos = createVector(width - 180 - 10, height - 186 - 10);
    }

    if (typeof timerDiv !== 'undefined') {
        timerDiv.position(width / 2 - 50, 10);
    }
}
// Function to render buttons instead of links
// Main menu link functions moved to mainMenu.js

// Server browser UI functions moved to mainMenu.js

// Show the selection UI elements
function drawSelection() {
    raceContainer.style("display", "flex");
    // ---------------------------------------------------
    //  Create Title (centered, larger & responsive)
    // ---------------------------------------------------
    raceTitle.id("raceTitle");
    raceTitle.elt.innerHTML = "Select Your Race"
    raceTitle.style("position", "absolute");
    raceTitle.style("top", "min(25%, 30dvh)");

    raceTitle.style("left", "50%");
    raceTitle.style("transform", "translateX(-50%)");
    raceTitle.style("max-width", "90vw");
    raceTitle.style("white-space", "normal");

    // Responsive font size (combining viewport and fixed pixels)
    raceTitle.style("font-size", "calc(1.5vw + 12px)");
    if (window.innerWidth < 480) {
        raceTitle.style("font-size", "calc(1vw + 10px)");
    }

    raceTitle.style("font-weight", "bold");
    raceTitle.style("color", "#fff");
    raceTitle.style("text-shadow", "1px 1px 2px #000");
    raceTitle.style("padding", "10px 20px");
    raceTitle.style("background-color", "rgba(0, 0, 0, 0.3)");
    raceTitle.style("border-radius", "10px");
    raceTitle.style("text-align", "center");

    nameInput.show();
    goButton.show();


    //back to server selection button
    race_back_button.innerHTML = " <- Back"

    race_back_button.style("font-size", "20px");
    race_back_button.style("color", "#fff");
    race_back_button.style("border", "none");
    race_back_button.style("border-radius", "8px");
    race_back_button.style("position", "absolute");
    race_back_button.style("top", "50dvh");

    race_back_button.mousePressed(() => {
        //console.log("pressed")
        hideRaceSelect()
        gameState = "initial"
    })

    race_back_button.show();
    race_back_button.parent(raceContainer);
    raceButtons.forEach((card) => {
        card.show();
    });
    // Enable the "Go" button only when a race is selected and a name is entered

}

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
    nameBtn.style('background', 'none');
    nameBtn.style('border', 'none');
    nameBtn.style('padding', '0');
    nameBtn.style('font-size', '20px');
    nameBtn.style('cursor', 'pointer');
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
}


// Global variables for chat UI elements and player count display
let chatContainer, chatMessagesBox, chatInput, chatSendButton;
let chatRendered = false;
let toggleChatButton; // Button to collapse/expand chat
let inputContainer;   // Reference to hide/show input container
let isChatOpen = true; // Track whether the chat is currently open or collapsed

function renderChatUI() {
    if (chatRendered) return;
    chatRendered = true;

    // Create chat container positioned at bottom-left
    chatContainer = createDiv();
    chatContainer.class("container");
    chatContainer.style("position", "fixed");
    chatContainer.style("bottom", "0dvh");
    chatContainer.style("left", "0dvw");
    chatContainer.style("z-index", "10");
    chatContainer.style("min-width", "10dvw");

    chatContainer.style("max-width", "30dvw");
    chatContainer.style("background", "rgba(34, 34, 34, 0.8)"); // Semi-transparent dark background
    chatContainer.style("padding", "10px");
    chatContainer.style("border-radius", "8px");
    chatContainer.style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.4)"); // Soft shadow
    chatContainer.style("backdrop-filter", "blur(5px)"); // Blurred background (if supported)
    chatContainer.style("pointer-events", "auto"); // Ensure clicks go through

    // ─────────────────────────────────────────────────────────
    // Toggle Button (Collapses/Expands the chat area)
    // ─────────────────────────────────────────────────────────

    toggleChatButton = createButton("");
    toggleChatButton.id("chatToggle")
    toggleChatButton.parent(chatContainer);
    toggleChatButton.style("width", "100%");
    toggleChatButton.style("background", "#555");
    toggleChatButton.style("color", "#fff");
    toggleChatButton.style("border", "none");
    toggleChatButton.style("border-radius", "5px");
    toggleChatButton.style("cursor", "pointer");
    toggleChatButton.style("margin-bottom", "5px");
    toggleChatButton.style("padding", "6px");
    toggleChatButton.mousePressed(toggleChatDropdown);

    // Update the button text immediately on creation
    updateToggleChatButtonText();

    // ─────────────────────────────────────────────────────────
    // Container for messages
    // ─────────────────────────────────────────────────────────

    chatMessagesBox = createDiv();
    chatMessagesBox.style("height", "15dvh");
    chatMessagesBox.style("overflow-y", "auto");
    chatMessagesBox.style("background-color", "#333");
    chatMessagesBox.style("color", "#fff");
    chatMessagesBox.style("padding", "8px");
    chatMessagesBox.style("border-radius", "5px");
    chatMessagesBox.style("margin-bottom", "10px");
    chatMessagesBox.style("justify-content", "left");

    // ─────────────────────────────────────────────────────────
    // Input Field
    // ─────────────────────────────────────────────────────────

    chatInput = createInput("");
    chatInput.attribute("placeholder", "Type your message...");
    chatInput.style("flex", "1");
    chatInput.style("padding", "3px");
    chatInput.style("border-radius", "5px");
    chatInput.style("outline", "none");
    chatInput.style("color", "#fff");
    chatInput.style("background-color", "#222");
    chatInput.style("margin-right", "5px");
    chatInput.mousePressed(() => {
        lastGameState = gameState + "";
        gameState = "chating";
    });
    chatInput.elt.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            sendChatMessage();
            gameState = lastGameState;
        }
    });


    chatSendButton = createButton("Send");
    chatSendButton.style("padding", "8px 14px");
    chatSendButton.style("border", "none");
    chatSendButton.style("border-radius", "5px");
    chatSendButton.style("background-color", "#4caf50");
    chatSendButton.style("color", "#fff");
    chatSendButton.style("cursor", "pointer");

    chatSendButton.style("min-width", "5dvw");
    chatSendButton.mousePressed(() => {
        blurActiveElement();
        sendChatMessage();
        gameState = lastGameState;
    });


    inputContainer = createDiv();
    inputContainer.style("display", "flex");
    inputContainer.style("align-items", "center");
    inputContainer.child(chatInput);
    inputContainer.child(chatSendButton);

    // Append everything to the main chat container
    chatContainer.child(chatMessagesBox);
    chatContainer.child(inputContainer);

    // Finally, append chat container to the document body
    chatContainer.parent(document.body);
}

// ─────────────────────────────────────────────────────────
// Toggle Function: Collapses/Expands the Chat
// ─────────────────────────────────────────────────────────

function toggleChatDropdown() {
    if (isChatOpen) {
        // Hide the messages box and input
        chatMessagesBox.hide();
        inputContainer.hide();
    } else {
        // Show the messages box and input
        chatMessagesBox.show();
        inputContainer.show();
    }
    isChatOpen = !isChatOpen;
    // Update the button text after toggling
    updateToggleChatButtonText();
}


// startGame function moved to mainMenu.js

// ─────────────────────────────────────────────────────────
// Update the toggle button text (includes player count)
// ─────────────────────────────────────────────────────────

function updateToggleChatButtonText() {
    // Calculate player count
    const playerCount = Object.keys(players).length + 1;
    // Set arrow and text depending on state
    const arrow = isChatOpen ? "▼" : "▲";
    toggleChatButton.html(`Chat (Players: ${playerCount}) ${arrow}`);
}

// Function to update the player count display when players change
function updatePlayerCount() {

    const playerCount = Object.keys(players).length + 1;

    const arrow = isChatOpen ? "▼" : "▲";
    if (toggleChatButton != undefined) toggleChatButton.html(`Chat (Players: ${playerCount}) ${arrow}`);

}

// Function to send a chat message via socket
function sendChatMessage() {
    let message = chatInput.value();
    if (message.trim() === "") return; // Avoid sending empty messages

    // Retrieve player position (adjust if you store the player's position differently)
    let x = curPlayer && curPlayer.pos ? curPlayer.pos.x : 0;
    let y = curPlayer && curPlayer.pos ? curPlayer.pos.y : 0;

    // Format data: "x,y,message"
    let data = `${x},${y},${message}`;

    // Emit the chat message to the server
    if (socket) {
        socket.emit("send_message", data);
    }

    // Clear the input after sending
    chatInput.value("");
}


// Function to send a chat message via socket
function sendChatMessage() {
    let message = chatInput.value();
    if (message.trim() === "") return; // Avoid sending empty messages

    // Retrieve player position (adjust if you store the player's position differently)
    let x = curPlayer && curPlayer.pos ? curPlayer.pos.x : 0;
    let y = curPlayer && curPlayer.pos ? curPlayer.pos.y : 0;

    // Format data: "x,y,message"
    let data = `${x},${y},${message}`;

    // Emit the chat message to the server
    if (socket) {
        socket.emit("send_message", data);
    }
    // Clear the input after sending
    chatInput.value("");
}

function formatChatTimestamp(rawTime) {
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    let d = rawTime ? new Date(rawTime) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Helper function to add a chat message to the messages box
function addChatMessage(chatMsg) {
    if (!chatContainer) return

    //console.log(chatMsg)

    if (!chatMsg.user) {
        chatMsg.user = "SERVER"
    }
    const timeString = formatChatTimestamp(chatMsg.time);

    // Create a container for the entire message (text + time)
    let msgContainer = createDiv();
    msgContainer.style("display", "flex");
    msgContainer.style("align-items", "center");
    msgContainer.style("margin-bottom", "6px");

    // Create a text container with the user & message
    let textContainer = createDiv(`<strong>${chatMsg.user}:</strong> ${chatMsg.message}`);
    textContainer.style("color", "#fff");
    textContainer.style("background-color", "#333");
    textContainer.style("padding", "6px 8px");
    textContainer.style("border-radius", "5px 0 0 5px"); // Rounded left corners
    textContainer.style("flex", "1"); // Let this container expand
    textContainer.style("font-size", "0.9em");

    // Create a time container in a smaller box
    let timeDiv = createDiv(timeString);
    timeDiv.style("background-color", "#555");
    timeDiv.style("color", "#ccc");
    timeDiv.style("padding", "6px 8px");
    timeDiv.style("border-radius", "0 5px 5px 0"); // Rounded right corners
    timeDiv.style("margin-left", "4px");
    timeDiv.style("font-size", "0.8em");
    timeDiv.style("white-space", "nowrap"); // Ensure the time doesn't wrap to a new line

    // Add both containers to the main message container
    msgContainer.child(textContainer);
    msgContainer.child(timeDiv);

    // Add the message container to the messages box
    chatMessagesBox.child(msgContainer);

    // Scroll to the bottom of the messages box
    chatMessagesBox.elt.scrollTop = chatMessagesBox.elt.scrollHeight;
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
            // PERF FIX #10: Use fast highlight instead of full DOM rebuild after transfer
            fastHighlightSwapLists(curPlayer.invBlock.curItem, curPlayer.otherInv.invBlock.curItem);
            updatecurSwapItemDiv(curPlayer.otherInv.invBlock);

            // Sync other inventory back to server when clicking the spacebar UI (mirror keyboard handler)
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
// Simple virtualized list helpers
const VLIST_BUFFER_ROWS = 5;
function computeVisibleRange(container, total, rowH){
    const st = container.elt.scrollTop || 0;
    const vh = container.elt.clientHeight || 300;
    let start = Math.max(0, Math.floor(st / rowH) - VLIST_BUFFER_ROWS);
    let count = Math.ceil(vh / rowH) + 2*VLIST_BUFFER_ROWS;
    let end = Math.min(total, start + count);
    return { start, end };
}

function ensureListViewport(div){
    div.style('overflow-y', 'auto');
    div.style('position', 'relative');
    if(!div.elt._spacer){
        const spacer = document.createElement('div');
        spacer.style.position = 'absolute';
        spacer.style.left = '0';
        spacer.style.top = '0';
        spacer.style.width = '1px';
        spacer.style.height = '0px';
        spacer.style.pointerEvents = 'none';
        div.elt.appendChild(spacer);
        div.elt._spacer = spacer;
    }
}

function renderVirtualRows(div, data, rowH, renderRow){
    ensureListViewport(div);
    if(div.elt._spacer) div.elt._spacer.style.height = (data.length * rowH) + 'px';
    const range = computeVisibleRange(div, data.length, rowH);
    // Clear existing children except spacer
    const kids = Array.from(div.elt.children);
    for(const k of kids){ if(k !== div.elt._spacer) k.remove(); }
    for(let i = range.start; i < range.end; i++){
        const row = renderRow(data[i], i);
        row.style('position', 'absolute');
        row.style('top', (i * rowH) + 'px');
        row.parent(div);
    }
}

function updateItemList() {
    if (!curPlayer) return;
    // Reset container; virtualization will rebuild visible rows
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
    const renderRow = (itemName) => {
        let itemDiv = createDiv();
        itemDiv.attribute('data-item', itemName);
        itemDiv.style("width", "100%");
        itemDiv.style("height", ROW_H+"px");
        itemDiv.style("display", "flex");
        itemDiv.style("align-items", "center");
        itemDiv.style("justify-content", "center");
        itemDiv.style("border-bottom", "2px solid black");
        itemDiv.style("cursor", "pointer");
        itemDiv.mousePressed(() => {
            curPlayer.invBlock.curItem = itemName;
            highlightItemList();
            perfTimed('updatecurItemDiv', () => updatecurItemDiv());
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
        return itemDiv;
    };
    renderVirtualRows(itemListDiv, arr, ROW_H, renderRow);
    // Attach scroll handler once
    if(!itemListDiv.elt._vscrollInv){
        itemListDiv.elt._vscrollInv = true;
        itemListDiv.elt.addEventListener('scroll', () => {
            renderVirtualRows(itemListDiv, arr, ROW_H, renderRow);
            highlightItemList();
        });
    }
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

    let itemNameP = createP(curPlayer.invBlock.curItem);
    itemNameP.style("font-size", "20px");
    itemNameP.style("color", rarityColorCSS(curPlayer.invBlock.curItem));
    itemNameP.style("margin", "5px");
    itemNameP.parent(itemNameDiv);

    //create a div for the description
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

function renderDirtBagUI() {
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
        dirtBagUI.vel.x = ((width - 180 - 10) - dirtBagUI.pos.x);
        dirtBagUI.vel.y = ((height - 186 - 10) - dirtBagUI.pos.y);
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
    else if (curPlayer.invBlock.items[curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]].type == "Shovel") {
        if (dirtInv >= maxDirtInv - curPlayer.invBlock.items[curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]].digSpeed) {
            dirtBagOpen = false;
        }
    }
    else if (dirtInv >= maxDirtInv - DIGSPEED) {
        dirtBagOpen = false;
    }

    if (dirtBagOpen) image(dirtBagOpenImg, dirtBagUI.pos.x, dirtBagUI.pos.y, 180, 186);
    else image(dirtBagImg, dirtBagUI.pos.x, dirtBagUI.pos.y, 180, 186);

    fill("#70443C");
    rect(dirtBagUI.pos.x + 30, dirtBagUI.pos.y + 35 + (120 * (1 - (dirtInv / maxDirtInv))), 120, 120 * (dirtInv / maxDirtInv));

    if (!dirtBagOpen) {
        fill(255);
        stroke(0);
        strokeWeight(5);
        textAlign(CENTER, CENTER);
        textSize(50);
        text("Full", dirtBagUI.pos.x + 90, dirtBagUI.pos.y + 100);
    }
    pop();
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
    buildDiv.class("container");
    buildDiv.style("position", "absolute");
    buildDiv.style("bottom", "28%");
    buildDiv.style("left", "90%");
    buildDiv.style("transform", "translate(-50%, -50%)");
    buildDiv.style("display", "none");
    buildDiv.style("width", "10%");
    buildDiv.style("height", "10%");
    buildDiv.style("border", "2px solid black");
    buildDiv.style("border-radius", "10px");
    buildDiv.style("padding", "20px");

    // If you wanted smaller text, use font-size instead of text-size-adjusted
    buildDiv.style("font-size", "80%");

    // Enable scrolling when content overflows
    buildDiv.style("overflow-y", "scroll");
}

function renderBuildOptions() {
    buildDiv.html('');

    //console.log(buildOptions[curPlayer.invBlock.selectedHotBar].objName);
    let option = buildOptions[curPlayer.invBlock.selectedHotBar];
    if (!option) return;


    // Option name
    const nameDiv = createDiv(`Build: ${option.objName}`);
    nameDiv.style('font-size', '1rem');
    nameDiv.style('font-weight', 'bold');
    nameDiv.style('color', '#ccc');
    nameDiv.style('margin-bottom', '0.3rem');
    nameDiv.parent(buildDiv);

    // Cost details
    const costsDetailsDiv = createDiv();
    costsDetailsDiv.style('font-size', '0.85rem');
    costsDetailsDiv.style('margin-bottom', '0.25rem');
    costsDetailsDiv.parent(buildDiv);

    let canAfford = true;

    option.cost.forEach(([material, requiredAmount]) => {
        let playerHas = 0;
        if (material === "dirt") {
            playerHas = dirtInv;
        } else if (curPlayer.invBlock.items[material]) {
            playerHas = curPlayer.invBlock.items[material].amount;
        }
        // Make only the number colored
        const enough = playerHas >= requiredAmount;
        const line = createDiv(`${material}: <span style="color:${enough ? '#27f50e' : '#ff4444'};font-weight:bold">${playerHas}</span> / ${requiredAmount}`);
        line.style('color', '#ddd');
        line.style('margin-bottom', '0.1rem');
        if (!enough) canAfford = false;
        line.parent(costsDetailsDiv);
    });

    // Result message
    const affordMsg = createDiv(
        canAfford ? '' : 'Not enough resources!'
    );
    affordMsg.style('font-size', '0.9rem');
    affordMsg.style('font-weight', 'bold');
    affordMsg.style('margin-top', '0.2rem');
    affordMsg.style('color', canAfford ? '#27f50e' : '#ff4444');
    affordMsg.parent(buildDiv);
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
                <strong style="color: #27f50e;">HP:</strong> ${Math.floor(stats.hp)} / ${Math.floor(stats.mhp)}
                <div style="width: 100%; height: 10px; background: #333; border-radius: 5px; margin-top: 3px; overflow: hidden;">
                    <div style="width: ${(stats.hp / stats.mhp) * 100}%; height: 100%; background: linear-gradient(90deg, #27f50e, #1a9e0a); transition: width 0.3s;"></div>
                </div>
            </div>
            <div style="margin: 5px 0;">
                <strong style="color: #00d4ff;">MP:</strong> ${Math.floor(stats.mp)} / ${Math.floor(stats.mmp)}
                <div style="width: 100%; height: 10px; background: #333; border-radius: 5px; margin-top: 3px; overflow: hidden;">
                    <div style="width: ${(stats.mp / stats.mmp) * 100}%; height: 100%; background: linear-gradient(90deg, #00d4ff, #0080cc); transition: width 0.3s;"></div>
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




function renderPlayerCardUI() {
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

    image(hpBarImg, width - 530 + 93, 52, 281 * (curPlayer.statBlock.stats.hp / curPlayer.statBlock.stats.mhp), 14, 0, 0, 281 * (curPlayer.statBlock.stats.hp / curPlayer.statBlock.stats.mhp), 14);
    let heldItem = curPlayer.invBlock.items[curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]];
    if (buildMode || curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar] == "") {
        image(manaBarImg, width - 530 + 93, 83, 281 * (curPlayer.statBlock.stats.mp / curPlayer.statBlock.stats.mmp), 14, 0, 0, 281 * (curPlayer.statBlock.stats.mp / curPlayer.statBlock.stats.mmp), 14);
    }
    else if (heldItem.manaCost == 0 && heldItem.type == "Ranged") {
        //render ammo bar
        let ammoBarLength;
        if (heldItem.reloadBool) {
            ammoBarLength = (heldItem.reloadSpeed - curPlayer.invBlock.useTimer) / heldItem.reloadSpeed;
            if (curPlayer.invBlock.useTimer <= 0) {
                heldItem.reloadBool = false;
            }
        }
        else if (curPlayer.invBlock.items[heldItem.ammoName] == undefined) {
            ammoBarLength = 0.000000000001;
        }
        else if (curPlayer.invBlock.items[heldItem.ammoName].amount < heldItem.bulletsLeft) {
            ammoBarLength = curPlayer.invBlock.items[heldItem.ammoName].amount / heldItem.roundSize;
        }
        else {
            ammoBarLength = (heldItem.bulletsLeft / heldItem.roundSize);
        }
        image(ammoBarImg, width - 530 + 93, 83, 281 * ammoBarLength, 14, 0, 0, 281 * ammoBarLength, 14);
        stroke(0);
        strokeWeight(1);
        for (let i = 1; i < heldItem.roundSize; i++) {
            line(width - 530 + 93 + (281 * (i / heldItem.roundSize)), 83, width - 530 + 93 + (281 * (i / heldItem.roundSize)), 97);
        }
    }
    else {
        image(manaBarImg, width - 530 + 93, 83, 281 * (curPlayer.statBlock.stats.mp / curPlayer.statBlock.stats.mmp), 14, 0, 0, 281 * (curPlayer.statBlock.stats.mp / curPlayer.statBlock.stats.mmp), 14);
        stroke(0);
        strokeWeight(1);
        for (let i = 1; i < curPlayer.statBlock.stats.mmp / heldItem.manaCost; i++) {
            line(width - 530 + 93 + (281 * (i / (curPlayer.statBlock.stats.mmp / heldItem.manaCost))), 83, width - 530 + 93 + (281 * (i / (curPlayer.statBlock.stats.mmp / heldItem.manaCost))), 97);
        }
    }

    // Race portrait now rendered as HTML element - see defineRacePortrait()
    // let raceName = races[curPlayer.race];
    // image(raceImages[raceName].portrait, width - 30 - 115 + 6 + 7, 7, 98, 98);

    textFont(gameUIFont);
    textSize(20);
    strokeWeight(1);

    // Label: lvl
    fill(134);
    stroke(134);
    text("lvl", width - 530 + 6 + 10 + 10, 35);

    // Level number
    fill(0, 255, 0);
    stroke(0, 255, 0);
    text(curPlayer.statBlock.level + "   " + `${curPlayer.statBlock.xp} / ${curPlayer.statBlock.xpNeeded} XP`, width - 530 + 6 + 30 + 10 + 5, 35);


    text("HP:", width - 530 + 6 + 30, 70);
    if (buildMode) {
        fill(0, 255, 255);
        stroke(0, 255, 255);
        text("Mana:", width - 530 + 6 + 30, 100);
    }
    else if (curPlayer.invBlock.items[curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]]?.manaCost == 0 && curPlayer.invBlock.items[curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]].type == "Ranged") {
        fill(255, 255, 0);
        stroke(255, 255, 0);
        text("AMMO:", width - 530 + 6 + 15, 100);
    }
    else {
        fill(0, 255, 255);
        stroke(0, 255, 255);
        text("Mana:", width - 530 + 6 + 30, 100);
    }
    
    // Dash cooldown indicator - Boot icon
    push();
    let bootX = width - 530 + 6 + 30;
    let bootY = 125; // Moved lower
    
    if (curPlayer.dashCooldown > 0) {
        // Cooldown - show grayed out boot with cooldown overlay
        let cooldownPercent = curPlayer.dashCooldown / curPlayer.dashCooldownMax;
        
        // Boot icon placeholder (replace with sprite: bootIcon)
        fill(80, 80, 80);
        stroke(60, 60, 60);
        strokeWeight(2);
        rect(bootX, bootY - 8, 16, 16, 2);
        
        // Cooldown overlay
        fill(255, 100, 100, 150);
        noStroke();
        rect(bootX, bootY - 8, 16, 16 * cooldownPercent, 2);
        
    } else if (curPlayer.isDashing) {
        // Dashing - bright glowing boot
        fill(100, 255, 100);
        stroke(200, 255, 200);
        strokeWeight(3);
        rect(bootX, bootY - 8, 16, 16, 2);
    } else if (curPlayer.statBlock.stats.mp < curPlayer.dashManaCost) {
        // Not enough mana - red/dark boot
        fill(100, 30, 30);
        stroke(150, 50, 50);
        strokeWeight(2);
        rect(bootX, bootY - 8, 16, 16, 2);
        
        // X mark or low mana indicator
        stroke(200, 50, 50);
        strokeWeight(2);
        line(bootX + 4, bootY - 4, bootX + 12, bootY + 4);
        line(bootX + 12, bootY - 4, bootX + 4, bootY + 4);
    } else {
        // Ready - normal boot icon
        fill(150, 255, 150);
        stroke(100, 200, 100);
        strokeWeight(2);
        rect(bootX, bootY - 8, 16, 16, 2);
    }
    pop();
    
    //fill with team color
    let displayColor = teamColors[curPlayer.color];
    if (curPlayer.teamId && window.allTeams && window.allTeams[curPlayer.teamId]) {
        displayColor = window.allTeams[curPlayer.teamId].color;
    }
    fill(displayColor.r, displayColor.g, displayColor.b);
    stroke(displayColor.r, displayColor.g, displayColor.b);
    textAlign(CENTER, CENTER);
    
    // Update existing nameBtn instead of creating new one
    nameBtn.html(curPlayer.name);
    nameBtn.style('color', `rgb(${displayColor.r}, ${displayColor.g}, ${displayColor.b})`);
    
    // Position it EXACTLY where your text was
    let x = width - 530 + 6 + 45 + (350 / 2);
    let y = 19;
    nameBtn.position(x, y);
    nameBtn.show();

    let box = gameUIFont.textBounds(curPlayer.name, width - 530 + 6 + 45 + (350 / 2), 19);
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
        if (team.creator === curPlayer.id && pendingRequests.length > 0) {
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

    team.members.forEach(memberId => {
        if (players[memberId]) {
            let memberP = createP(`• ${players[memberId].name}${team.creator === memberId ? ' (Leader)' : ''}`);
            memberP.style("color", "white");
            memberP.style("margin", "3px 0");
            memberP.parent(teamContainer);
        }
    });

    // Team creator controls
    if (team.creator === curPlayer.id) {
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

    // Leave team button
    let leaveBtn = createButton(team.creator === curPlayer.id ? "Disband Team" : "Leave Team");
    leaveBtn.style("padding", "10px 20px");
    leaveBtn.style("background", "#f44336");
    leaveBtn.style("color", "white");
    leaveBtn.style("border", "none");
    leaveBtn.style("border-radius", "5px");
    leaveBtn.style("cursor", "pointer");
    leaveBtn.style("margin-top", "20px");
    leaveBtn.mousePressed(() => {
        if (confirm(team.creator === curPlayer.id ? "Disband team?" : "Leave team?")) {
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

    pendingRequests.forEach((request, idx) => {
        let reqDiv = createDiv();
        reqDiv.style("background", "rgba(255,255,255,0.1)");
        reqDiv.style("padding", "10px");
        reqDiv.style("margin", "5px 0");
        reqDiv.style("border-radius", "5px");
        reqDiv.style("display", "flex");
        reqDiv.style("justify-content", "space-between");
        reqDiv.style("align-items", "center");
        reqDiv.parent(requestsSection);

        let nameP = createP(request.playerName);
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
            socket.emit('accept_team_request', { teamId: curPlayer.teamId, playerId: request.playerId });
            pendingRequests.splice(idx, 1);
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
            socket.emit('deny_team_request', { teamId: curPlayer.teamId, playerId: request.playerId });
            pendingRequests.splice(idx, 1);
            updateTeamManagementUI();
        });
        denyBtn.parent(btnContainer);
    });
}

var swapInvDiv;
var itemListDivLeft;
var itemListDivRight;
var curSwapItemDiv;

function defineSwapInvUI() {
    swapInvDiv = createDiv();
    swapInvDiv.id("inventory");
    swapInvDiv.class("container");
    swapInvDiv.style("position", "absolute");
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

    // Current item details
    curSwapItemDiv = createDiv().parent(swapInvDivInnerds);
    curSwapItemDiv.class("item-details");

    let curSwapItemNone = createP("No Selected Item");
    curSwapItemNone.parent(curSwapItemDiv);
    curSwapItemNone.class("inventory-title");
    applyStyle(curSwapItemNone, {
        paddingTop: "7%",
        textDecoration: "none"
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
        swapInvDiv.hide(); // Hides the inventory when clicked
        spaceBarDiv.hide();
    });

    swapInvDiv.hide();
}

/**
 * @typedef {{ amount: number, imgNum?: number }} ItemEntry
 * @typedef {{ items: Record<string, ItemEntry>, curItem?: string }} Inventory
 */

/**
 * PERF FIX #9: Quickly update swap list highlighting without full DOM rebuild.
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
 * Rebuilds the two inventory columns for swapping between the current player and another inventory.
 * Never throws if an image/frame is missing; falls back to a text placeholder.
 *
 * @param {Inventory} otherInv
 */
/**
 * DEPRECATED: Old updateSwapItemLists - kept for reference only
 * This function caused major performance issues:
 * - 17+ .style() calls per item causing reflows
 * - Full DOM rebuild with .html("")
 * - Heavy nested DOM structure per item
 * 
 * USE: updateSwapItemLists() from swapInventory.js module instead
 * The new version uses CSS classes and smart partial updates
 * 
 * THIS FUNCTION IS DISABLED - DO NOT USE
 */
function updateSwapItemLists_DEPRECATED_FROZEN(otherInv) {
    return;  // Disabled - use swapInventory.js version instead

    // LEFT SIDE (current player)
    // DISABLED - this entire block caused severe freezing
    // The original code did 17+ .style() calls per item and full DOM rebuilds
    // See swapInventory.js for the optimized version
    /*
    itemListDivLeft.html("");

    /** @type {Record<string, ItemEntry>} */
    const myItems = curPlayer.invBlock.items || {};
    let arr = Object.keys(myItems);

    for (let i = 0; i < arr.length; i++) {
        const itemName = arr[i];
        const entry = myItems[itemName] || { amount: 0 };

        const itemDiv = createDiv();
        itemDiv.attribute('data-item', itemName);
        itemDiv.style("width", "100%");
        itemDiv.style("height", "50px");
        itemDiv.style("display", "flex");
        itemDiv.style("align-items", "center");
        itemDiv.style("justify-content", "center");
        itemDiv.style("border-bottom", "2px solid black");
        if (curPlayer.invBlock.curItem === itemName) {
            itemDiv.style("background-color", "rgb(120, 120, 120)");
            itemDiv.style("font-style", "italic");
        }
        itemDiv.style("cursor", "pointer");
        itemDiv.parent(itemListDivLeft);
        itemDiv.mousePressed(() => {
            curPlayer.invBlock.curItem = itemName;
            if (otherInv) otherInv.curItem = "";
            // PERF FIX #9: Update only highlights, skip full rebuild
            fastHighlightSwapLists(curPlayer.invBlock.curItem, safeOther.curItem);
            updatecurSwapItemDiv(otherInv);
        });

        const itemInfoDiv = createDiv();
        itemInfoDiv.style("width", "80%");
        itemInfoDiv.style("height", "50px");
        itemInfoDiv.style("display", "flex");
        itemInfoDiv.style("align-items", "center");
        itemInfoDiv.style("justify-content", "space-between");
        itemInfoDiv.parent(itemDiv);

        const imgDiv = createDiv();
        imgDiv.style("width", "32px");
        imgDiv.style("height", "32px");
        imgDiv.style("margin-right", "8px");
        imgDiv.style("display", "flex");
        imgDiv.style("align-items", "center");
        imgDiv.parent(itemInfoDiv);

        const urlLeft = resolveItemImgURL(itemName, entry);
        let imgEl;
        if (urlLeft) {
            imgEl = createImg(urlLeft, "");
            imgEl.style("width", "32px");
            imgEl.style("height", "32px");
            imgEl.style("image-rendering", "pixelated");
            imgEl.parent(imgDiv);
        } else {
            // Simple fallback when there is no image
            const placeholder = createDiv("•");
            placeholder.style("width", "32px");
            placeholder.style("height", "32px");
            placeholder.style("display", "flex");
            placeholder.style("align-items", "center");
            placeholder.style("justify-content", "center");
            placeholder.parent(imgDiv);
        }

        const itemNameP = createP((itemName === curPlayer.invBlock.curItem ? "* " : "") + itemName);
        itemNameP.style("font-size", "20px");
        itemNameP.style("color", rarityColorCSS(itemName));
        itemNameP.parent(itemInfoDiv);

        const itemAmount = createP(String(entry.amount ?? 0));
        itemAmount.style("font-size", "20px");
        itemAmount.style("color", "white");
        itemAmount.parent(itemInfoDiv);
    }

    // RIGHT SIDE (other inventory)
    itemListDivRight.html("");
    /** @type {Inventory} */
    const safeOther = normalizedOtherInv || /** @type {Inventory} */({ items: {}, curItem: "" });
    const otherItems = safeOther.items || {};
    arr = Object.keys(otherItems);

    for (let i = 0; i < arr.length; i++) {
        const itemName = arr[i];
        const entry = otherItems[itemName] || { amount: 0 };

        const itemDiv = createDiv();
        itemDiv.attribute('data-item', itemName);
        itemDiv.style("width", "100%");
        itemDiv.style("height", "50px");
        itemDiv.style("display", "flex");
        itemDiv.style("align-items", "center");
        itemDiv.style("justify-content", "center");
        itemDiv.style("border-bottom", "2px solid black");
        if (safeOther.curItem === itemName) {
            itemDiv.style("background-color", "rgb(120, 120, 120)");
            itemDiv.style("font-style", "italic");
        }
        itemDiv.style("cursor", "pointer");
        itemDiv.parent(itemListDivRight);

        itemDiv.mousePressed(() => {
            curPlayer.invBlock.curItem = "";
            safeOther.curItem = itemName;
            // PERF FIX #9: Update only highlights, skip full rebuild
            fastHighlightSwapLists(curPlayer.invBlock.curItem, safeOther.curItem);
            updatecurSwapItemDiv(safeOther);
        });

        const itemInfoDiv = createDiv();
        itemInfoDiv.style("width", "80%");
        itemInfoDiv.style("height", "50px");
        itemInfoDiv.style("display", "flex");
        itemInfoDiv.style("align-items", "center");
        itemInfoDiv.style("justify-content", "space-between");
        itemInfoDiv.parent(itemDiv);

        const imgDiv = createDiv();
        imgDiv.style("width", "32px");
        imgDiv.style("height", "32px");
        imgDiv.style("margin-right", "8px");
        imgDiv.style("display", "flex");
        imgDiv.style("align-items", "center");
        imgDiv.parent(itemInfoDiv);

        const urlRight = resolveItemImgURL(itemName, entry);
        if (urlRight) {
            const imgEl = createImg(urlRight, "");
            imgEl.style("width", "32px");
            imgEl.style("height", "32px");
            imgEl.style("image-rendering", "pixelated");
            imgEl.parent(imgDiv);
        } else {
            const placeholder = createDiv("•");
            placeholder.style("width", "32px");
            placeholder.style("height", "32px");
            placeholder.style("display", "flex");
            placeholder.style("align-items", "center");
            placeholder.style("justify-content", "center");
            placeholder.parent(imgDiv);
        }

        const itemNameP = createP((itemName === safeOther.curItem ? "* " : "") + itemName);
        itemNameP.style("font-size", "20px");
        itemNameP.style("color", rarityColorCSS(itemName));
        itemNameP.parent(itemInfoDiv);

        const itemAmount = createP(String(entry.amount ?? 0));
        itemAmount.style("font-size", "20px");
        itemAmount.style("color", "white");
        itemAmount.parent(itemInfoDiv);
    }
    // End of commented-out old function
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

/**
 * Renders the details panel for the currently selected item (from player or other inventory).
 * Robust to missing images, missing fields, and missing inventories.
 * @param {Inventory} otherInv
 */
function updatecurSwapItemDiv(otherInv) {
    if (!curPlayer || !curPlayer.invBlock) return;

    const normalizedOther = hydrateBagItemImages(otherInv);

    /** @type {Inventory} */
    const safeOther = normalizedOther || /** @type {Inventory} */ ({ items: {}, curItem: "" });

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
        // subtle placeholder
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
    /** @type {Array<[string, number|string]>|undefined} */
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
        if (tag === "Equipment") return ["Equipment", "Teleport Receiver", "Dirt Bag Upgrade", "Compass", "Map"].includes(item.itemName) || item.type === "Equipment";
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


    const ROW_H = 50;
    const renderRow = (entry) => {
        let itemName = entry.itemName;
        let itemDiv = createDiv();
        itemDiv.attribute('data-item', itemName);
        applyStyle(itemDiv, {
            width: "100%",
            height: ROW_H+"px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "2px solid black",
            cursor: "pointer",
        });
        itemDiv.mousePressed(() => {
            curPlayer.invBlock.curItem = itemName;
            highlightCraftList();
            perfTimed('updatecurCraftItemDiv', () => updatecurCraftItemDiv());
        });
        let itemInfoDiv = createDiv().parent(itemDiv);
        applyStyle(itemInfoDiv, {
            width: "80%",
            height: ROW_H+"px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
        });
        let imgDiv = createDiv().parent(itemInfoDiv);
        applyStyle(imgDiv, {
            width: "2.2em",
            height: "2.2em",
            minWidth: "28px",
            minHeight: "28px",
            marginRight: "0.5em",
            display: "flex",
            alignItems: "center"
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
        let itemNameP = createP(itemName).parent(itemInfoDiv);
        itemNameP.style("font-size", "20px");
        itemNameP.style("color", rarityColorCSS(itemName));
        const canCraft = curPlayer.invBlock.craftCheck(itemName);
        let craftIndicator;
        if (canCraft) {
            craftIndicator = createP("✔");
            craftIndicator.style("color", "green");
            craftIndicator.style("font-size", "20px");
        } else {
            // Use red X image from images folder
            craftIndicator = createImg("images/ui/x.png", "");
            craftIndicator.style("width", "20px");
            craftIndicator.style("height", "20px");
            craftIndicator.style("imageRendering", "pixelated");
            craftIndicator.style("pointerEvents", "none");
        }
        craftIndicator.parent(itemInfoDiv);
        return itemDiv;
    };
    renderVirtualRows(craftListDiv, arr, ROW_H, renderRow);
    if(!craftListDiv.elt._vscrollCraft){
        craftListDiv.elt._vscrollCraft = true;
        craftListDiv.elt.addEventListener('scroll', () => {
            renderVirtualRows(craftListDiv, arr, ROW_H, renderRow);
            highlightCraftList();
        });
    }
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
        margin: "5px"
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

    let itemCostDiv = createDiv().parent(curCraftItemDiv);
    itemCostDiv.style("width", "100%");
    itemCostDiv.style("height", "69%");

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

    let costText = createDiv("Cost").parent(itemCostDiv);
    applyStyle(costText, {
        fontSize: "20px",
        color: "white",
        textAlign: "center",
        border: "2px solid black",
        borderRadius: "10px",
        padding: "10px",
        marginBottom: "5px"
    });

    let costList = createDiv().parent(itemCostDiv);
    applyStyle(costList, {
        width: "100%",
        height: "calc(90% - 10px)",
        overflowY: "auto"
    });

  for (let i = 0; i < itemData.cost.length; i++) {
  const costDiv = createDiv().parent(costList);
  applyStyle(costDiv, {
    width: "100%", height: "20px", display: "flex", marginBottom: "12px"
  });

  let itemNameDiv, itemAmountDiv, color;
  if (i === 0) {
    itemNameDiv  = createDiv("Output:");
    itemAmountDiv = createDiv(itemData.cost[0]);
    color = "white"; // normal row
  } else {
    const item   = itemData.cost[i][0];
    const needed = itemData.cost[i][1];
    const have   = (item === "Dirt") ? dirtInv : (curPlayer.invBlock.items[item]?.amount ?? 0);

    itemNameDiv   = createDiv(`${item}:`);
    itemAmountDiv = createDiv(`${have} / ${needed}`);
    color = have < needed ? "#ff4444" : "#27f50e";
  }

  // Name box (always white text)
  applyStyle(itemNameDiv, {
    width:"50%", height:"100%", textAlign:"center", fontSize:"20px",
    color:"white", border:"2px solid black", borderRadius:"10px", padding:"5px"
  });
  itemNameDiv.parent(costDiv);

  // Amount box (conditional color)
  applyStyle(itemAmountDiv, {
    width:"50%", height:"100%", textAlign:"center", fontSize:"20px",
    color: color, border:"2px solid black", borderRadius:"10px", padding:"5px"
  });
  itemAmountDiv.parent(costDiv);
}

}

var deathDiv;

function defineDeathUI() {
    deathDiv = createDiv();
    deathDiv.id("deathDiv");
    deathDiv.class("container");
    deathDiv.style("position", "absolute");
    deathDiv.style("top", "50%");
    deathDiv.style("left", "50%");
    deathDiv.style("transform", "translate(-50%, -50%)");
    deathDiv.style("display", "none");
    deathDiv.style("width", "25%");
    deathDiv.style("height", "20%");
    deathDiv.style("border", "2px solid black");
    deathDiv.style("border-radius", "10px");
    deathDiv.style("text-align", "center");
    deathDiv.style("padding", "20px");

    let title = createP("Dead").parent(deathDiv);
    title.style("font-size", "28px");
    title.style("font-weight", "bold");
    title.style("color", "white");

    let respawnButton = createButton("Respawn").parent(deathDiv);
    styleButton(respawnButton);
    respawnButton.mousePressed(() => {
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

        socket.emit("update_pos", {
            id: curPlayer.id,
            pos: curPlayer.pos,
            holding: curPlayer.holding
        });
        socket.emit("update_player", {
            id: curPlayer.id,
            pos: curPlayer.pos,
            holding: curPlayer.holding,
            update_names: ["stats.hp"],
            update_values: [curPlayer.statBlock.stats.hp]
        });

        giveDefaultItems();
        curPlayer.invBlock.useTimer = 10;

        gameState = "playing";
        deathDiv.hide();
    });

    //disconnect button
    let disconnectButton = createButton("Disconnect").parent(deathDiv);
    styleButton(disconnectButton);
    disconnectButton.mousePressed(() => {
        // Save player data before disconnecting
        if (curPlayer && socket && socket.connected) {
            const playerData = {
                invBlock: curPlayer.invBlock ? {
                    items: curPlayer.invBlock.items || {},
                    hotbar: curPlayer.invBlock.hotbar || ["","","","",""],
                    selectedHotBar: curPlayer.invBlock.selectedHotBar || 0,
                    equiped: curPlayer.invBlock.equiped || {}
                } : null,
                statBlock: curPlayer.statBlock || null,
                pos: curPlayer.pos || null,
                teamId: curPlayer.teamId || null,
                race: curPlayer.race || null,
                color: curPlayer.color || 0,
                name: curPlayer.name || null
            };
            console.log('[Disconnect] Saving player data:', playerData);
            socket.emit('save_player_state', playerData);
            
            // Small delay to ensure data is sent before reload
            setTimeout(() => {
                location.reload();
            }, 100);
        } else {
            location.reload();
        }
        deathDiv.hide();
    });
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
    applyStyle(tutorialDiv, {
        backgroundColor: "#1a1a1a",
        width: "50%",
        height: "50%",
        position: "absolute",
        top: "0", left: "0", bottom: "0", right: "0",
        margin: "auto",
        color: "white",
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
    applyStyle(closeButton, {
        width: "22px",
        height: "22px",
        cursor: "pointer",
        imageRendering: "pixelated",
        border: "none",
    });
    closeButton.mousePressed(() => {
        gameState = "playing";
        curPlayer.invBlock.useTimer = 10;
        tutorialDiv.hide();
    });

    // PAGE HOLDER
    let pageHolder = createDiv().parent(tutorialDiv);
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
    applyStyle(leftButton, {
        fontSize: "18px",
        cursor: "pointer",
        background: "none",
        color: "white",
        border: "none",
    });

    // PAGE NUMBER WRAPPER
    let centerDiv = createDiv().parent(bottomBar);
    applyStyle(centerDiv, {
        flex: "1",
        display: "flex",
        justifyContent: "center",
    });
    pageNumberText = createP("").parent(centerDiv);
    applyStyle(pageNumberText, {
        fontSize: "12px",
        color: "white",
        margin: "0",
    });

    // → BUTTON WRAPPER
    let rightDiv = createDiv().parent(bottomBar);
    applyStyle(rightDiv, {
        flex: "1",
        display: "flex",
        justifyContent: "flex-end",
    });
    let rightButton = createButton(">").parent(rightDiv);
    applyStyle(rightButton, {
        fontSize: "18px",
        cursor: "pointer",
        background: "none",
        color: "white",
        border: "none",
    });

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
    applyStyle(skipText, {
        textAlign: "right",
        fontSize: "12px",
        width: "100%",
        marginBottom: "10px"
    });

    addTutorialStep(page1, "images/items/shovel1.png", "You can dig with an empty hand or shovel.");
    addTutorialStep(page1, "images/items/apple.png", "Any type of food will heal you.");
    addTutorialStep(page1, "images/ui/dirtbag.png", "Don't fill your dirt bag unless you know where to empty it.");
    addTutorialStep(page1, "images/items/sword1.png", "Use your sword to break things.");
    addTutorialStep(page1, "images/ui/f_tutorial_icon.png", "Move your mouse close to objects to interact with them (F key).");
    pages.push(page1);

    // --- Page 2 ---
    let page2 = createDiv().parent(pageHolder);
    createP("Controls:").parent(page2).style("margin-bottom", "10px");

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
    applyStyle(step, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "15px",
    });
    let img = createImg(imgPath).parent(step);
    img.style("width", "50px");
    img.style("height", "50px");
    let label = createP(text).parent(step);
    applyStyle(label, {
        marginTop: "5px",
        fontSize: "14px",
    });
}

function addControlStep(parent, control, description) {
    let key =keyToVisualKey(control);
    let line = createP(key + " - " + description).parent(parent);
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
    constructor(img, text, lifespan, x, y) {
        this.img = img;
        this.txt = text;
        this.lifespan = lifespan;
        this.pos = createVector(x, y);
        this.deleteTag = false;
        this.yOffset = 0;
        this.h = 50;
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

        fill(255);
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