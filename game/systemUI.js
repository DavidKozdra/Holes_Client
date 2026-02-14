// System UI Module: Pause Menu, Settings, Key Bindings, Player Status
// Handles all system-level UI (pause, settings, controls, leaderboard)

// ─────────────────────────────────────────────────────────
// Globals
// ─────────────────────────────────────────────────────────

var pauseDiv;
var resumeButton;
var serverSelectButton;
var gameSettingsContainer;
var oldState = "";
var player_status_container;
var bindingDiv;
var bindingTitle;
var contentDiv;
var doneButtonDiv;
var doneButton;
var namesDiv;
var keysDiv;

// Key binding button references
var Controls_Up, Controls_Left, Controls_Down, Controls_Right;
var Controls_Interact, Controls_Inventory, Controls_Crafting, Controls_Pause;
var Controls_MoveHotBarRight, Controls_MoveHotBarLeft, Controls_Build, Controls_Space, Controls_Dash;
// General spell key variables
var Controls_Spell_One, Controls_Spell_Two, Controls_Spell_Three, Controls_Spell_Four, Controls_Spell_Five, Controls_Spell_Six, Controls_Spell_Seven, Controls_Spell_Eight, Controls_Spell_Nine, Controls_Spell_Ten;

var Controls_Up_button, Controls_Left_button, Controls_Down_button, Controls_Right_button;
var Controls_Interact_button, Controls_Inventory_button, Controls_Crafting_button, Controls_Pause_button;
var Controls_MoveHotBarRight_button, Controls_MoveHotBarLeft_button, Controls_Build_button, Controls_Space_button, Controls_Dash_button;
var Controls_Spell_One_button, Controls_Spell_Two_button, Controls_Spell_Three_button, Controls_Spell_Four_button, Controls_Spell_Five_button, Controls_Spell_Six_button, Controls_Spell_Seven_button, Controls_Spell_Eight_button, Controls_Spell_Nine_button, Controls_Spell_Ten_button;

function updateSpellLockDisplay() {
    if (!curPlayer || !curPlayer.statBlock) return;
    const level = curPlayer.statBlock.level || 0;
    const setState = (el, required, buttonEl, label) => {
        if (!el) return;
        const locked = level < required;
        el.html(`${label} (Lvl ${required})${locked ? " - Locked" : " - Unlocked"}`);
        if (buttonEl) {
            buttonEl.style("opacity", locked ? "0.4" : "0.8");
        }
    };
    setState(Controls_ForceField, 3, Controls_ForceField_button, "Force Field");
    setState(Controls_Combustion, 8, Controls_Combustion_button, "Combustion");
    setState(Controls_Meditate, 14, Controls_Meditate_button, "Meditate");
}

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

function styleButton(button) {
    button.class("system-button");
}

function keyToVisualKey(key) {
    if (key == " ") { key = "Space"; }
    if (key == "ArrowUp") { key = "↑"; }
    if (key == "ArrowLeft") { key = "←"; }
    if (key == "ArrowDown") { key = "↓"; }
    if (key == "ArrowRight") { key = "→"; }

    return key;
}

// ─────────────────────────────────────────────────────────
// Pause UI (definePauseUI)
// ─────────────────────────────────────────────────────────

