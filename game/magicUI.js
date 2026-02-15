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


// Use magicAbilities as the global move catalog
const ALL_MOVES = magicAbilities.map(ability => ({
    id: ability.name.toLowerCase().replace(/\s+/g, ''),
    name: ability.name,
    requiredLevel: ability.requiredLevel || 1,
    manaCost: ability.manaCost,
    cooldown: ability.cooldown,
    description: ability.desc,
    color: ability.color || { r: 120, g: 200, b: 255 }
}));

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
    // Hide other UIs
    invDiv.hide();
    if (typeof craftDiv !== 'undefined' && craftDiv) craftDiv.hide();

    // Always recreate for clean state
    if (movesEditorDiv) {
        movesEditorDiv.remove();
        movesEditorDiv = null;
    }
    defineMovesEditorUI();
    refreshMovesEditorUI();
    movesEditorDiv.show();
}

// Moves editor globals
var movesEditorDiv;
var movesSlotList;
var movesAllList;
var selectedMoveSlotIdx = 0;

// Save moves to server
function _saveMoves() {
    if (curPlayer && curPlayer.movesSlots && typeof socket !== 'undefined') {
        socket.emit("update_moves", {
            playerId: curPlayer.id,
            movesSlots: curPlayer.movesSlots
        });
    }
}

// Generate a spell icon data URL
function _getSpellIconUrl(move) {
    if (typeof getSpellIcon !== 'function') return '';
    const iconKey = move.id + '_editor';
    const g = getSpellIcon(iconKey, (g) => {
        g.clear();
        g.push();
        g.translate(g.width / 2, g.height / 2);
        g.noStroke();
        const col = move.color || { r: 120, g: 200, b: 255 };
        g.fill(col.r, col.g, col.b);
        g.ellipse(0, 0, 22, 22);
        g.fill(255);
        g.textAlign(g.CENTER, g.CENTER);
        g.textSize(10);
        g.text(move.name.substring(0, 2).toUpperCase(), 0, 0);
        g.pop();
    });
    try { return g?.canvas?.toDataURL('image/png') || ''; } catch (e) { return ''; }
}

function defineMovesEditorUI() {
    movesEditorDiv = createDiv();
    movesEditorDiv.id("moves-editor");
    movesEditorDiv.class("container");
    applyStyle(movesEditorDiv, {
        position: "absolute",
        top: "45%",
        left: "55%",
        transform: "translate(-50%, -50%)",
        display: "none",
        zIndex: "50",
    });

    // ── Top bar with navigation tabs ──
    let topBar = createDiv().parent(movesEditorDiv);
    applyStyle(topBar, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    });

    let invTitle = createP("Inventory").parent(topBar);
    invTitle.class("inventory-title");
    invTitle.style("cursor", "pointer");
    invTitle.mousePressed(() => {
        _saveMoves();
        movesEditorDiv.hide();
        gameState = "inventory";
        defineInvUI();
        invDiv.show();
        updateItemList();
        updatecurItemDiv();
    });

    let craftingTitle = createP("Crafting").parent(topBar);
    craftingTitle.class("inventory-title");
    craftingTitle.style("cursor", "pointer");
    craftingTitle.mousePressed(() => {
        _saveMoves();
        movesEditorDiv.hide();
        gameState = "crafting";
        craftDiv.show();
        curPlayer.invBlock.curItem = "";
        updateCraftList();
    });

    let movesTitle = createP("Moves").parent(topBar);
    movesTitle.class("inventory-title");
    movesTitle.style("color", "yellow");

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
        _saveMoves();
        gameState = "playing";
        curPlayer.invBlock.useTimer = 10;
        movesEditorDiv.hide();
    });

    // ── Bottom area (two-panel layout, matching inventory/crafting) ──
    let bottomDiv = createDiv().parent(movesEditorDiv);
    bottomDiv.class("bottom-area");

    movesSlotList = createDiv().parent(bottomDiv);
    movesSlotList.class("item-list");

    movesAllList = createDiv().parent(bottomDiv);
    movesAllList.class("item-details");
}

