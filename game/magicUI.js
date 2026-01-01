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
    panel.style("grid-template-columns", "300px 1fr");
    panel.style("gap", "12px");
    panel.style("width", "80vw");
    panel.style("max-width", "1200px");
    panel.style("max-height", "80vh");
    
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
    movesSlotList.style("padding", "12px");
    movesSlotList.style("overflow-y", "auto");
    movesSlotList.style("background", "#222");
    movesSlotList.style("max-height", "calc(80vh - 100px)");
    
    movesAllList = createDiv().parent(panel);
    movesAllList.style("border-radius", "8px");
    movesAllList.style("padding", "12px");
    movesAllList.style("overflow-y", "auto");
    movesAllList.style("background", "#222");
    movesAllList.style("max-height", "calc(80vh - 100px)");
}

function refreshMovesEditorUI() {
    if (!curPlayer) return;
    ensureMoveSlots();
    const slotKeys = ['1','2','3','4','5','6','7','8','9','0'];
    
    // Left panel: Slots
    movesSlotList.html('<div style="margin-bottom:12px; font-weight:bold; font-size:16px; color:#aef;">Your Slots</div>');
    for (let i = 0; i < 10; i++) {
        const moveId = curPlayer.movesSlots[i];
        const move = moveId ? ALL_MOVES.find(m => m.id === moveId) : null;
        const displayName = move ? move.name : 'Empty';
        const slotBtn = createButton(`${slotKeys[i]}: ${displayName}`).parent(movesSlotList);
        slotBtn.style("width", "100%");
        slotBtn.style("margin-bottom", "6px");
        slotBtn.style("padding", "10px");
        slotBtn.style("background", i === selectedMoveSlotIdx ? "#4a9eff" : "#333");
        slotBtn.style("color", i === selectedMoveSlotIdx ? "#fff" : (moveId ? "#aef" : "#888"));
        slotBtn.style("border", i === selectedMoveSlotIdx ? "3px solid #fff" : "1px solid #555");
        slotBtn.style("cursor", "pointer");
        slotBtn.style("text-align", "left");
        slotBtn.style("font-size", "14px");
        slotBtn.style("font-weight", i === selectedMoveSlotIdx ? "bold" : "normal");
        slotBtn.style("transition", "all 0.2s");
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
    
    // Right panel: Available spells in a grid
    let html = `<div style="margin-bottom:12px; font-weight:bold; font-size:16px; color:#aef;">Available Spells</div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:12px;">`;
    
    for (const move of ALL_MOVES) {
        const ability = magicAbilities.find(a => a.name.toLowerCase().replace(/\s+/g, '') === move.id);
        const iconKey = move.id + '_icon';
        
        // Generate spell icon
        let iconDataUrl = '';
        if (typeof getSpellIcon === 'function') {
            const iconGraphics = getSpellIcon(iconKey, (g) => {
                g.clear();
                g.push();
                g.translate(g.width / 2, g.height / 2);
                // Simple colored circle for now - you can customize per spell
                g.noStroke();
                const col = move.color || { r: 120, g: 200, b: 255 };
                g.fill(col.r, col.g, col.b);
                g.ellipse(0, 0, 20, 20);
                g.fill(255);
                g.textAlign(g.CENTER, g.CENTER);
                g.textSize(10);
                g.text(move.name.substring(0, 2).toUpperCase(), 0, 0);
                g.pop();
            });
            if (iconGraphics && iconGraphics.canvas) {
                iconDataUrl = iconGraphics.canvas.toDataURL('image/png');
            }
        }
        
        html += `<div class='spell-card' data-moveid='${move.id}' style="
            background:#333; 
            border:2px solid #555; 
            border-radius:8px; 
            padding:8px; 
            cursor:pointer; 
            text-align:center;
            transition: all 0.2s;
            position:relative;
        " 
        onmouseover="this.style.background='#444';this.style.borderColor='#aef';" 
        onmouseout="this.style.background='#333';this.style.borderColor='#555';">
            ${iconDataUrl ? `<img src="${iconDataUrl}" style="width:48px;height:48px;image-rendering:pixelated;margin-bottom:6px;">` : ''}
            <div style="font-size:12px;font-weight:bold;color:#aef;margin-bottom:4px;">${move.name}</div>
            <div style="font-size:10px;color:#ff8;margin-bottom:4px;">Lv ${move.requiredLevel}</div>
            <div style="font-size:10px;color:#8cf;">${move.manaCost} MP</div>
            <div style="font-size:9px;color:#999;margin-top:4px;line-height:1.2;">${move.description}</div>
            <button class='assign-move-btn' data-moveid='${move.id}' style="
                margin-top:8px;
                padding:6px 12px;
                cursor:pointer;
                background:#4a9eff;
                color:white;
                border:none;
                border-radius:4px;
                font-weight:bold;
                font-size:11px;
                width:100%;
            ">Assign to [${slotKeys[selectedMoveSlotIdx]}]</button>
        </div>`;
    }
    
    html += '</div>';
    movesAllList.html(html);
    
    // Add event listeners for assign buttons
    movesAllList.elt.querySelectorAll('.assign-move-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const moveId = btn.getAttribute('data-moveid');
            curPlayer.movesSlots[selectedMoveSlotIdx] = moveId;
            refreshMovesEditorUI();
        };
    });
    
    // Add event listeners for spell cards (click anywhere to assign)
    movesAllList.elt.querySelectorAll('.spell-card').forEach(card => {
        const assignBtn = card.querySelector('.assign-move-btn');
        card.onclick = (e) => {
            if (e.target === assignBtn) return; // Let button handle its own click
            const moveId = card.getAttribute('data-moveid');
            curPlayer.movesSlots[selectedMoveSlotIdx] = moveId;
            refreshMovesEditorUI();
        };
    });
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
        z-index: 9999;
        pointer-events: none;
        user-select: none;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        max-width: 50dvw;
      }

      #moveHotbarBar {
        display: flex;
        gap: 22px;
        align-items: flex-end;
        padding: 14px 18px;
        border-radius: 14px;
        background: rgba(0,0,0,0.45);
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .moveSlot {
        position: relative;
        width: 112px;
        height: 112px;
        border-radius: 12px;
        border: 4px solid rgba(140,240,140,0.9);
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