function definePauseUI() {
    gameSettingsContainer = createDiv();
    gameSettingsContainer.class("settings-container");
    gameSettingsContainer.hide();

    let title = createElement("h2", "Settings");
    title.parent(gameSettingsContainer);

    let sliderContainer = createDiv()
        .parent(gameSettingsContainer)
        .class("slider-container")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("gap", "15px")
        .style("margin", "20px 0");

    let effectsRow = createDiv()
        .parent(sliderContainer)
        .class("slider-row");

    let savedVolume = localStorage.getItem("volume");
    savedVolume = savedVolume !== null ? parseInt(savedVolume) : 50;

    let volumeLabel = createElement("label", "🔊 Volume:")
        .parent(effectsRow)
        .class("slider-label");

    volumeSlider = createSlider(0, 100, savedVolume)
        .parent(effectsRow)
        .class("slider-input");

    volumeSlider.input(() => {
        let v = volumeSlider.value();
        localStorage.setItem("volume", v);
        Object.values(soundDic).forEach(entry => {
            entry.sounds.slice(1).forEach((s, idx) => {
                s.setVolume(((idx + 1) / 20) * entry.volume * (v / 100));
            });
        });
    });

    let musicRow = createDiv()
        .parent(sliderContainer)
        .class("slider-row");

    let savedMusic = localStorage.getItem("musicVolume");
    savedMusic = savedMusic !== null ? parseInt(savedMusic) : 50;
    let musicVolLabel = createElement("label", "🎵 Music:")
        .parent(musicRow)
        .class("slider-label");

    musicVolumeSlider = createSlider(0, 100, savedMusic)
        .parent(musicRow)
        .class("slider-input");

    musicVolumeSlider.input(() => {
        let mv = musicVolumeSlider.value();
        localStorage.setItem("musicVolume", mv);
        if (MusicPlayer) MusicPlayer.setVolume();
    });

    keyBind_Button = createButton("Key Bindings");
    keyBind_Button.parent(sliderContainer);
    keyBind_Button.class("settings-button");
    keyBind_Button.mousePressed(() => {
        gameState = "controls";
        gameSettingsContainer.hide();
        bindingDiv.show();
        updateSpellLockDisplay();
    });

    // Password Management Button
    let passwordButton = createButton("🔐 Manage Password");
    passwordButton.parent(sliderContainer);
    passwordButton.class("settings-button");
    passwordButton.mousePressed(() => {
        if (!curPlayer || !curPlayer.name) {
            alert("You must be logged in to manage your password.");
            return;
        }
        
        const action = confirm("Do you want to set/change your password?\n\nClick OK to set a new password\nClick Cancel to remove password protection");
        
        if (action) {
            const newPass = prompt("Enter your new password:", "");
            if (newPass !== null && newPass !== "") {
                socket.emit("set_password", { password: newPass }, (resp) => {
                    if (resp && resp.ok) {
                        alert("✓ Password set successfully!\n\nYou will now be logged out to apply the changes.");
                        
                        // Save player data before disconnect (same as disconnect button)
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
                                console.log('[Password Set] Saving player data:', playerData);
                                socket.emit('save_player_state', playerData);
                                socket.emit('player_leave', {
                                    playerId: socket.id,
                                    playerName: curPlayer.name
                                });
                                socket.disconnect();
                            }
                        } catch (e) {
                            console.error('[Password Set] Error during save:', e);
                        }
                        setTimeout(() => { location.reload(); }, 150);
                    } else {
                        alert("✗ Failed to set password: " + (resp?.message || "Unknown error"));
                    }
                });
            }
        } else {
            // Remove password by setting it to empty
            const confirmRemove = confirm("Are you sure you want to remove password protection?\n\nYou will be logged out to apply the changes.");
            if (confirmRemove) {
                socket.emit("set_password", { password: "" }, (resp) => {
                    if (resp && resp.ok) {
                        alert("✓ Password protection removed!");
                        
                        // Save player data before disconnect (same as disconnect button)
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
                                console.log('[Password Remove] Saving player data:', playerData);
                                socket.emit('save_player_state', playerData);
                                socket.emit('player_leave', {
                                    playerId: socket.id,
                                    playerName: curPlayer.name
                                });
                                socket.disconnect();
                            }
                        } catch (e) {
                            console.error('[Password Remove] Error during save:', e);
                        }
                        setTimeout(() => { location.reload(); }, 150);
                    } else {
                        alert("✗ Failed to remove password: " + (resp?.message || "Unknown error"));
                    }
                });
            }
        }
    });

    removeData_button = createButton("Remove Data");
    removeData_button.parent(sliderContainer);
    removeData_button.class("settings-button");
    removeData_button.mousePressed(() => {
        localStorage.clear();
        localStorage.setItem("keyBindings", JSON.stringify(default_keys));

        Controls_move_Up_code = default_keys.upCode;
        Controls_Up_key = default_keys.upKey;

        Controls_move_Left_code = default_keys.leftCode;
        Controls_Left_key = default_keys.leftKey;

        Controls_move_Down_code = default_keys.downCode;
        Controls_Down_key = default_keys.downKey;

        Controls_move_Right_code = default_keys.rightCode;
        Controls_Right_key = default_keys.rightKey;

        Controls_Interact_code = default_keys.interactCode;
        Controls_Interact_key = default_keys.interactKey;

        Controls_Inventory_code = default_keys.invCode;
        Controls_Inventory_key = default_keys.invKey;

        Controls_Crafting_code = default_keys.craftCode;
        Controls_Crafting_key = default_keys.craftKey;

        Controls_Pause_code = default_keys.pauseCode;
        Controls_Pause_key = default_keys.pauseKey;

        Controls_MoveHotBarRight_code = default_keys.moveHotBarRightCode;
        Controls_MoveHotBarRight_key = default_keys.moveHotBarRightKey;

        Controls_MoveHotBarLeft_code = default_keys.moveHotBarLeftCode;
        Controls_MoveHotBarLeft_key = default_keys.moveHotBarLeftKey;

        Controls_Build_code = default_keys.buildCode;
        Controls_Build_key = default_keys.buildKey;

        Controls_Space_code = default_keys.spaceCode;
        Controls_Space_key = default_keys.spaceKey;

        Controls_Dash_code = default_keys.dashCode;
        Controls_Dash_key = default_keys.dashKey;

        console.log("Key bindings reset to defaults:", default_keys);
    });


    saveButton = createButton("Save");
    saveButton.class("settings-button");
    saveButton.parent(gameSettingsContainer);
    saveButton.mousePressed(() => {
        localStorage.setItem("volume", volumeSlider.value());
        localStorage.setItem("musicVolume", musicVolumeSlider.value());
        Object.keys(soundDic).forEach(key => {
            soundDic[key].sounds.slice(1).forEach((s, idx) => {
                s.setVolume(((idx + 1) / 20) * soundDic[key].volume * (volumeSlider.value() / 100));
            });
        });
        if (MusicPlayer) MusicPlayer.setVolume();
        let keyBindings = {
            upCode: Controls_move_Up_code,
            upKey: Controls_Up_key,
            leftCode: Controls_move_Left_code,
            leftKey: Controls_Left_key,
            downCode: Controls_move_Down_code,
            downKey: Controls_Down_key,
            rightCode: Controls_move_Right_code,
            rightKey: Controls_Right_key,
            interactCode: Controls_Interact_code,
            interactKey: Controls_Interact_key,
            invCode: Controls_Inventory_code,
            invKey: Controls_Inventory_key,
            craftCode: Controls_Crafting_code,
            craftKey: Controls_Crafting_key,
            pauseCode: Controls_Pause_code,
            pauseKey: Controls_Pause_key,
            moveHotBarRightCode: Controls_MoveHotBarRight_code,
            moveHotBarRightKey: Controls_MoveHotBarRight_key,
            moveHotBarLeftCode: Controls_MoveHotBarLeft_code,
            moveHotBarLeftKey: Controls_MoveHotBarLeft_key,
            buildCode: Controls_Build_code,
            buildKey: Controls_Build_key,
            spaceCode: Controls_Space_code,
            spaceKey: Controls_Space_key,
            dashCode: Controls_Dash_code,
            dashKey: Controls_Dash_key
        };
        localStorage.setItem("keyBindings", JSON.stringify(keyBindings));
        toggleSettings();
    });

    pauseDiv = createDiv();
    pauseDiv.class("pause-menu");

    let pauseTitle = createP("Paused");
    pauseTitle.style("font-size", "28px");
    pauseTitle.style("font-weight", "bold");
    pauseTitle.style("color", "white");
    pauseTitle.style("text-decoration", "underline");
    pauseTitle.parent(pauseDiv);

    resumeButton = createButton("Resume");
    styleButton(resumeButton);
    resumeButton.mousePressed(() => {
        pauseDiv.hide();
        gameState = "playing";
    });
    resumeButton.parent(pauseDiv);

    settingsButton = createButton(" Settings");
    styleButton(settingsButton);
    settingsButton.mousePressed(toggleSettings);
    settingsButton.parent(pauseDiv);

    serverSelectButton = createButton("Disconnect");
    styleButton(serverSelectButton);
    serverSelectButton.mousePressed(() => {
        // Save player data and notify server before disconnecting
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
                socket.emit('player_leave', {
                    playerId: socket.id,
                    playerName: curPlayer.name
                });
                socket.disconnect();
            }
        } catch (e) {
            console.error('[Disconnect] Error during save:', e);
        }
        // Always reload — delay lets the final packets flush
        setTimeout(() => { location.reload(); }, 150);
    });
    serverSelectButton.parent(pauseDiv);
}

