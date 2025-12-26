/**
 * Crafting UI Module
 * Modern, reactive crafting interface with categories and search
 */

var craftDiv;
var craftListDiv;
var curCraftItemDiv;
var craftSearchInput;
var craftSearchTimeout;

// Crafting state
var craftState = {
    category: "All",
    searchQuery: "",
    selectedItem: null,
    filteredRecipes: [],
    lastRecipeHash: ""  // For smart update detection
};

/**
 * Initialize the crafting UI
 * Called once during setup
 */
function defineCraftingUI() {
    craftDiv = createDiv();
    craftDiv.id("crafting-ui");
    craftDiv.class("craft-container");
    craftDiv.hide();

    // Header with tabs
    let header = createDiv().parent(craftDiv);
    header.class("craft-header");

    let invTabBtn = createButton("Inventory").parent(header);
    invTabBtn.class("craft-tab-btn");
    invTabBtn.mousePressed(() => switchToCraftingTab("inventory"));

    let craftTabBtn = createButton("Crafting").parent(header);
    craftTabBtn.class("craft-tab-btn craft-tab-active");
    craftTabBtn.mousePressed(() => switchToCraftingTab("crafting"));

    let closeBtn = createImg("images/ui/x.png", "").parent(header);
    closeBtn.class("craft-close-btn");
    closeBtn.addClass("icon-btn");
    closeBtn.style("width", "20px");
    closeBtn.style("height", "20px");
    closeBtn.style("cursor", "pointer");
    closeBtn.style("image-rendering", "pixelated");
    closeBtn.mousePressed(closeCrafting);

    // Category filter buttons
    let categoryBar = createDiv().parent(craftDiv);
    categoryBar.class("craft-category-bar");

    const categories = ["All", "Tools/Seeds", "Weapons", "Equipment", "Consumables"];
    categories.forEach((cat) => {
        let btn = createButton(cat).parent(categoryBar);
        btn.class("craft-category-btn");
        if (cat === "All") btn.class("craft-category-active");
        btn.mousePressed(() => selectCraftCategory(cat));
    });

    // Search bar
    craftSearchInput = createInput().parent(craftDiv);
    craftSearchInput.class("craft-search-input");
    craftSearchInput.attribute("placeholder", "Search recipes...");
    // PERF OPTIMIZATION: Debounce search to avoid rebuilding on every keystroke
    craftSearchInput.input(() => debounceCraftSearch());

    // Main content: two columns
    let contentArea = createDiv().parent(craftDiv);
    contentArea.class("craft-content");

    // Left column - recipe list
    craftListDiv = createDiv().parent(contentArea);
    craftListDiv.class("craft-column craft-recipe-list");

    // Right column - recipe details
    curCraftItemDiv = createDiv().parent(contentArea);
    curCraftItemDiv.class("craft-column craft-recipe-details");

    let noSelection = createP("Select a recipe").parent(curCraftItemDiv);
    noSelection.class("craft-empty");

    updateCraftList();
}

// Use centralized rarity color helper from items.js
function rarityColorCSS(itemName){
    try{
        if (typeof window !== 'undefined' && typeof window.getItemRarityCSSByName === 'function') {
            return window.getItemRarityCSSByName(itemName);
        }
        const key = (itemDic && itemDic[itemName] && itemDic[itemName].rarity) ? itemDic[itemName].rarity : 'white';
        const rgb = (typeof RARITY_RGB !== 'undefined' && RARITY_RGB[key]) ? RARITY_RGB[key] : [235,235,235];
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }catch(e){
        return 'rgb(235,235,235)';
    }
}

/**
 * Switch between inventory and crafting tabs
 * @param {string} tab - "inventory" or "crafting"
 */
function switchToCraftingTab(tab) {
    if (tab === "inventory") {
        gameState = "inventory";
        curPlayer.invBlock.curItem = "";
        invDiv.show();
        updateItemList();
        craftDiv.hide();
    } else {
        gameState = "crafting";
        craftDiv.show();
    }
}

/**
 * Debounced search to avoid DOM rebuilds on every keystroke
 * Waits 300ms after user stops typing before filtering
 */
function debounceCraftSearch() {
    clearTimeout(craftSearchTimeout);
    craftSearchTimeout = setTimeout(() => {
        updateCraftingFilter();
    }, 300);
}