function refreshMovesEditorUI() {
    if (!curPlayer) return;
    ensureMoveSlots();
    const slotKeys = ['1','2','3','4','5','6','7','8','9','0'];
    const playerLevel = curPlayer?.statBlock?.level || 0;

    // ── Left panel: Your Slots ──
    movesSlotList.html('');

    let slotsHeader = createDiv('Your Slots').parent(movesSlotList);
    slotsHeader.class("me-section-title");

    for (let i = 0; i < 10; i++) {
        const moveId = curPlayer.movesSlots[i];
        const move = moveId ? ALL_MOVES.find(m => m.id === moveId) : null;
        const isSelected = (i === selectedMoveSlotIdx);

        let row = createDiv().parent(movesSlotList);
        row.class("me-slot-row");
        if (isSelected) row.addClass("me-slot-selected");

        // Key badge
        let keyBadge = createSpan(slotKeys[i]).parent(row);
        keyBadge.class("me-slot-key");

        if (move) {
            // Spell icon
            const iconUrl = _getSpellIconUrl(move);
            if (iconUrl) {
                let icon = createImg(iconUrl, move.name).parent(row);
                icon.class("me-slot-icon");
            }
            // Spell name
            let name = createSpan(move.name).parent(row);
            name.class("me-slot-name");
        } else {
            let name = createSpan("Empty").parent(row);
            name.class("me-slot-name");
            name.addClass("me-slot-empty-text");
        }

        // Clear button
        if (move) {
            let clearBtn = createImg("images/ui/x.png", "Clear").parent(row);
            clearBtn.class("me-slot-clear");
            clearBtn.addClass("icon-btn");
            clearBtn.elt.addEventListener('pointerdown', ((idx) => (e) => {
                e.stopPropagation();
                e.preventDefault();
                curPlayer.movesSlots[idx] = null;
                refreshMovesEditorUI();
            })(i));
        }

        // Click to select slot
        row.elt.style.touchAction = 'manipulation';
        row.elt.style.pointerEvents = 'auto';
        row.elt.addEventListener('pointerdown', ((idx) => (e) => {
            if (e.target.closest('.me-slot-clear')) return;
            e.stopPropagation();
            e.preventDefault();
            selectedMoveSlotIdx = idx;
            refreshMovesEditorUI();
        })(i));
    }

    // ── Right panel: Spell browser ──
    movesAllList.html('');

    // Detail header — show currently assigned spell info
    const currentMoveId = curPlayer.movesSlots[selectedMoveSlotIdx];
    const currentSpell = currentMoveId ? ALL_MOVES.find(m => m.id === currentMoveId) : null;

    let detailHeader = createDiv().parent(movesAllList);
    detailHeader.class("me-detail-header");

    if (currentSpell) {
        const iconUrl = _getSpellIconUrl(currentSpell);
        if (iconUrl) {
            let headerIcon = createImg(iconUrl, currentSpell.name).parent(detailHeader);
            headerIcon.style("width", "36px");
            headerIcon.style("height", "36px");
            headerIcon.style("image-rendering", "pixelated");
            headerIcon.style("border-radius", "6px");
        }
        let headerInfo = createDiv().parent(detailHeader);
        let headerName = createP('Slot ' + slotKeys[selectedMoveSlotIdx] + ': ' + currentSpell.name).parent(headerInfo);
        headerName.style("color", "#aef");
        headerName.style("font-size", "16px");
        headerName.style("margin", "0 0 4px 0");
        let headerDesc = createP(currentSpell.description).parent(headerInfo);
        headerDesc.style("color", "#999");
        headerDesc.style("font-size", "11px");
        headerDesc.style("margin", "0");
        headerDesc.style("line-height", "1.4");
        let headerMeta = createDiv().parent(headerInfo);
        headerMeta.style("display", "flex");
        headerMeta.style("gap", "12px");
        headerMeta.style("margin-top", "6px");
        let mpLabel = createSpan(currentSpell.manaCost + ' MP').parent(headerMeta);
        mpLabel.style("color", "#8cf");
        mpLabel.style("font-size", "12px");
        let cdLabel = createSpan((currentSpell.cooldown / 60).toFixed(1) + 's CD').parent(headerMeta);
        cdLabel.style("color", "#ff8");
        cdLabel.style("font-size", "12px");
        let lvlLabel = createSpan('Lv ' + (currentSpell.requiredLevel || 1)).parent(headerMeta);
        lvlLabel.style("color", "#4caf50");
        lvlLabel.style("font-size", "12px");
    } else {
        let headerText = createP('Slot ' + slotKeys[selectedMoveSlotIdx] + ': Empty — select a spell below').parent(detailHeader);
        headerText.style("color", "#666");
        headerText.style("font-size", "14px");
        headerText.style("margin", "0");
    }

    // Available spells section
    let spellsTitle = createDiv('Available Spells').parent(movesAllList);
    spellsTitle.class("me-section-title");

    let spellListDiv = createDiv().parent(movesAllList);
    spellListDiv.class("me-spell-list");

    for (const move of ALL_MOVES) {
        const isAssigned = curPlayer.movesSlots.includes(move.id);
        const isCurrentSlot = curPlayer.movesSlots[selectedMoveSlotIdx] === move.id;
        const isLocked = playerLevel < (move.requiredLevel || 1);

        let row = createDiv().parent(spellListDiv);
        row.class("me-spell-row");
        if (isCurrentSlot) row.addClass("me-spell-current");
        if (isLocked) row.addClass("me-spell-locked");

        // Spell icon
        const iconUrl = _getSpellIconUrl(move);
        if (iconUrl) {
            let iconWrap = createDiv().parent(row);
            iconWrap.class("me-spell-icon-wrap");
            let icon = createImg(iconUrl, move.name).parent(iconWrap);
            icon.class("me-spell-icon");
        }

        // Spell info
        let info = createDiv().parent(row);
        info.class("me-spell-info");

        let nameRow = createDiv().parent(info);
        nameRow.class("me-spell-name-row");

        let name = createSpan(move.name).parent(nameRow);
        name.class("me-spell-name");

        if (isAssigned && !isCurrentSlot) {
            let badge = createSpan("In Use").parent(nameRow);
            badge.class("me-spell-badge me-spell-badge-used");
        }
        if (isCurrentSlot) {
            let badge = createSpan("Selected").parent(nameRow);
            badge.class("me-spell-badge me-spell-badge-current");
        }
        if (isLocked) {
            let badge = createSpan('Lv ' + (move.requiredLevel || 1)).parent(nameRow);
            badge.class("me-spell-badge me-spell-badge-locked");
        }

        // Meta: mana cost + cooldown
        let meta = createDiv().parent(info);
        meta.class("me-spell-meta");
        let manaSpan = createSpan(move.manaCost + ' MP').parent(meta);
        manaSpan.class("me-spell-mana");
        let cdSpan = createSpan((move.cooldown / 60).toFixed(1) + 's CD').parent(meta);
        cdSpan.class("me-spell-cd");

        // Description
        let desc = createP(move.description).parent(info);
        desc.class("me-spell-desc");

        // Click to assign (if not locked)
        row.elt.style.touchAction = 'manipulation';
        row.elt.style.pointerEvents = 'auto';
        if (!isLocked) {
            row.elt.addEventListener('pointerdown', ((moveId) => (e) => {
                e.stopPropagation();
                e.preventDefault();
                curPlayer.movesSlots[selectedMoveSlotIdx] = moveId;
                refreshMovesEditorUI();
            })(move.id));
        }
    }
}