// ─────────────────────────────────────────────────────────
// Toggle Settings Menu
// ─────────────────────────────────────────────────────────

function toggleSettings() {
    if (gameState === "settings") {
        gameSettingsContainer.style('display', 'none');
        gameState = oldState;
    } else {
        oldState = gameState;
        gameSettingsContainer.style('display', 'flex');
        gameState = "settings";
    }
}

// ─────────────────────────────────────────────────────────
// Player Status / Leaderboard
// ─────────────────────────────────────────────────────────

function togglePlayerStatusTable() {
    if (!player_status_container) {
        player_status_container = createDiv();
        player_status_container.id("player_status_container");
        player_status_container.class("player-status-container");
        player_status_container.hide();
    }

    const isVisible = player_status_container.style("display") !== "none";
    if (isVisible) {
        player_status_container.hide();
        return;
    }

    player_status_container.html("");

    const title = createP("Players").parent(player_status_container);
    title.class("player-status-title");

    if (gameState == "player_status") {
        fetch(getServerUrl(selectedServer) + "/status")
            .then(res => res.json())
            .then(statusData => {
                let serverAgeStr = "Server Age: Unknown";
                if (statusData && statusData.serverStartTime) {
                    const startTime = new Date(statusData.serverStartTime);
                    const now = new Date();
                    const ageMs = now - startTime;
                    const ageSecs = Math.floor(ageMs / 1000);
                    const ageMins = Math.floor(ageSecs / 60);
                    const ageHours = Math.floor(ageMins / 60);
                    const ageDays = Math.floor(ageHours / 24);
                    
                    if (ageDays > 0) {
                        serverAgeStr = `Server Age: ${ageDays}d ${ageHours % 24}h`;
                    } else if (ageHours > 0) {
                        serverAgeStr = `Server Age: ${ageHours}h ${ageMins % 60}m`;
                    } else if (ageMins > 0) {
                        serverAgeStr = `Server Age: ${ageMins}m ${ageSecs % 60}s`;
                    } else {
                        serverAgeStr = `Server Age: ${ageSecs}s`;
                    }
                }

                const ageP = createP(serverAgeStr).parent(player_status_container);
                ageP.class("player-status-age");

                return fetch(getServerUrl(selectedServer) + "/playerinfo").then(res => res.json());
            })
            .then(players => {
                let tableWrapper = createDiv().parent(player_status_container);
                tableWrapper.class("player-status-wrapper");

                let table = createElement("table").parent(tableWrapper);
                table.class("player-status-table");

                let thead = createElement("thead").parent(table);
                thead.html("<tr><th>Name</th><th>Kills</th><th>Deaths</th><th>Levels</th></tr>");
                thead.elt.style.backgroundColor = "#333";

                let tbody = createElement("tbody").parent(table);
                players.forEach(p => {
                    const row = createElement("tr").parent(tbody);
                    row.html(`<td>${p.name}</td><td>${p.kills}</td><td>${p.deaths}</td><td>${p.levels}</td>`);
                    row.elt.style.borderBottom = "1px solid #444";
                });

                player_status_container.show();
            })
            .catch(err => {
                console.error("Failed to fetch player info:", err);
                player_status_container.html("❌ Failed to load player data.");
                player_status_container.show();
            });
    }
}

