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
var Controls_MoveHotBarRight, Controls_MoveHotBarLeft, Controls_Build, Controls_Space;

var Controls_Up_button, Controls_Left_button, Controls_Down_button, Controls_Right_button;
var Controls_Interact_button, Controls_Inventory_button, Controls_Crafting_button, Controls_Pause_button;
var Controls_MoveHotBarRight_button, Controls_MoveHotBarLeft_button, Controls_Build_button, Controls_Space_button;

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
            spaceKey: Controls_Space_key
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
        location.reload();
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

    namesDiv = createDiv();
    namesDiv.class("binding-names");
    namesDiv.parent(contentDiv);

    // Create labels for each key
    Controls_Up = createP("Move Up:");
    Controls_Up.class("control-label");
    Controls_Up.parent(namesDiv);

    Controls_Left = createP("Move Left:");
    Controls_Left.class("control-label");
    Controls_Left.parent(namesDiv);

    Controls_Down = createP("Move Down:");
    Controls_Down.class("control-label");
    Controls_Down.parent(namesDiv);

    Controls_Right = createP("Move Right:");
    Controls_Right.class("control-label");
    Controls_Right.parent(namesDiv);

    Controls_Interact = createP("Interact:");
    Controls_Interact.class("control-label");
    Controls_Interact.parent(namesDiv);

    Controls_Inventory = createP("Inventory:");
    Controls_Inventory.class("control-label");
    Controls_Inventory.parent(namesDiv);

    Controls_Crafting = createP("Crafting:");
    Controls_Crafting.class("control-label");
    Controls_Crafting.parent(namesDiv);

    Controls_Pause = createP("Pause:");
    Controls_Pause.class("control-label");
    Controls_Pause.parent(namesDiv);

    Controls_MoveHotBarRight = createP("Move HotBar Right:");
    Controls_MoveHotBarRight.class("control-label");
    Controls_MoveHotBarRight.parent(namesDiv);

    Controls_MoveHotBarLeft = createP("Move HotBar Left:");
    Controls_MoveHotBarLeft.class("control-label");
    Controls_MoveHotBarLeft.parent(namesDiv);

    Controls_Build = createP("Build:");
    Controls_Build.class("control-label");
    Controls_Build.parent(namesDiv);

    Controls_Space = createP("Space:");
    Controls_Space.class("control-label");
    Controls_Space.parent(namesDiv);

    keysDiv = createDiv();
    keysDiv.class("binding-keys");
    keysDiv.parent(contentDiv);

    Controls_Up_button = createButton(keyToVisualKey(Controls_Up_key));
    Controls_Up_button.class("control-button");
    Controls_Up_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 1;
            key = Controls_Up_key;
            lastKey = key;
            Controls_Up_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Up_button.parent(keysDiv);

    Controls_Left_button = createButton(keyToVisualKey(Controls_Left_key));
    Controls_Left_button.class("control-button");
    Controls_Left_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 2;
            key = Controls_Left_key;
            lastKey = key;
            Controls_Left_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Left_button.class("control-button");
    Controls_Left_button.parent(keysDiv);

    Controls_Down_button = createButton(keyToVisualKey(Controls_Down_key));
    Controls_Down_button.class("control-button");
    Controls_Down_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 3;
            key = Controls_Down_key;
            lastKey = key;
            Controls_Down_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Down_button.parent(keysDiv);

    Controls_Right_button = createButton(keyToVisualKey(Controls_Right_key));
    Controls_Right_button.class("control-button");
    Controls_Right_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 4;
            key = Controls_Right_key;
            lastKey = key;
            Controls_Right_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Right_button.parent(keysDiv);

    Controls_Interact_button = createButton(keyToVisualKey(Controls_Interact_key));
    Controls_Interact_button.class("control-button");
    Controls_Interact_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 5;
            key = Controls_Interact_key;
            lastKey = key;
            Controls_Interact_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Interact_button.parent(keysDiv);

    Controls_Inventory_button = createButton(keyToVisualKey(Controls_Inventory_key));
    Controls_Inventory_button.class("control-button");
    Controls_Inventory_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 6;
            key = Controls_Inventory_key;
            lastKey = key;
            Controls_Inventory_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Inventory_button.parent(keysDiv);

    Controls_Crafting_button = createButton(keyToVisualKey(Controls_Crafting_key));
    Controls_Crafting_button.class("control-button");
    Controls_Crafting_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 7;
            key = Controls_Crafting_key;
            lastKey = key;
            Controls_Crafting_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Crafting_button.parent(keysDiv);

    Controls_Pause_button = createButton(keyToVisualKey(Controls_Pause_key));
    Controls_Pause_button.class("control-button");
    Controls_Pause_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 8;
            key = Controls_Pause_key;
            lastKey = key;
            Controls_Pause_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Pause_button.parent(keysDiv);

    Controls_MoveHotBarRight_button = createButton(keyToVisualKey(Controls_MoveHotBarRight_key));
    Controls_MoveHotBarRight_button.class("control-button");
    Controls_MoveHotBarRight_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 9;
            key = Controls_MoveHotBarRight_key;
            lastKey = key;
            Controls_MoveHotBarRight_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_MoveHotBarRight_button.parent(keysDiv);

    Controls_MoveHotBarLeft_button = createButton(keyToVisualKey(Controls_MoveHotBarLeft_key));
    Controls_MoveHotBarLeft_button.class("control-button");
    Controls_MoveHotBarLeft_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 10;
            key = Controls_MoveHotBarLeft_key;
            lastKey = key;
            Controls_MoveHotBarLeft_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_MoveHotBarLeft_button.parent(keysDiv);

    Controls_Build_button = createButton(keyToVisualKey(Controls_Build_key));
    Controls_Build_button.class("control-button");
    Controls_Build_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 11;
            key = Controls_Build_key;
            lastKey = key;
            Controls_Build_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Build_button.parent(keysDiv);

    Controls_Space_button = createButton(keyToVisualKey(Controls_Space_key));
    Controls_Space_button.class("control-button");
    Controls_Space_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 12;
            key = Controls_Space_key;
            lastKey = key;
            Controls_Space_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Space_button.parent(keysDiv);
}