// --- Hotbar rendering (example, see ui.js for full details) ---
// Unified DOM-based moves hotbar UI
function renderHotbarUI() {
  updateMoveHotbarDOM(curPlayer);
}


function ensureMoveHotbarDOM() {
  if (window._moveHotbarDOM) return window._moveHotbarDOM;

  // Styles (only once)
  if (!document.getElementById("move-hotbar-styles")) {
    const style = document.createElement("style");
    style.id = "move-hotbar-styles";
    style.textContent = `
      #moveHotbarRoot {
        position: fixed;
        left: 50%;
        bottom: 22px;
        transform: translateX(-50%);
        z-index: 9986;
        pointer-events: auto;
        user-select: none;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        max-width: 50dvw;
      }

      #moveHotbarBar {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(0,0,0,0.45);
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .moveSlot {
        position: relative;
        width: 56px;
        height: 56px;
        border-radius: 8px;
        border: 2px solid rgba(140,240,140,0.9);
        background: rgba(30,30,30,0.75);
        overflow: hidden;
      }

      .moveSlot.isLocked {
        border-color: rgba(120,90,40,0.9);
        background: rgba(25,25,25,0.85);
        filter: saturate(0.7);
      }

      .moveSlot.isOnCd {
        border-color: rgba(110,110,110,0.9);
        background: rgba(30,30,30,0.85);
      }

      .moveSlot.isActive {
        box-shadow: 0 0 0 2px rgba(255,255,255,0.35) inset;
      }

      .moveSlot.cantAfford {
        border-color: rgba(170,70,70,0.95);
        background: rgba(60,20,20,0.75);
      }

      .moveIcon {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        image-rendering: pixelated;
        object-fit: cover;
      }

      /* Cooldown overlay: grows downward (like your rect overlay) */
      .cdOverlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 0%;
        background: rgba(255,100,100,0.55);
        border-radius: 10px;
        pointer-events: none;
      }

      .keyLabel {
        position: absolute;
        left: 50%;
        top: -34px;
        transform: translateX(-50%);
        height: 26px;
        min-width: 48px;
        padding: 0 10px;
        border-radius: 8px;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 18px;
        letter-spacing: 0.5px;
        color: #fff;
        border: 1px solid rgba(255,255,255,0.12);
      }

      .keyLabel.lockedKey {
        color: rgb(255,220,160);
      }

      .nameLabel {
        position: absolute;
        left: 50%;
        bottom: -30px;
        transform: translateX(-50%);
        width: 160px;
        text-align: center;
        font-size: 14px;
        color: rgba(230,230,230,0.95);
        text-shadow: 0 1px 2px rgba(0,0,0,0.65);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .nameLabel.lockedName {
        color: rgb(230,190,120);
      }
    `;
    document.head.appendChild(style);
  }

  // Root
  const root = document.createElement("div");
  root.id = "moveHotbarRoot";

  const bar = document.createElement("div");
  bar.id = "moveHotbarBar";
  root.appendChild(bar);

    // 10 slots for moves (0-9)
    const slots = [];

    for (let i = 0; i < 10; i++) {
      const slot = document.createElement("div");
      slot.className = "moveSlot";
      slot.style.transform = "scale(0.9)";

      const icon = document.createElement("img");
      icon.className = "moveIcon";
      icon.alt = "";

      const cd = document.createElement("div");
      cd.className = "cdOverlay";

      // Hotkey label (top right)
      const key = document.createElement("div");
      key.className = "keyLabel";
      key.textContent = (i === 9 ? "0" : String(i + 1));
      key.style.position = "absolute";
      key.style.top = "4px";
      key.style.right = "8px";
      key.style.left = "auto";
      key.style.transform = "none";
      key.style.background = "rgba(0,0,0,0.7)";
      key.style.fontSize = "10px";
      key.style.padding = "2px 10px";
      key.style.borderRadius = "8px";
      key.style.minWidth = "unset";
      key.style.height = "auto";
      key.style.zIndex = "2";

      // Move name label (bottom center)
      const name = document.createElement("div");
      name.className = "nameLabel";
      name.textContent = "";
      name.style.position = "absolute";
      name.style.left = "50%";
      name.style.bottom = "4px";
      name.style.transform = "translateX(-50%)";
      name.style.width = "90%";
      name.style.textAlign = "center";
      name.style.fontSize = "10px";
      name.style.color = "rgba(230,230,230,0.95)";
      name.style.textShadow = "0 1px 2px rgba(0,0,0,0.65)";
      name.style.whiteSpace = "nowrap";
      name.style.overflow = "hidden";
      name.style.textOverflow = "ellipsis";
      name.style.pointerEvents = "none";
      name.style.zIndex = "2";

      slot.appendChild(icon);
      slot.appendChild(cd);
      slot.appendChild(key);
      slot.appendChild(name);

      // Make slot tappable on mobile to cast spell
      slot.style.pointerEvents = 'auto';
      slot.style.cursor = 'pointer';
      slot.style.touchAction = 'manipulation';
      (function(slotIdx) {
        function castSlot(e) {
          e.stopPropagation();
          e.preventDefault();
          if (typeof triggerMoveSlot === 'function') {
            triggerMoveSlot(slotIdx);
          }
        }
        slot.addEventListener('touchstart', castSlot, { passive: false });
        slot.addEventListener('pointerdown', castSlot);
      })(i);

      bar.appendChild(slot);

      slots.push({ slot, icon, cd, key, name });
    }

  document.body.appendChild(root);

  window._moveHotbarDOM = { root, bar, slots };
  return window._moveHotbarDOM;
}