// ─────────────────────────────────────────────────────────
// Key Binding UI
// ─────────────────────────────────────────────────────────

function defineKeyBindingUI() {
    bindingDiv = createDiv();
    bindingDiv.class("binding-container");
    bindingDiv.hide();

    bindingTitle = createP("Key Bindings");
    bindingTitle.class("binding-title");
    bindingTitle.parent(bindingDiv);

    contentDiv = createDiv();
    contentDiv.class("binding-content");
    contentDiv.parent(bindingDiv);

    doneButtonDiv = createDiv();
    doneButtonDiv.style("width", "100%");
    doneButtonDiv.style("display", "flex");
    doneButtonDiv.style("align-items", "center");
    doneButtonDiv.style("justify-content", "center");
    doneButtonDiv.parent(bindingDiv);

    doneButton = createButton("Done");
    doneButton.class("done-button");
    doneButton.parent(doneButtonDiv);
    doneButton.mousePressed(() => {
        bindingDiv.hide();
        gameState = "settings";
        gameSettingsContainer.show();
    });

    // ========================
    // LABEL COLUMN
    // ========================
    namesDiv = createDiv();
    namesDiv.class("binding-names");
    namesDiv.parent(contentDiv);

    const labels = [
        "Move Up:",
        "Move Left:",
        "Move Down:",
        "Move Right:",
        "Interact:",
        "Inventory:",
        "Crafting:",
        "Pause:",
        "Move HotBar Right:",
        "Move HotBar Left:",
        "Build:",
        "Space:",
        "Dash:",
        "Spell 1:",
        "Spell 2:",
        "Spell 3:",
        "Spell 4:",
        "Spell 5:",
        "Spell 6:",
        "Spell 7:",
        "Spell 8:",
        "Spell 9:",
        "Spell 10:"
    ];

    labels.forEach(text => {
        const p = createP(text);
        p.class("control-label");
        p.parent(namesDiv);
    });

    // ========================
    // KEY COLUMN
    // ========================
    keysDiv = createDiv();
    keysDiv.class("binding-keys");
    keysDiv.parent(contentDiv);

    function makeBindableButton(label, setId, keyRef) {
        const btn = createButton(keyToVisualKey(label));
        btn.class("control-button");
        btn.mousePressed(() => {
            if (control_set === 0) {
                control_set = setId;
                key = keyRef;
                lastKey = key;
                btn.style("background-color", "var(--color-gold)");
            }
        });
        btn.parent(keysDiv);
        return btn;
    }

    Controls_Up_button            = makeBindableButton(Controls_Up_key, 1, Controls_Up_key);
    Controls_Left_button          = makeBindableButton(Controls_Left_key, 2, Controls_Left_key);
    Controls_Down_button          = makeBindableButton(Controls_Down_key, 3, Controls_Down_key);
    Controls_Right_button         = makeBindableButton(Controls_Right_key, 4, Controls_Right_key);
    Controls_Interact_button      = makeBindableButton(Controls_Interact_key, 5, Controls_Interact_key);
    Controls_Inventory_button     = makeBindableButton(Controls_Inventory_key, 6, Controls_Inventory_key);
    Controls_Crafting_button      = makeBindableButton(Controls_Crafting_key, 7, Controls_Crafting_key);
    Controls_Pause_button         = makeBindableButton(Controls_Pause_key, 8, Controls_Pause_key);
    Controls_MoveHotBarRight_button = makeBindableButton(Controls_MoveHotBarRight_key, 9, Controls_MoveHotBarRight_key);
    Controls_MoveHotBarLeft_button  = makeBindableButton(Controls_MoveHotBarLeft_key, 10, Controls_MoveHotBarLeft_key);
    Controls_Build_button         = makeBindableButton(Controls_Build_key, 11, Controls_Build_key);
    Controls_Space_button         = makeBindableButton(Controls_Space_key, 12, Controls_Space_key);
    Controls_Dash_button          = makeBindableButton(Controls_Dash_key, 13, Controls_Dash_key);

    // Add general spell key binding buttons (always 10 slots, mappable)
    Controls_Spell_One_button   = makeBindableButton(typeof spell_one_key !== 'undefined' ? spell_one_key : '1', 101, typeof spell_one_key !== 'undefined' ? spell_one_key : '1');
    Controls_Spell_Two_button   = makeBindableButton(typeof spell_two_key !== 'undefined' ? spell_two_key : '2', 102, typeof spell_two_key !== 'undefined' ? spell_two_key : '2');
    Controls_Spell_Three_button = makeBindableButton(typeof spell_three_key !== 'undefined' ? spell_three_key : '3', 103, typeof spell_three_key !== 'undefined' ? spell_three_key : '3');
    Controls_Spell_Four_button  = makeBindableButton(typeof spell_four_key !== 'undefined' ? spell_four_key : '4', 104, typeof spell_four_key !== 'undefined' ? spell_four_key : '4');
    Controls_Spell_Five_button  = makeBindableButton(typeof spell_five_key !== 'undefined' ? spell_five_key : '5', 105, typeof spell_five_key !== 'undefined' ? spell_five_key : '5');
    Controls_Spell_Six_button   = makeBindableButton(typeof spell_six_key !== 'undefined' ? spell_six_key : '6', 106, typeof spell_six_key !== 'undefined' ? spell_six_key : '6');
    Controls_Spell_Seven_button = makeBindableButton(typeof spell_seven_key !== 'undefined' ? spell_seven_key : '7', 107, typeof spell_seven_key !== 'undefined' ? spell_seven_key : '7');
    Controls_Spell_Eight_button = makeBindableButton(typeof spell_eight_key !== 'undefined' ? spell_eight_key : '8', 108, typeof spell_eight_key !== 'undefined' ? spell_eight_key : '8');
    Controls_Spell_Nine_button  = makeBindableButton(typeof spell_nine_key !== 'undefined' ? spell_nine_key : '9', 109, typeof spell_nine_key !== 'undefined' ? spell_nine_key : '9');
    Controls_Spell_Ten_button   = makeBindableButton(typeof spell_ten_key !== 'undefined' ? spell_ten_key : '0', 110, typeof spell_ten_key !== 'undefined' ? spell_ten_key : '0');
}

