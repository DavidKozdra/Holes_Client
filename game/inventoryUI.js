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

// Swap Inventory UI
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
    // Current item details
    curSwapItemDiv = createDiv().parent(swapInvDivInnerds);
    curSwapItemDiv.class("item-details");
    //Right Item list
    itemListDivRight = createDiv().parent(swapInvDivInnerds);
    itemListDivRight.class("item-list");
    let closeButton = createImg("images/ui/x.png", "").parent(swapInvDiv);
    closeButton.addClass("icon-btn");
    closeButton.class("close-button");
    closeButton.addClass("icon-btn");
    applyStyle(closeButton, {
        position: "absolute",
        right: "10px",
        top: "10px",
        width: "30px",
        height: "30px",
        cursor: "pointer",
        imageRendering: "pixelated",
        border: "none",
    });
    closeButton.mousePressed(() => {
        gameState = "playing";
        invDiv.show();
        swapInvDiv.hide();
    });
    updateSwapItemList();
}

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
window.defineSwapInvUI = defineSwapInvUI;
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