// Build icons once and keep dataURLs around for <img>
function ensureMoveHotbarIcons() {
 // Expose for use in other scripts
 window.updateMoveHotbarDOM = updateMoveHotbarDOM;
  if (window._moveHotbarIcons) return window._moveHotbarIcons;

  // If you already have getSpellIcon(id, drawFn) from your code, reuse it.
  // We convert p5.Graphics -> dataURL for DOM <img>.
  const toDataUrl = (g) => {
    // p5.Graphics has .canvas
    try { return g?.canvas?.toDataURL?.("image/png"); } catch (e) {}
    return "";
  };

  // Fallback: tiny blank (if getSpellIcon isn't ready yet)
  const blank = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";

  // If getSpellIcon exists, generate the same icons you had
  const hasGetSpellIcon = typeof window.getSpellIcon === "function";

  let dashG, combustionG, forceFieldG, meditateG, emptyG;

  if (hasGetSpellIcon) {
    dashG = getSpellIcon("dash_hud_lg", (g) => {
      g.clear();
      g.push();
      g.translate(g.width / 2, g.height / 2);
      g.noStroke();
      g.fill(120, 200, 255);
      g.rectMode(g.CENTER);
      g.rect(0, 0, 18, 12, 4);
      g.fill(255);
      g.triangle(-4, -4, -4, 4, 6, 0);
      g.pop();
    });

    combustionG = getSpellIcon("combustion_hud_lg", (g) => {
      g.clear();
      g.noStroke();
      g.fill(255, 140, 60);
      g.circle(13, 13, 18);
      g.fill(255, 220, 120, 180);
      g.circle(13, 13, 10);
    });

    forceFieldG = getSpellIcon("forceField_hud_lg", (g) => {
      g.clear();
      g.noFill();
      g.stroke(120, 220, 255);
      g.strokeWeight(3);
      g.circle(13, 13, 18);
      g.stroke(120, 200, 240, 160);
      g.strokeWeight(2);
      g.circle(13, 13, 12);
    });

    meditateG = getSpellIcon("meditate_hud_lg", (g) => {
      g.clear();
      g.noStroke();
      g.fill(190, 150, 255);
      g.rect(5, 8, 18, 10, 4);
      g.fill(120, 90, 200, 180);
      g.rect(8, 6, 12, 6, 3);
    });

    emptyG = getSpellIcon("emptyMove_hud_lg", (g) => {
      g.clear();
      g.noStroke();
      g.fill(70);
      g.rect(4, 4, 18, 18, 4);
      g.stroke(110);
      g.noFill();
    });
  }

  window._moveHotbarIcons = {
    dash: hasGetSpellIcon ? toDataUrl(dashG) : blank,
    combustion: hasGetSpellIcon ? toDataUrl(combustionG) : blank,
    forceField: hasGetSpellIcon ? toDataUrl(forceFieldG) : blank,
    meditate: hasGetSpellIcon ? toDataUrl(meditateG) : blank,
    empty: hasGetSpellIcon ? toDataUrl(emptyG) : blank
  };

  return window._moveHotbarIcons;
}