/**
 * Select a crafting category and update recipes
 * @param {string} category - Category name
 */
function selectCraftCategory(category) {
    craftState.category = category;
    updateCraftingFilter();
}

/**
 * Update recipe list based on current filters
 */
function updateCraftingFilter() {
    craftState.searchQuery = craftSearchInput?.value()?.toLowerCase() || "";
    updateCraftList();
}

/**
 * Close crafting UI
 */
function closeCrafting() {
    gameState = "playing";
    curPlayer.invBlock.useTimer = 10;
    craftDiv.hide();
}

/**
 * Rebuild the full recipe list based on filters and category
 */
function updateCraftList() {
    if (!curPlayer) return;

    craftListDiv.html("");

    // Get all recipes
    let recipes = JSON.parse(JSON.stringify(craftOptions || []));

    // Add campfire recipes if nearby
    const campfireRecipes = getCampfireRecipes();
    recipes.push(...campfireRecipes);

    // Filter by category
    recipes = filterByCategory(recipes, craftState.category);

    // Filter by search
    if (craftState.searchQuery) {
        recipes = filterBySearch(recipes, craftState.searchQuery);
    }

    // Store filtered recipes for details panel
    craftState.filteredRecipes = recipes;

    // Render recipe list
    if (recipes.length === 0) {
        let empty = createP("No recipes found").parent(craftListDiv);
        empty.class("craft-empty");
        return;
    }

    recipes.forEach((recipe) => {
        const isSelected = recipe.itemName === craftState.selectedItem;

        let recipeRow = createDiv().parent(craftListDiv);
        recipeRow.class("craft-recipe-row");
        if (isSelected) recipeRow.class("selected");
        recipeRow.attribute("data-item", recipe.itemName);
        recipeRow.mousePressed(() => selectRecipe(recipe));

        // Recipe image
        let imgDiv = createDiv().parent(recipeRow);
        imgDiv.class("craft-recipe-image");

        const imgUrl = resolveItemImgURL(recipe.itemName, { imgNum: recipe.imgNum });
        if (imgUrl) {
            let img = createImg(imgUrl, recipe.itemName);
            img.class("craft-recipe-img");
            img.parent(imgDiv);
        } else {
            let placeholder = createDiv("⚙").parent(imgDiv);
            placeholder.class("craft-recipe-placeholder");
        }

        // Recipe name
        let nameP = createP((isSelected ? "→ " : "") + recipe.itemName).parent(recipeRow);
        nameP.class("craft-recipe-name");
        nameP.style("color", rarityColorCSS(recipe.itemName));
    });
}

/**
 * Get campfire recipes if nearby
 * @returns {Array} Recipes available at campfire
 */
