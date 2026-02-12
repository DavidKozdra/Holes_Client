/*******************************************************
 * touchControls.js — Mobile Touch Input System
 * Provides: virtual joystick, action buttons, touch aim
 * Only activates on touch-capable devices.
 *******************************************************/

// ─── Device Detection ───────────────────────────────
var isMobileDevice = false;

function detectMobile() {
  isMobileDevice = (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0)
  );
  // Also check screen size — small screens are almost certainly mobile
  if (window.innerWidth <= 1024 && isMobileDevice) {
    isMobileDevice = true;
  }
  return isMobileDevice;
}

// Run on load
detectMobile();

// ─── Global Touch State ─────────────────────────────
var touchJoystick = {
  active: false,
  identifier: -1,
  origin: { x: 0, y: 0 },   // center of joystick
  current: { x: 0, y: 0 },   // current thumb position
  vector: { x: 0, y: 0 },    // normalized direction (-1 to 1)
  radius: 60,                 // max joystick radius
  deadzone: 0.15
};

var touchAim = {
  active: false,
  identifier: -1,
  x: 0,
  y: 0,
  startX: 0,
  startY: 0,
  isTap: false,
  tapThreshold: 15,
  tapTime: 0,
  tapMaxDuration: 250  // ms
};

// Track which action button is being pressed
var touchActions = {
  dig: false,
  fill: false,        // right-click equivalent
  interact: false,
  inventory: false,
  crafting: false,
  build: false,
  pause: false,
  dash: false,
  hotbarLeft: false,
  hotbarRight: false
};

// ─── Touch Controls DOM ─────────────────────────────
var _touchControlsRoot = null;
var _joystickContainer = null;
var _joystickBase = null;
var _joystickThumb = null;
var _actionButtons = {};