function getMoveEntryForDOM(curPlayer, moveId, slotLabel) {
  const icons = ensureMoveHotbarIcons();
  const stats = curPlayer?.statBlock?.stats || {};
  const level = curPlayer?.statBlock?.level || 0;
  const mp = stats.mp ?? 0;
  // Use slot index for label and spell number
  const mk = (o) => ({
    label: slotLabel, // hotkey label (1,2,3,4...)
    nameLabel: o.nameLabel || ` ${ability ? ability.name : 'Empty'} `,
    locked: !!o.locked,
    unlockLevel: o.unlockLevel ?? "",
    onCd: !!o.onCd,
    cooldownPct: Math.max(0, Math.min(1, o.cooldownPct || 0)),
    canAfford: o.canAfford !== false,
    active: !!o.active,
    iconUrl: o.iconUrl || icons.empty
  });

  // Find the ability from the global magicAbilities array
  const ability = window.magicAbilities?.find(a => a.name.toLowerCase().replace(/\s+/g, '') === (moveId || '').toLowerCase());
  if (!moveId || !ability) {
    // Empty slot or unknown move
    return mk({
      nameLabel: ` ${ability ? ability.name : 'Empty'} `,
      locked: true,
      unlockLevel: "",
      onCd: false,
      cooldownPct: 0,
      canAfford: true,
      active: false,
      iconUrl: icons.empty
    });
  }

  // Determine lock state
  const locked = level < (ability.requiredLevel || 1);
  // Cooldown state: dash is special, others use magicCooldowns
  let onCd = false, cooldownPct = 0;
  if (ability.name === 'Dash') {
    onCd = (curPlayer.dashCooldown || 0) > 0;
    cooldownPct = curPlayer.dashCooldownMax ? (curPlayer.dashCooldown / curPlayer.dashCooldownMax) : 0;
  } else {
    const cd = curPlayer.magicCooldowns?.[ability.name] || 0;
    onCd = cd > 0;
    cooldownPct = ability.cooldown ? (cd / ability.cooldown) : 0;
  }
  // Mana cost
  const canAfford = mp >= (ability.manaCost || 0);
  // Active state (for buffs, etc)
  let active = false;
  if (typeof ability.active === 'boolean') {
    active = ability.active;
  } else if (ability.name === 'Dash') {
    active = !!curPlayer.isDashing;
  } else if (ability.name === 'ForceField') {
    // Find the instance for this player
    active = !!(ability.active);
  } else if (ability.name === 'Meditate') {
    active = !!(ability.active);
  }

  // Icon selection
  let iconUrl = icons[moveId] || icons.empty;
  // Fallback for known moves
  if (ability.name === 'Dash') iconUrl = icons.dash;
  if (ability.name === 'Combustion') iconUrl = icons.combustion;
  if (ability.name === 'ForceField') iconUrl = icons.forceField;
  if (ability.name === 'Meditate') iconUrl = icons.meditate;

  return mk({
    nameLabel: `${ability.name} `,
    locked,
    unlockLevel: ability.requiredLevel || 1,
    onCd: onCd && !locked,
    cooldownPct: onCd && !locked ? cooldownPct : 0,
    canAfford: canAfford && !locked,
    active: active && !locked,
    iconUrl
  });
}

