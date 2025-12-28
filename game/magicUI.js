// Magic UI: Moves system, editor, and hotbar
// Extracted from ui.js

// --- Moves System & Hotbar ---

// Cached generated icons for abilities/spells
let spellIconCache = {};
function getSpellIcon(key, drawCb) {
    if (spellIconCache[key]) return spellIconCache[key];
    const g = createGraphics(26, 26);
    g.pixelDensity(1);
    drawCb(g);
    spellIconCache[key] = g;
    return g;
}

// Global move catalog (extendable)
const ALL_MOVES = [
    { id: 'dash', name: 'Dash', requiredLevel: 1, manaCost: 30, cooldown: 0.5, description: 'Quickly dash in the direction you are moving. Essential for evasion.', color: { r: 120, g: 200, b: 255 } },
    { id: 'forceField', name: 'Force Field', requiredLevel: 3, manaCost: 40, cooldown: 8, description: 'Create a protective barrier that blocks damage and projectiles.', color: { r: 120, g: 220, b: 255 } },
    { id: 'combustion', name: 'Combustion', requiredLevel: 8, manaCost: 30, cooldown: 6, description: 'Ignite enemies around you with a burst of fire damage.', color: { r: 255, g: 150, b: 100 } },
    { id: 'meditate', name: 'Meditate', requiredLevel: 14, manaCost: 5, cooldown: 3, description: 'Channel magic to restore mana over time. Toggle active.', color: { r: 200, g: 150, b: 255 } }
];

function ensureMoveSlots() {
    if (!curPlayer) return;
    if (!Array.isArray(curPlayer.movesSlots) || curPlayer.movesSlots.length === 0) {
        if (window.serverMovesSlots && Array.isArray(window.serverMovesSlots)) {
            curPlayer.movesSlots = window.serverMovesSlots.slice();
        } else {
            curPlayer.movesSlots = ['forceField', 'combustion', 'meditate', 'dash', null, null, null, null, null, null];
        }
    }
    while (curPlayer.movesSlots.length < 10) curPlayer.movesSlots.push(null);
}

function showMovesEditor() {
    ensureMoveSlots();
    if (!movesEditorDiv) {
        defineMovesEditorUI();
    }
    refreshMovesEditorUI();
    invDiv.hide();
    movesEditorDiv.show();
}

// Moves editor globals
var movesEditorDiv;
var movesSlotList;
var movesAllList;
var selectedMoveSlotIdx = 0;

function defineMovesEditorUI() {
    movesEditorDiv = invDiv;
    movesEditorDiv.id("moves-editor");
    movesEditorDiv.html('');
    const panel = movesEditorDiv;
    panel.style("display", "grid");
    panel.style("grid-template-columns", "1fr 1fr");
    panel.style("gap", "12px");
    panel.style("width", "60vw");
    panel.style("max-width", "85vw");
    const header = createDiv("<strong>Edit Moves (Slots 0-9)</strong>").parent(panel);
    header.style("grid-column", "1 / span 2");
    header.style("display", "flex");
    header.style("justify-content", "space-between");
    header.style("align-items", "center");
    header.style("margin-bottom", "12px");
    header.style("color", "yellow");
    const backBtn = createButton("Back to Inventory").parent(header);
    backBtn.style("padding", "8px 16px");
    backBtn.style("cursor", "pointer");
    backBtn.mousePressed(() => {
        if (curPlayer && curPlayer.movesSlots) {
            socket.emit("update_moves", {
                playerId: curPlayer.id,
                movesSlots: curPlayer.movesSlots
            });
        }
        movesEditorDiv.hide();
        defineInvUI();
        invDiv.show();
        updateItemList();
        updatecurItemDiv();
    });
    movesSlotList = createDiv().parent(panel);
    movesSlotList.style("border-radius", "8px");
    movesSlotList.style("padding", "8px");
    movesSlotList.style("overflow-y", "auto");
    movesSlotList.style("background", "#222");
    movesAllList = createDiv().parent(panel);
    movesAllList.style("border-radius", "8px");
    movesAllList.style("padding", "8px");
    movesAllList.style("overflow-y", "auto");
    movesAllList.style("background", "#222");
}

function refreshMovesEditorUI() {
    if (!curPlayer) return;
    ensureMoveSlots();
    const slotKeys = ['1','2','3','4','5','6','7','8','9','0'];
    movesSlotList.html('<div style="margin-bottom:8px; font-weight:bold; font-size:14px; color:#aef;">Slots</div>');
    for (let i = 0; i < 10; i++) {
        const moveId = curPlayer.movesSlots[i];
        const move = moveId ? ALL_MOVES.find(m => m.id === moveId) : null;
        const displayName = move ? move.name : 'Empty';
        const slotBtn = createButton(`${slotKeys[i]}: ${displayName}`).parent(movesSlotList);
        slotBtn.style("width", "100%");
        slotBtn.style("margin-bottom", "6px");
        slotBtn.style("padding", "8px");
        slotBtn.style("background", i === selectedMoveSlotIdx ? "green" : "#333");
        slotBtn.style("color", i === selectedMoveSlotIdx ? "#fff" : (moveId ? "#aef" : "#888"));
        slotBtn.style("border", i === selectedMoveSlotIdx ? "2px solid #fff" : "1px solid #555");
        slotBtn.style("cursor", "pointer");
        slotBtn.style("text-align", "left");
        slotBtn.mousePressed(() => { selectedMoveSlotIdx = i; refreshMovesEditorUI(); });
        const clearBtn = createImg("images/ui/x.png", "Clear").parent(slotBtn);
        clearBtn.style("width", "16px");
        clearBtn.style("height", "16px");
        clearBtn.style("float", "right");
        clearBtn.style("cursor", "pointer");
        clearBtn.style("image-rendering", "pixelated");
        clearBtn.mousePressed((e) => {
            e.stopPropagation();
            curPlayer.movesSlots[i] = null;
            refreshMovesEditorUI();
        });
    }
    movesAllList.html('<div style="margin-bottom:12px; font-weight:bold; font-size:14px; color:#aef;">Available Moves</div>');
    // ... (move icon and assign logic, see ui.js for full details)
}

// --- Hotbar rendering (example, see ui.js for full details) ---
function renderHotbarUI() {
    // ... (copy hotbar rendering logic from ui.js)
}

// Exported for use in main UI
window.ensureMoveSlots = ensureMoveSlots;
window.showMovesEditor = showMovesEditor;
window.defineMovesEditorUI = defineMovesEditorUI;
window.refreshMovesEditorUI = refreshMovesEditorUI;
window.renderHotbarUI = renderHotbarUI;
window.ALL_MOVES = ALL_MOVES;