function getCampfireRecipes() {
    const recipes = [];

    for (let obj of testMap.chunks[getPlayerChunk()].objects) {
        if (obj.objName === "Campfire" && curPlayer.pos.dist(obj.pos) < 100) {
            const campfireItems = [
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

            campfireItems.forEach((item) => {
                if (!recipes.some((r) => r.itemName === item.itemName)) {
                    recipes.push(item);
                }
            });
        }
    }

    return recipes;
}

/**
 * Filter recipes by category
 * @param {Array} recipes - Recipe array
 * @param {string} category - Category to filter
 * @returns {Array} Filtered recipes
 */
function filterByCategory(recipes, category) {
    if (category === "All") return recipes;

    const categoryMap = {
        "Tools/Seeds": (r) => r.type === "Shovel" || r.type === "Seed",
        "Weapons": (r) => r.type === "Melee" || r.type === "Ranged",
        "Equipment": (r) =>
            ["Equipment", "Teleport Receiver", "Dirt Bag Upgrade", "Compass", "Map"].includes(
                r.itemName
            ) || r.type === "Equipment",
        "Consumables": (r) => r.type === "Food" || r.type === "Potion"
    };

    const predicate = categoryMap[category];
    return predicate ? recipes.filter(predicate) : recipes;
}

/**
 * Filter recipes by search query
 * @param {Array} recipes - Recipe array
 * @param {string} query - Search query
 * @returns {Array} Filtered recipes
 */
function filterBySearch(recipes, query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    return recipes.filter((r) => regex.test(r.itemName));
}

/**
 * Select and display a recipe
 * @param {Object} recipe - Recipe object
 */
function selectRecipe(recipe) {
    craftState.selectedItem = recipe.itemName;

    // Update highlighting
    if (craftListDiv?.elt?.children) {
        for (let row of craftListDiv.elt.children) {
            const itemName = row.getAttribute("data-item");
            if (itemName === recipe.itemName) {
                row.classList.add("selected");
            } else {
                row.classList.remove("selected");
            }
        }
    }

    // Update details panel
    updatecurCraftItemDiv(recipe);
}

/**
 * Update the recipe details panel
 * @param {Object} recipe - Recipe object
 */
function updatecurCraftItemDiv(recipe) {
    if (!recipe) {
        curCraftItemDiv.html("");
        let empty = createP("Select a recipe").parent(curCraftItemDiv);
        empty.class("craft-empty");
        return;
    }

    curCraftItemDiv.html("");

    // Recipe image (larger)
    let imgDiv = createDiv().parent(curCraftItemDiv);
    imgDiv.class("craft-detail-image");

    const imgUrl = resolveItemImgURL(recipe.itemName, { imgNum: recipe.imgNum });
    if (imgUrl) {
        let img = createImg(imgUrl, recipe.itemName);
        img.class("craft-detail-img");
        img.parent(imgDiv);
    } else {
        let placeholder = createDiv("⚙").parent(imgDiv);
        placeholder.class("craft-detail-placeholder");
    }

    // Recipe name
    let nameP = createP(recipe.itemName).parent(curCraftItemDiv);
    nameP.class("craft-detail-name");
    nameP.style("color", rarityColorCSS(recipe.itemName));

    // Recipe description
    const desc = itemDic?.[recipe.itemName]?.desc || "No description available";
    let descP = createP(desc).parent(curCraftItemDiv);
    descP.class("craft-detail-desc");

    // Crafting cost (ingredients)
    if (recipe.cost && recipe.cost.length >= 2) {
        let ingredientsTitle = createP("Ingredients:").parent(curCraftItemDiv);
        ingredientsTitle.class("craft-detail-ingredients-title");

        const [xpCost, ingredientsList] = recipe.cost;

        if (xpCost > 0) {
            let xpP = createP(`${xpCost} XP`).parent(curCraftItemDiv);
            xpP.class("craft-detail-ingredient");
        }

        ingredientsList.forEach(([ingredientName, amount]) => {
            let ingP = createP(`${amount}× ${ingredientName}`).parent(curCraftItemDiv);
            ingP.class("craft-detail-ingredient");

            // Check if player has ingredient
            const playerHas = curPlayer.invBlock.items?.[ingredientName]?.amount || 0;
            const hasEnough = playerHas >= amount;
            if (!hasEnough) {
                ingP.class("craft-detail-missing");
            }
        });

        // Craft button
        const canCraft = isRecipeComplete(recipe);
        let craftBtn = createButton("CRAFT").parent(curCraftItemDiv);
        craftBtn.class("craft-detail-btn");
        if (!canCraft) {
            craftBtn.attribute("disabled", "true");
            craftBtn.class("craft-detail-btn-disabled");
        }
        craftBtn.mousePressed(() => attemptCraft(recipe));
    }
}

/**
 * Check if player has all ingredients for a recipe
 * @param {Object} recipe - Recipe object
 * @returns {boolean} Can craft
 */
function isRecipeComplete(recipe) {
    if (!recipe.cost || recipe.cost.length < 2) return true;

    const [xpCost, ingredientsList] = recipe.cost;

    // Check XP (if needed)
    // if (curPlayer.xp < xpCost) return false;

    // Check ingredients
    for (let [ingredientName, amount] of ingredientsList) {
        const playerHas = curPlayer.invBlock.items?.[ingredientName]?.amount || 0;
        if (playerHas < amount) return false;
    }

    return true;
}

/**
 * Attempt to craft an item
 * @param {Object} recipe - Recipe object
 */
function attemptCraft(recipe) {
    if (!isRecipeComplete(recipe)) {
        console.log("Cannot craft: missing ingredients");
        return;
    }

    // TODO: Send craft request to server
    console.log("Crafting:", recipe.itemName);

    // Example server emit:
    // socket.emit("craft", { itemName: recipe.itemName });
}