function updateMoveHotbarDOM(curPlayer) {
  const dom = ensureMoveHotbarDOM();

  // Only show if we have a player + spells
  if (!curPlayer || !curPlayer.spells) {
    dom.root.style.display = "none";
    return;
  }
  dom.root.style.display = "block";

  const slotLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const moves = Array.isArray(curPlayer.movesSlots) ? curPlayer.movesSlots : [];
  const movesForHud = moves.slice(0, 10);
  while (movesForHud.length < 10) movesForHud.push(null);

  for (let i = 0; i < 10; i++) {
    const moveId = movesForHud[i];
    const entry = getMoveEntryForDOM(curPlayer, moveId, slotLabels[i]);
    const s = dom.slots[i];

    // Hide slot if not filled
    if (!moveId) {
      s.slot.style.display = "none";
      continue;
    } else {
      s.slot.style.display = "";
    }

    const noMana = !entry.canAfford && !entry.locked;
    const locked = entry.locked;
    const onCd = entry.onCd && !locked;

    // ======================
    // STATE CLASSES
    // ======================
    s.slot.classList.toggle("isLocked", locked);
    s.slot.classList.toggle("isOnCd", onCd);
    s.slot.classList.toggle("isActive", entry.active && !locked);
    s.slot.classList.toggle("cantAfford", noMana);

    // ======================
    // ICON
    // ======================
    if (s.icon.src !== entry.iconUrl) {
      s.icon.src = entry.iconUrl;
    }

    // ======================
    // COOLDOWN OVERLAY
    // ======================
    if (onCd) {
      s.cd.style.height = `${(entry.cooldownPct * 100).toFixed(2)}%`;
      s.cd.style.display = "block";
    } else {
      s.cd.style.height = "0%";
      s.cd.style.display = "none";
    }

    // ======================
    // KEY LABEL (BIG + OBVIOUS)
    // ======================
    if (locked) {
      s.key.textContent = `🔒 L${entry.unlockLevel}`;
      s.key.classList.add("lockedKey");
      s.key.classList.remove("noManaKey");
    } else if (noMana) {
      s.key.textContent = "⛔";
      s.key.classList.add("noManaKey");
      s.key.classList.remove("lockedKey");
    } else {
      s.key.textContent = entry.label;
      s.key.classList.remove("lockedKey", "noManaKey");
    }

    // ======================
    // NAME LABEL
    // ======================
    if (locked) {
      s.name.textContent = `Unlocks Lv ${entry.unlockLevel}`;
      s.name.classList.add("lockedName");
      s.name.classList.remove("noManaName");
    } else if (noMana) {
      s.name.textContent = "NO MANA";
      s.name.classList.add("noManaName");
      s.name.classList.remove("lockedName");
    } else {
      s.name.textContent = entry.nameLabel;
      s.name.classList.remove("lockedName", "noManaName");
    }
  }
}


// Exported for use in main UI
window.ensureMoveSlots = ensureMoveSlots;
window.showMovesEditor = showMovesEditor;
window.defineMovesEditorUI = defineMovesEditorUI;
window.refreshMovesEditorUI = refreshMovesEditorUI;
window.renderHotbarUI = renderHotbarUI;
window.ALL_MOVES = ALL_MOVES;