function createTouchControlsUI() {
  if (_touchControlsRoot) return; // already created
  if (!isMobileDevice) return;

  // ── CSS ──
  const style = document.createElement('style');
  style.id = 'touch-controls-styles';
  style.textContent = `
    /* ─── Virtual Joystick ─── */
    #touch-joystick-area {
      position: fixed;
      left: 0;
      bottom: 0;
      width: 40vw;
      height: 50vh;
      z-index: 9990;
      touch-action: none;
      pointer-events: auto;
    }

    #touch-joystick-base {
      position: absolute;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      border: 3px solid rgba(255, 255, 255, 0.25);
      display: none;
      pointer-events: none;
      transform: translate(-50%, -50%);
    }

    #touch-joystick-thumb {
      position: absolute;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.6), rgba(255,255,255,0.2));
      border: 2px solid rgba(255, 255, 255, 0.5);
      display: none;
      pointer-events: none;
      transform: translate(-50%, -50%);
    }

    /* ─── Action Buttons Container ─── */
    #touch-action-buttons {
      position: fixed;
      right: 12px;
      bottom: 220px;
      z-index: 9990;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .touch-btn-row {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      pointer-events: none;
    }

    .touch-btn {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.3);
      background: rgba(0, 0, 0, 0.45);
      color: white;
      font-family: 'Press Start 2P', monospace;
      font-size: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      touch-action: none;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
      line-height: 1.1;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      transition: transform 0.1s;
    }

    .touch-btn:active, .touch-btn.pressed {
      transform: scale(0.88);
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.6);
    }

    .touch-btn.primary {
      width: 76px;
      height: 76px;
      font-size: 10px;
      border-color: rgba(255, 200, 80, 0.5);
      background: rgba(90, 60, 20, 0.5);
    }

    .touch-btn.primary:active, .touch-btn.primary.pressed {
      background: rgba(160, 120, 40, 0.5);
      border-color: rgba(255, 200, 80, 0.8);
    }

    .touch-btn.danger {
      border-color: rgba(255, 80, 80, 0.5);
      background: rgba(80, 20, 20, 0.45);
    }

    .touch-btn.danger:active, .touch-btn.danger.pressed {
      background: rgba(160, 40, 40, 0.5);
      border-color: rgba(255, 80, 80, 0.8);
    }

    /* ─── Top-bar Buttons (Inventory, Craft, Build, Pause) ─── */
    #touch-top-buttons {
      position: fixed;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9990;
      display: flex;
      gap: 8px;
      pointer-events: none;
    }

    .touch-top-btn {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      border: 2px solid rgba(255, 255, 255, 0.25);
      background: rgba(0, 0, 0, 0.55);
      color: white;
      font-family: 'Press Start 2P', monospace;
      font-size: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      touch-action: none;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
      line-height: 1.2;
      transition: transform 0.1s;
    }

    .touch-top-btn:active, .touch-top-btn.pressed {
      transform: scale(0.88);
      background: rgba(255, 255, 255, 0.2);
    }

    /* ─── Aim area (right side for digging direction) ─── */
    #touch-aim-area {
      position: fixed;
      right: 0;
      bottom: 0;
      width: 60vw;
      height: 50vh;
      z-index: 9985;
      touch-action: none;
      pointer-events: auto;
    }

    /* ─── Hotbar swipe arrows ─── */
    #touch-hotbar-arrows {
      position: fixed;
      right: 12px;
      bottom: 140px;
      z-index: 9990;
      display: flex;
      gap: 12px;
      pointer-events: none;
    }

    .touch-hotbar-arrow {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      border: 2px solid rgba(255, 255, 255, 0.25);
      background: rgba(0, 0, 0, 0.45);
      color: white;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: none;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
    }

    .touch-hotbar-arrow:active {
      transform: scale(0.88);
      background: rgba(255, 255, 255, 0.2);
    }

    /* Hide keyboard-only hints on mobile */
    .mobile-hidden {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // ── Root Container ──
  _touchControlsRoot = document.createElement('div');
  _touchControlsRoot.id = 'touch-controls-root';

  // ── Joystick Area (left side) ──
  _joystickContainer = document.createElement('div');
  _joystickContainer.id = 'touch-joystick-area';

  _joystickBase = document.createElement('div');
  _joystickBase.id = 'touch-joystick-base';

  _joystickThumb = document.createElement('div');
  _joystickThumb.id = 'touch-joystick-thumb';

  _joystickContainer.appendChild(_joystickBase);
  _joystickContainer.appendChild(_joystickThumb);

  // ── Aim Area (right side, for drag-to-aim digging) ──
  const aimArea = document.createElement('div');
  aimArea.id = 'touch-aim-area';

  // ── Action Buttons (right side) ──
  const actionRoot = document.createElement('div');
  actionRoot.id = 'touch-action-buttons';

  // Row 1: Interact
  const row1 = _createRow();
  _actionButtons.interact = _createButton('ACT', 'touch-btn', 'interact');
  row1.appendChild(_actionButtons.interact);
  actionRoot.appendChild(row1);

  // Row 2: Dig + Fill
  const row2 = _createRow();
  _actionButtons.dig = _createButton('DIG', 'touch-btn primary', 'dig');
  _actionButtons.fill = _createButton('FILL', 'touch-btn danger', 'fill');
  row2.appendChild(_actionButtons.fill);
  row2.appendChild(_actionButtons.dig);
  actionRoot.appendChild(row2);

  // Row 3: Dash
  const row3 = _createRow();
  _actionButtons.dash = _createButton('DASH', 'touch-btn', 'dash');
  row3.appendChild(_actionButtons.dash);
  actionRoot.appendChild(row3);

  // ── Top Bar (Inventory, Crafting, Build, Pause) ──
  const topBar = document.createElement('div');
  topBar.id = 'touch-top-buttons';

  _actionButtons.inventory = _createButton('INV', 'touch-top-btn', 'inventory');
  _actionButtons.crafting = _createButton('CRFT', 'touch-top-btn', 'crafting');
  _actionButtons.build = _createButton('BLD', 'touch-top-btn', 'build');
  _actionButtons.pause = _createButton('⏸', 'touch-top-btn', 'pause');

  topBar.appendChild(_actionButtons.inventory);
  topBar.appendChild(_actionButtons.crafting);
  topBar.appendChild(_actionButtons.build);
  topBar.appendChild(_actionButtons.pause);

  // ── Hotbar Arrows ──
  const hotbarArrows = document.createElement('div');
  hotbarArrows.id = 'touch-hotbar-arrows';

  _actionButtons.hotbarLeft = _createButton('◀', 'touch-hotbar-arrow', 'hotbarLeft');
  _actionButtons.hotbarRight = _createButton('▶', 'touch-hotbar-arrow', 'hotbarRight');

  hotbarArrows.appendChild(_actionButtons.hotbarLeft);
  hotbarArrows.appendChild(_actionButtons.hotbarRight);

  // ── Assemble ──
  _touchControlsRoot.appendChild(_joystickContainer);
  _touchControlsRoot.appendChild(aimArea);
  _touchControlsRoot.appendChild(actionRoot);
  _touchControlsRoot.appendChild(topBar);
  _touchControlsRoot.appendChild(hotbarArrows);
  document.body.appendChild(_touchControlsRoot);

  // ── Attach Event Listeners ──
  _attachJoystickListeners();
  _attachAimListeners(aimArea);
  _attachButtonListeners();
}

function _createRow() {
  const row = document.createElement('div');
  row.className = 'touch-btn-row';
  return row;
}

function _createButton(label, className, action) {
  const btn = document.createElement('div');
  btn.className = className;
  btn.textContent = label;
  btn.dataset.action = action;
  return btn;
}

// ─── Joystick Listeners ─────────────────────────────
function _attachJoystickListeners() {
  _joystickContainer.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (touchJoystick.active) return;
    const t = e.changedTouches[0];
    touchJoystick.active = true;
    touchJoystick.identifier = t.identifier;
    touchJoystick.origin.x = t.clientX;
    touchJoystick.origin.y = t.clientY;
    touchJoystick.current.x = t.clientX;
    touchJoystick.current.y = t.clientY;
    touchJoystick.vector.x = 0;
    touchJoystick.vector.y = 0;

    _joystickBase.style.display = 'block';
    _joystickThumb.style.display = 'block';
    _joystickBase.style.left = t.clientX + 'px';
    _joystickBase.style.top = t.clientY + 'px';
    _joystickThumb.style.left = t.clientX + 'px';
    _joystickThumb.style.top = t.clientY + 'px';
  }, { passive: false });

  _joystickContainer.addEventListener('touchmove', function(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchJoystick.identifier) {
        _updateJoystick(t.clientX, t.clientY);
        break;
      }
    }
  }, { passive: false });

  const endJoystick = function(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchJoystick.identifier) {
        touchJoystick.active = false;
        touchJoystick.identifier = -1;
        touchJoystick.vector.x = 0;
        touchJoystick.vector.y = 0;

        _joystickBase.style.display = 'none';
        _joystickThumb.style.display = 'none';
        break;
      }
    }
  };

  _joystickContainer.addEventListener('touchend', endJoystick, { passive: false });
  _joystickContainer.addEventListener('touchcancel', endJoystick, { passive: false });
}

function _updateJoystick(cx, cy) {
  let dx = cx - touchJoystick.origin.x;
  let dy = cy - touchJoystick.origin.y;
  let dist = Math.sqrt(dx * dx + dy * dy);

  // Clamp to radius
  if (dist > touchJoystick.radius) {
    dx = (dx / dist) * touchJoystick.radius;
    dy = (dy / dist) * touchJoystick.radius;
    dist = touchJoystick.radius;
  }

  touchJoystick.current.x = touchJoystick.origin.x + dx;
  touchJoystick.current.y = touchJoystick.origin.y + dy;

  // Normalize to -1..1
  let nx = dx / touchJoystick.radius;
  let ny = dy / touchJoystick.radius;

  // Apply deadzone
  const mag = Math.sqrt(nx * nx + ny * ny);
  if (mag < touchJoystick.deadzone) {
    touchJoystick.vector.x = 0;
    touchJoystick.vector.y = 0;
  } else {
    touchJoystick.vector.x = nx;
    touchJoystick.vector.y = ny;
  }

  // Move thumb visual
  _joystickThumb.style.left = touchJoystick.current.x + 'px';
  _joystickThumb.style.top = touchJoystick.current.y + 'px';
}

// ─── Aim Area Listeners (right side for dig targeting) ───
function _attachAimListeners(aimArea) {
  aimArea.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (touchAim.active) return;
    const t = e.changedTouches[0];
    touchAim.active = true;
    touchAim.identifier = t.identifier;
    touchAim.startX = t.clientX;
    touchAim.startY = t.clientY;
    touchAim.x = t.clientX;
    touchAim.y = t.clientY;
    touchAim.tapTime = performance.now();
    touchAim.isTap = true;
  }, { passive: false });

  aimArea.addEventListener('touchmove', function(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchAim.identifier) {
        touchAim.x = t.clientX;
        touchAim.y = t.clientY;
        // Check if moved beyond tap threshold
        const dx = touchAim.x - touchAim.startX;
        const dy = touchAim.y - touchAim.startY;
        if (Math.sqrt(dx * dx + dy * dy) > touchAim.tapThreshold) {
          touchAim.isTap = false;
        }
        break;
      }
    }
  }, { passive: false });

  const endAim = function(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchAim.identifier) {
        const elapsed = performance.now() - touchAim.tapTime;
        if (touchAim.isTap && elapsed < touchAim.tapMaxDuration) {
          // Tap = interact with object at that point
          _handleAimTap(touchAim.x, touchAim.y);
        }
        touchAim.active = false;
        touchAim.identifier = -1;
        break;
      }
    }
  };

  aimArea.addEventListener('touchend', endAim, { passive: false });
  aimArea.addEventListener('touchcancel', endAim, { passive: false });
}

function _handleAimTap(screenX, screenY) {
  // Convert screen tap to world coordinates and attempt interaction
  if (typeof camera === 'undefined' || typeof curPlayer === 'undefined' || !curPlayer) return;
  if (gameState !== 'playing') return;

  // Simulate the interact action at tap location
  const worldX = screenX + camera.pos.x - (width / 2);
  const worldY = screenY + camera.pos.y - (height / 2);

  if (typeof testMap !== 'undefined') {
    const chunkPos = testMap.globalToChunk(worldX, worldY);
    const chunk = getChunkFromPos(testMap.chunks, chunkPos);
    if (!chunk) return;

    let closest = null;
    let closestDist = Infinity;

    for (let i = 0; i < chunk.objects.length; i++) {
      const obj = chunk.objects[i];
      const isInteractable = obj.type === 'InvObj' || obj.objName === 'Door' ||
        (obj.type === 'Plant' &&
          obj.stage === (objImgs[obj.imgNum].length - 1) &&
          ((obj.color !== 0 && obj.color === curPlayer.color) ||
            (obj.ownerName === curPlayer.name && obj.color === 0)));

      if (isInteractable) {
        const dist = createVector(worldX, worldY).dist(obj.pos);
        const maxDist = obj.objName === 'ItemBag' ? 3 * TILESIZE : 4 * TILESIZE;
        if (dist < maxDist && dist < closestDist) {
          closest = obj;
          closestDist = dist;
        }
      }
    }

    if (closest) {
      const clickRange = closest.objName === 'ItemBag' ? 1.5 * TILESIZE : 2 * TILESIZE;
      if (closestDist < clickRange) {
        if (closest.type === 'InvObj') closest.useInv();
        else if (closest.type === 'Plant') closest.usePlant();
        else if (closest.objName === 'Door') closest.useDoor();
      }
    }
  }
}

// ─── Action Button Listeners ────────────────────────
function _attachButtonListeners() {
  // Generic press/release handling for continuous actions (dig, fill, dash)
  const continuousActions = ['dig', 'fill', 'dash'];
  continuousActions.forEach(function(action) {
    const btn = _actionButtons[action];
    if (!btn) return;

    btn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      touchActions[action] = true;
      btn.classList.add('pressed');
    }, { passive: false });

    btn.addEventListener('touchend', function(e) {
      e.preventDefault();
      touchActions[action] = false;
      btn.classList.remove('pressed');
    }, { passive: false });

    btn.addEventListener('touchcancel', function(e) {
      touchActions[action] = false;
      btn.classList.remove('pressed');
    }, { passive: false });
  });

  // One-shot actions (interact, inventory, crafting, build, pause)
  const oneShotActions = ['interact', 'inventory', 'crafting', 'build', 'pause'];
  oneShotActions.forEach(function(action) {
    const btn = _actionButtons[action];
    if (!btn) return;

    btn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      btn.classList.add('pressed');
    }, { passive: false });

    btn.addEventListener('touchend', function(e) {
      e.preventDefault();
      btn.classList.remove('pressed');
      _handleOneShotAction(action);
    }, { passive: false });

    btn.addEventListener('touchcancel', function(e) {
      btn.classList.remove('pressed');
    }, { passive: false });
  });

  // Hotbar arrows (one-shot with repeat ability)
  ['hotbarLeft', 'hotbarRight'].forEach(function(action) {
    const btn = _actionButtons[action];
    if (!btn) return;

    btn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      btn.classList.add('pressed');
      _handleHotbarScroll(action === 'hotbarLeft' ? -1 : 1);
    }, { passive: false });

    btn.addEventListener('touchend', function(e) {
      e.preventDefault();
      btn.classList.remove('pressed');
    }, { passive: false });

    btn.addEventListener('touchcancel', function(e) {
      btn.classList.remove('pressed');
    }, { passive: false });
  });
}

function _handleOneShotAction(action) {
  if (typeof curPlayer === 'undefined' || !curPlayer) return;

  switch (action) {
    case 'interact':
      if (gameState === 'playing') {
        // Trigger the interact key release code path
        _simulateInteract();
      }
      break;

    case 'inventory':
      if (gameState === 'playing') {
        gameState = 'inventory';
        curPlayer.invBlock.curItem = '';
        if (typeof updateItemList === 'function') updateItemList();
        if (typeof updatecurItemDiv === 'function') updatecurItemDiv();
        if (typeof invDiv !== 'undefined') invDiv.show();
        curPlayer.holding = { w: false, a: false, s: false, d: false };
      } else if (gameState === 'inventory') {
        gameState = 'playing';
        if (typeof invDiv !== 'undefined') invDiv.hide();
        if (typeof spaceBarDiv !== 'undefined') spaceBarDiv.hide();
        const heldItemName = curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar];
        const heldItem = heldItemName ? curPlayer.invBlock.items[heldItemName] : null;
        if (heldItem && heldItem.type === 'Seed') {
          ghostBuild = createObject(heldItem.plantName, 0, 0, 0, curPlayer.color, ' ', ' ');
          renderGhost = true;
        }
      } else if (gameState === 'swap_inv') {
        // Close swap inventory
        if (curPlayer.otherInv && curPlayer.otherInv.pos) {
          const chunkPos = testMap.globalToChunk(curPlayer.otherInv.pos.x, curPlayer.otherInv.pos.y);
          socket.emit('update_inv', {
            cx: chunkPos.x, cy: chunkPos.y,
            objName: curPlayer.otherInv.objName,
            pos: { x: curPlayer.otherInv.pos.x, y: curPlayer.otherInv.pos.y },
            z: curPlayer.otherInv.z,
            invId: curPlayer.otherInv.invBlock?.invId,
            items: curPlayer.otherInv.invBlock.items
          });
        }
        gameState = 'playing';
        if (typeof swapInvDiv !== 'undefined') swapInvDiv.hide();
        if (typeof spaceBarDiv !== 'undefined') spaceBarDiv.hide();
        curPlayer.otherInv = undefined;
      } else if (gameState === 'crafting') {
        // Switch from crafting to inventory
        gameState = 'inventory';
        if (typeof invDiv !== 'undefined') invDiv.show();
        curPlayer.invBlock.curItem = '';
        if (typeof updateItemList === 'function') updateItemList();
        if (typeof craftDiv !== 'undefined') craftDiv.hide();
      }
      break;

    case 'crafting':
      if (gameState === 'playing') {
        gameState = 'crafting';
        curPlayer.invBlock.curItem = '';
        if (typeof updateCraftList === 'function') updateCraftList();
        if (typeof updatecurCraftItemDiv === 'function') updatecurCraftItemDiv();
        if (typeof craftDiv !== 'undefined') craftDiv.show();
        curPlayer.holding = { w: false, a: false, s: false, d: false };
      } else if (gameState === 'crafting') {
        gameState = 'playing';
        if (typeof craftDiv !== 'undefined') craftDiv.hide();
      } else if (gameState === 'inventory') {
        gameState = 'crafting';
        if (typeof craftDiv !== 'undefined') craftDiv.show();
        curPlayer.invBlock.curItem = '';
        if (typeof updateCraftList === 'function') updateCraftList();
        if (typeof invDiv !== 'undefined') invDiv.hide();
        if (typeof spaceBarDiv !== 'undefined') spaceBarDiv.hide();
      }
      break;

    case 'build':
      if (gameState !== 'playing') return;
      const slot = curPlayer.invBlock.selectedHotBar;
      const option = typeof buildOptions !== 'undefined' ? buildOptions[slot] : null;
      if (!option) return;
      ghostBuild = createObject(option.objName, 0, 0, 0, 0, curPlayer.id, curPlayer.name);
      buildMode = !buildMode;
      renderGhost = buildMode;
      if (!buildMode && curPlayer.invBlock.selectedHotBar > 4) {
        curPlayer.invBlock.selectedHotBar = 4;
      }
      break;

    case 'pause':
      if (gameState === 'playing') {
        gameState = 'pause';
        if (typeof pauseDiv !== 'undefined') {
          pauseDiv.show();
          pauseDiv.style('display', 'flex');
        }
      } else if (gameState === 'pause') {
        gameState = 'playing';
        if (typeof pauseDiv !== 'undefined') pauseDiv.hide();
      }
      break;
  }
}

function _simulateInteract() {
  if (!curPlayer || gameState !== 'playing') return;

  // Use player position for interaction (auto-interact with nearest object)
  const searchPos = curPlayer.pos.copy();
  const chunkPos = testMap.globalToChunk(searchPos.x, searchPos.y);
  const chunk = getChunkFromPos(testMap.chunks, chunkPos);
  if (!chunk) return;

  let closest = null;
  let closestDist = Infinity;

  for (let i = 0; i < chunk.objects.length; i++) {
    const obj = chunk.objects[i];
    const isInteractable = obj.type === 'InvObj' || obj.objName === 'Door' ||
      (obj.type === 'Plant' &&
        obj.stage === (objImgs[obj.imgNum].length - 1) &&
        ((obj.color !== 0 && obj.color === curPlayer.color) ||
          (obj.ownerName === curPlayer.name && obj.color === 0)));

    if (isInteractable) {
      const maxDist = obj.objName === 'ItemBag' ? 3 * TILESIZE : 4 * TILESIZE;
      const dist = curPlayer.pos.dist(obj.pos);
      if (dist < maxDist && dist < closestDist) {
        closest = obj;
        closestDist = dist;
      }
    }
  }

  if (closest) {
    if (closest.type === 'InvObj') closest.useInv();
    else if (closest.type === 'Plant') closest.usePlant();
    else if (closest.objName === 'Door') closest.useDoor();
  }
}

function _handleHotbarScroll(direction) {
  if (typeof curPlayer === 'undefined' || !curPlayer) return;
  if (gameState !== 'playing' && gameState !== 'inventory') return;

  hotBarOffset = direction;
  mouseWheelMoved = true;
  if (typeof updatePlayerHotBarOffset === 'function') {
    updatePlayerHotBarOffset();
  }
  mouseWheelMoved = false;
}

// ─── Touch → Game Input Bridge (called every frame) ─
function applyTouchInput() {
  if (!isMobileDevice || !_touchControlsRoot) return;
  if (typeof curPlayer === 'undefined' || !curPlayer) return;
  if (gameState !== 'playing') return;

  // ── Joystick → Movement ──
  if (touchJoystick.active) {
    const vx = touchJoystick.vector.x;
    const vy = touchJoystick.vector.y;

    curPlayer.holding.w = vy < -0.3;
    curPlayer.holding.a = vx < -0.3;
    curPlayer.holding.s = vy > 0.3;
    curPlayer.holding.d = vx > 0.3;
  }

  // ── Dash ──
  if (touchActions.dash) {
    const dashAbility = (window.magicAbilities || []).find(function(a) {
      return a.name.toLowerCase() === 'dash';
    });
    if (dashAbility && typeof dashAbility.activate === 'function') {
      dashAbility.activate(curPlayer);
    }
  }

  // ── Dig/Fill (continuous, simulates mouse held) ──
  if (touchActions.dig || touchActions.fill) {
    if (curPlayer.isConcentrating) return;

    // Determine world aim position
    let aimWorldX, aimWorldY;

    if (touchAim.active) {
      // Use aim touch position
      aimWorldX = touchAim.x + camera.pos.x - width / 2;
      aimWorldY = touchAim.y + camera.pos.y - height / 2;
    } else {
      // Auto-aim: use player facing direction (based on joystick or last movement)
      const aimDist = 3 * TILESIZE;
      if (touchJoystick.active && (Math.abs(touchJoystick.vector.x) > 0.1 || Math.abs(touchJoystick.vector.y) > 0.1)) {
        aimWorldX = curPlayer.pos.x + touchJoystick.vector.x * aimDist;
        aimWorldY = curPlayer.pos.y + touchJoystick.vector.y * aimDist;
      } else {
        // Fallback: dig in the direction player is facing
        const facing = _getPlayerFacingDir();
        aimWorldX = curPlayer.pos.x + facing.x * aimDist;
        aimWorldY = curPlayer.pos.y + facing.y * aimDist;
      }
    }

    if (touchActions.dig) {
      // Left-click equivalent
      if (!buildMode) {
        if (curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar] !== '') {
          const heldItem = curPlayer.invBlock.items[curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]];
          if (heldItem) heldItem.use(aimWorldX, aimWorldY, LEFT);
        } else {
          if (typeof dirtInv !== 'undefined' && typeof maxDirtInv !== 'undefined' && typeof DIGSPEED !== 'undefined') {
            if (dirtInv < maxDirtInv - DIGSPEED) {
              playerDig(aimWorldX, aimWorldY, DIGSPEED);
            } else {
              dirtBagUI.shake = { intensity: dirtBagUI.shake.intensity + 0.1, length: 1 };
            }
          }
        }
      } else {
        // Build mode - place building at aim position
        if (ghostBuild && ghostBuild.openBool) {
          // Reuse the build placement logic from continousMouseInput
          _touchPlaceBuild(aimWorldX, aimWorldY);
        }
      }
    }

    if (touchActions.fill) {
      // Right-click equivalent
      if (!buildMode) {
        if (curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar] !== '') {
          const heldItem = curPlayer.invBlock.items[curPlayer.invBlock.hotbar[curPlayer.invBlock.selectedHotBar]];
          if (heldItem) heldItem.use(aimWorldX, aimWorldY, RIGHT);
        } else {
          if (typeof dirtInv !== 'undefined' && typeof DIGSPEED !== 'undefined') {
            if (dirtInv > DIGSPEED) {
              playerDig(aimWorldX, aimWorldY, -DIGSPEED);
            }
          }
        }
      } else {
        // Build mode - delete building
        _touchDeleteBuild(aimWorldX, aimWorldY);
      }
    }
  }
}

function _getPlayerFacingDir() {
  // Determine player facing from last movement or default right
  if (typeof curPlayer === 'undefined' || !curPlayer) return { x: 1, y: 0 };

  const h = curPlayer.holding;
  let fx = 0, fy = 0;
  if (h.d) fx += 1;
  if (h.a) fx -= 1;
  if (h.s) fy += 1;
  if (h.w) fy -= 1;

  if (fx === 0 && fy === 0) {
    // Use player's animation type to guess facing
    return { x: 1, y: 0 }; // default right
  }

  const mag = Math.sqrt(fx * fx + fy * fy);
  return { x: fx / mag, y: fy / mag };
}

function _touchPlaceBuild(worldX, worldY) {
  if (!ghostBuild || typeof objDic === 'undefined') return;

  let hasCost = true;
  for (let i = 0; i < objDic[ghostBuild.objName].cost.length; i++) {
    const costItem = objDic[ghostBuild.objName].cost[i];
    if (costItem[0] === 'dirt') {
      if (dirtInv < costItem[1]) hasCost = false;
    } else {
      const inv = curPlayer.invBlock.items[costItem[0]];
      if (!inv || inv.amount < costItem[1]) hasCost = false;
    }
    if (!hasCost) break;
  }

  if (hasCost) {
    for (let i = 0; i < objDic[ghostBuild.objName].cost.length; i++) {
      const costItem = objDic[ghostBuild.objName].cost[i];
      if (costItem[0] === 'dirt') dirtInv -= costItem[1];
      else curPlayer.invBlock.decreaseAmount(costItem[0], costItem[1]);
    }

    const chunkPos = testMap.globalToChunk(worldX, worldY);
    const chunkKey = chunkPos.key || getChunkKey(chunkPos.x, chunkPos.y);
    const chunk = testMap.chunks[chunkKey];
    if (!chunk) return;

    const temp = createObject(ghostBuild.objName, ghostBuild.pos.x, ghostBuild.pos.y, ghostBuild.rot, curPlayer.color, curPlayer.id, curPlayer.name);
    chunk.objects.push(temp);
    chunk.objects.sort(function(a, b) { return a.z - b.z; });
    socket.emit('new_object', { cx: chunkPos.x, cy: chunkPos.y, obj: temp });

    curPlayer.animationCreate('put');
    if (typeof renderBuildOptions === 'function') renderBuildOptions();
  }
}

function _touchDeleteBuild(worldX, worldY) {
  const chunkPos = testMap.globalToChunk(worldX, worldY);
  const chunk = getChunkFromPos(testMap.chunks, chunkPos);
  if (!chunk) return;

  for (let i = 0; i < chunk.objects.length; i++) {
    const obj = chunk.objects[i];
    if (createVector(worldX, worldY).dist(obj.pos) < (obj.size.w + obj.size.h) / 4) {
      if ((obj.color === 0 && obj.ownerName === curPlayer.name) ||
          (obj.color !== 0 && obj.color === curPlayer.color)) {
        socket.emit('delete_obj', {
          cx: chunkPos.x, cy: chunkPos.y,
          objName: obj.objName,
          pos: { x: obj.pos.x, y: obj.pos.y },
          z: obj.z
        });
        chunk.objects.splice(i, 1);
        break;
      }
    }
  }
}

// ─── Show / Hide Controls Based on Game State ───────
function updateTouchControlsVisibility() {
  if (!isMobileDevice || !_touchControlsRoot) return;

  const inGame = (gameState === 'playing');
  const inMenu = (gameState === 'inventory' || gameState === 'crafting' ||
                  gameState === 'swap_inv' || gameState === 'pause' ||
                  gameState === 'dead' || gameState === 'player_status');

  // Joystick area - only during gameplay
  _joystickContainer.style.display = inGame ? '' : 'none';

  // Aim area
  document.getElementById('touch-aim-area').style.display = inGame ? '' : 'none';

  // Action buttons - only during gameplay
  document.getElementById('touch-action-buttons').style.display = inGame ? '' : 'none';

  // Hotbar arrows - only during gameplay
  document.getElementById('touch-hotbar-arrows').style.display = inGame ? '' : 'none';

  // Top buttons - always visible in game (to let them close menus)
  const topBtns = document.getElementById('touch-top-buttons');
  topBtns.style.display = (inGame || inMenu) ? '' : 'none';

  // Reset pressed states when switching states
  if (!inGame) {
    touchActions.dig = false;
    touchActions.fill = false;
    touchActions.dash = false;
    touchJoystick.vector.x = 0;
    touchJoystick.vector.y = 0;
    Object.values(_actionButtons).forEach(function(btn) {
      btn.classList.remove('pressed');
    });
  }
}

// ─── Ghost Build Positioning for Touch ──────────────
function updateGhostBuildTouch() {
  if (!isMobileDevice || !renderGhost || !ghostBuild) return;
  if (gameState !== 'playing') return;

  // Position ghost at aim point or in front of player
  if (touchAim.active) {
    ghostBuild.pos.x = touchAim.x + camera.pos.x - width / 2;
    ghostBuild.pos.y = touchAim.y + camera.pos.y - height / 2;
  } else if (touchJoystick.active) {
    const aimDist = 3 * TILESIZE;
    ghostBuild.pos.x = curPlayer.pos.x + touchJoystick.vector.x * aimDist;
    ghostBuild.pos.y = curPlayer.pos.y + touchJoystick.vector.y * aimDist;
  }
}
