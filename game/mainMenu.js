// ═════════════════════════════════════════════════════════════════════
// MAIN MENU UI MODULE
// Handles all UI related to the main menu, server selection, and race selection
// ═════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// GLOBALS FOR MAIN MENU
// ─────────────────────────────────────────────────────────────────────

// Race Selection
var raceSelected = false;
var curRace;
var nameEntered = false;
var raceButtons = []; // now storing "card" divs instead of p5 buttons
var goButton;
var nameInput;
var raceContainer;
var race_back_button;
var raceTitle;

// Server Browser
let serverList = JSON.parse(localStorage.getItem("servers")) || [
    { ip: "muddygame.net", name: "Holes Offical", status: "Online" },
    { ip: "localhost", name: "Local Server", status: "Online" }
];

serverList[0] = { ip: "muddygame.net", name: "Holes Offical", status: "Online" };

// Tracks whether the currently selected server is hardcore/permadeath
window.isHardcoreServer = false;

let selectedServer = null;
let serverBrowserContainer, inputIP, inputStatus, addServerButton, serverListDiv;
let renderedserverBrowserContainer = false;

// Links and Title
let linksRendered = false; // Flag to prevent duplicate rendering
let linkContainer, settingsContainer, settingsToggle, toggleButton, titleImage, markee;

let markeeText = [
    " This game is made with Hate not ♥ !!!",
    " DIG DIG DIG there is nothing else ",
    "Your advert here , we gotta pay that AWS bill some how ",
    "Learn to Code &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ... OR ELSE",
    "Kill John's Lemons",
    "Buy Gold Buy",
    "According to all known laws of aviation, there is no way a bee should be able to fly. Its wings are too small to get its fat little body off the ground. The bee, of course, flies anyway because bees don't care what humans think is impossible. ",
    "This game probably cures cancer ",
    "Remember V the Media Lies",
    "If the government could be trusted Jesus would have died of natural causes",
    "The Simpson's did it !",
];

// ─────────────────────────────────────────────────────────────────────
// SERVER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────

function saveServers() {
    localStorage.setItem("servers", JSON.stringify(serverList));
}

// ─────────────────────────────────────────────────────────────────────
// MAIN MENU LINKS & TITLE
// ─────────────────────────────────────────────────────────────────────

// Function to render buttons instead of links
function renderLinks() {
    if (linksRendered) return; // Prevent duplicate rendering

    // draw title image
    titleImage = createImg("./images/ui/title.png");
    titleImage.id("titleImage");

    let randItem1 = Math.floor(Math.random() * markeeText.length);
    // Suppose we want 5 distinct random items
    let chosenItems = [];
    while (chosenItems.length < markeeText.length) {
        let r = Math.floor(Math.random() * markeeText.length);
        if (!chosenItems.includes(r)) chosenItems.push(r);
    }
    // Now join them with a spacer or delimiter
    let marqueeContent = chosenItems
        .map(i => markeeText[i]).join("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");

    markee = createElement("marquee", marqueeContent);
    markee.id("mainMenuMarquee");

    // Parent container for buttons (Bottom Right)
    linkContainer = createDiv();
    linkContainer.id("socialLinksPanel");

    // Create individual buttons
    createLinkButton(linkContainer, "👾 Itch.io", "https://polypikzel.itch.io/");
    createLinkButton(linkContainer, "🖳 GitHub", "https://github.com/PolyPixels");
    createLinkButton(linkContainer, "🗪 Discord", "https://discord.gg/Quhy52U5ae");

    // Parent container for settings (Bottom Left)
    settingsToggle = createDiv();
    settingsToggle.id("settingsToggle");

    // Create settings button
    let settingsButton = createButton("⚙ Settings").parent(settingsToggle);
    settingsButton.mousePressed(() => toggleSettings());

    titleImage.parent(document.body);
    // Append elements to body
    linkContainer.parent(document.body);
    settingsToggle.parent(document.body);

    linksRendered = true; // Set flag to true
}

// 🎯 Helper Function to Create Buttons
function createLinkButton(parent, text, url) {
    let button = createButton(text).parent(parent);
    button.class("menu-link-btn");
    button.mousePressed(() => window.open(url, "_blank"));
}

// 🎮 Styling for Buttons
function styleButton(button) {
    applyStyle(button, {
        padding: "10px 15px",
        fontSize: "16px",
        borderRadius: "5px",
        backgroundColor: "#333",
        color: "white",
        cursor: "pointer",
        transition: "0.3s ease-in-out",
    });

    button.mouseOver(() => button.style("box-shadow", "0 0 10px cyan"));
    button.mouseOut(() => button.style("box-shadow", "none"));
    addGlitchEffect(button);
}

// ⚡ Apply Glitch Effect
function addGlitchEffect(element) {
    element.mouseOver(() => element.style("animation", "glitch 0.3s infinite"));
    element.mouseOut(() => element.style("animation", "none"));
}

// 🎨 Apply Style Utility Function
function applyStyle(element, styles) {
    Object.entries(styles).forEach(([key, value]) => element.style(key, value));
}

// Helper function to create a link
function createLinkItem(parent, text, url, emoji) {
    let link = createA(url, `${emoji} ${text}`, "_blank");
    link.style("padding", "10px 15px");
    link.style("font-size", "16px");
    link.style("border-radius", "5px");
    link.style("background-color", "#333");
    link.style("color", "white");
    link.style("text-decoration", "none");
    link.style("display", "inline-block");
    link.style("transition", "0.3s");

    // Hover effect
    link.mouseOver(() => link.style("background-color", "#555"));
    link.mouseOut(() => link.style("background-color", "#333"));

    link.parent(parent);
}

// Toggle function to show/hide links
function hideLinks() {
    // Ensure we only operate after links are rendered and avoid toggling per frame
    if (!linksRendered) return;

    // Hide all link-related UI elements; do not overwrite functions or toggle repeatedly
    if (linkContainer) linkContainer.style("display", "none");
    if (settingsToggle) settingsToggle.style("display", "none");
    if (markee) markee.style("display", "none");
    if (titleImage) titleImage.style("display", "none");
}

// ─────────────────────────────────────────────────────────────────────
// SERVER BROWSER
// ─────────────────────────────────────────────────────────────────────

function renderServerBrowser() {
    if (!renderedserverBrowserContainer) {
        renderedserverBrowserContainer = true;

        serverBrowserContainer = createDiv();
        serverBrowserContainer.id("serverBrowserContainer");

        // Position the container in the center
        serverBrowserContainer.style("position", "fixed");
        serverBrowserContainer.style("top", "55%");
        serverBrowserContainer.style("left", "50%");
        serverBrowserContainer.style("transform", "translate(-50%, -50%)");
        serverBrowserContainer.style("max-width", "clamp(320px, 90vw, 50dvw)");

        // Title
        let title = createDiv("Select A Server");
        title.class("server-browser-title");
        title.parent(serverBrowserContainer);

        // Inner scrollable area
        let innerDiv = createDiv();
        innerDiv.class("server-browser-inner");
        innerDiv.parent(serverBrowserContainer);

        // Search input for filtering servers
        let searchInput = createInput("");
        searchInput.attribute("placeholder", "🔍 Search Servers...");
        searchInput.class("server-search-input");
        searchInput.parent(innerDiv);

        searchInput.elt.addEventListener("focus", () => {
            lastGameState = gameState;
        });

        searchInput.elt.addEventListener("blur", () => {
       
        });

        searchInput.elt.addEventListener("input", () => {
            const filterText = searchInput.value().toLowerCase();
            renderFilteredServerList(filterText);
        });

        serverListDiv = createDiv();
        serverListDiv.parent(innerDiv);

        // Render the server list
        renderServerList();

        // ─────────────────────────────────────────────────────────
        //  ADD NEW SERVER (COLLAPSIBLE / DROPDOWN)
        // ─────────────────────────────────────────────────────────

        let addServerSection = createDiv();
        addServerSection.class("add-server-section");

        let addServerTitle = createDiv("Add New Server ▼");
        addServerTitle.class("add-server-title");
        addServerTitle.parent(addServerSection);

        // Collapsible content container (initially hidden)
        let addServerContent = createDiv();
        addServerContent.style("display", "none");
        addServerContent.parent(addServerSection);

        // Server IP Input
        inputIP = createInput("").attribute("placeholder", " Server IP");
        inputIP.class("add-server-input");
        inputIP.parent(addServerContent);

        // Add Server Button
        addServerButton = createButton("ADD");
        addServerButton.class("add-server-btn");
        addServerButton.parent(addServerContent);

        // Functionality for the Add button
        addServerButton.mousePressed(() => {
            let newServer = {
                ip: inputIP.value(),
            };
            if (newServer.ip) {
                serverList.push(newServer);
                saveServers();
                renderServerList();

                inputIP.value("");
                alert("✅ Server Added Successfully! Game On");
            }
        });

        // Toggle display of addServerContent on header click
        let dropdownOpen = false;
        addServerTitle.mousePressed(() => {
            dropdownOpen = !dropdownOpen;
            addServerContent.style("display", dropdownOpen ? "block" : "none");
            addServerTitle.html(dropdownOpen ? "Add New Server ▼" : "Add New Server ►");
        });

        addServerSection.parent(innerDiv);

        // ─────────────────────────────────────────────────────────
        //  CONNECT BUTTON
        // ─────────────────────────────────────────────────────────
        let connectButton = createButton("▶ Connect");
        connectButton.class("server-connect-btn");
        connectButton.parent(serverBrowserContainer);
        connectButton.mousePressed(() => {
            if (!selectedServer) {
                alert("⚠️ Please select a server first.");
                return;
            }
            // Pre-check capacity via status endpoint before connecting
            fetchServerStatus(selectedServer, (data) => {
                if (data && typeof data.playerCount === 'number' && typeof data.max === 'number') {
                    if (data.playerCount >= data.max) {
                        alert(`Server is full (${data.playerCount}/${data.max}). Please try again later.`);
                        return;
                    }
                }

                // Set hardcore flag from fresh status response
                window.isHardcoreServer = !!(data.hardcore || data.permaDeath);
                selectedServer.hardcore = window.isHardcoreServer;

                socket = io.connect(getServerUrl(selectedServer), {
                    reconnection: true,
                    reconnectionAttempts: 20,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 10000,
                    timeout: 15000,
                });
                socketSetup();
                testMap = new Map();
                // ghostBuild will be created later when needed in input.js
                ghostBuild = null;
                hideServerBrowser();
                gameState = "race_selection";
                renderedserverBrowserContainer = false;
            });
        });
    }
}

// Helper function to render filtered server list
function renderFilteredServerList(filterText) {
    if (!serverListDiv) return;

    // Clear the container
    serverListDiv.html("");

    const filtered = serverList.filter(
        server =>
            server.name.toLowerCase().includes(filterText) ||
            server.ip.toLowerCase().includes(filterText)
    );

    if (filtered.length === 0) {
        let emptyMsg = createDiv("No servers found.");
        emptyMsg.parent(serverListDiv);
        emptyMsg.style("color", "white");
        emptyMsg.style("padding", "20px");
        emptyMsg.style("text-align", "center");
        return;
    }

    filtered.forEach((server, index) => {
        renderSingleServerEntry(server, serverList.indexOf(server));
    });
}

// Helper function to render a single server entry
function renderSingleServerEntry(server, indexInFullList) {
    let serverEntry = createDiv();
    serverEntry.class("serverEntry");

    // === Logo Container ===
    let logoContainer = createDiv();
    logoContainer.class("server-logo-wrap");

    // Use a default image if server.image is undefined or invalid
    const imageUrl = (server.image && server.image !== 'undefined') ? server.image : 'images/ui/title.png';
    let serverLogo = createImg(imageUrl);
    serverLogo.parent(logoContainer);
    logoContainer.parent(serverEntry);

    // === Text Details Container ===
    let textContainer = createDiv();
    textContainer.class("server-text-container");

    // Server Name
    let serverName = createDiv(server.name);
    serverName.class("server-name");
    serverName.parent(textContainer);

    // IP
    let serverIP = createDiv(`IP: ${server.ip}`);
    serverIP.class("server-ip");
    serverIP.parent(textContainer);

    // Status
    let serverStatus = createDiv("Status: Loading...");
    serverStatus.class("server-status");
    serverEntry.style("pointer-events", "none");
    serverEntry.style("opacity", "0.5");
    serverStatus.parent(textContainer);

    // Player Count
    let playerCount = createDiv("Players: Loading...");
    playerCount.class("server-players");
    playerCount.parent(textContainer);

    textContainer.parent(serverEntry);

    // Fetch server status
    fetchServerStatus(server, (data) => {
        const isHardcore = !!(data.hardcore || data.permaDeath);
        server.hardcore = isHardcore;

        serverStatus.html(`Status: ${data.status}`);
        serverStatus.style("color", data.status === "Online" ? "#4CAF50" : "#F44336");
        serverName.html(`${isHardcore ? "  ☠️  " : ""}${data.name || "Unnamed Server"}`);
        playerCount.html(`Players: ${data.playerCount}` + (!data.max ? `` : `/ ${data.max}`));
        serverLogo.attribute("src", data.image);

        serverEntry.style("opacity", data.status === "Online" ? "1" : "0.5");
        serverEntry.style("pointer-events", data.status === "Online" ? "auto" : "none");
    });

    // Remove server button
    let removeButton = createButton("✕ Remove");
    removeButton.class("server-remove-btn");
    removeButton.parent(serverEntry);

    removeButton.mousePressed(() => {
        serverList.splice(indexInFullList, 1);
        saveServers();
        renderServerList();
    });

    // Select a server
    serverEntry.mousePressed(() => {
        let entries = selectAll(".serverEntry");
        for (let e of entries) {
            e.removeClass("server-selected");
        }
        serverEntry.addClass("server-selected");
        selectedServer = server;
        window.isHardcoreServer = !!server.hardcore;
    });

    serverEntry.parent(serverListDiv);
}

function getServerUrl(server) {
    const isLocal = isLocalAddress(server.ip);
    // Use HTTP with port 3000 for local, otherwise HTTPS with no extra port for production
    const scheme = isLocal ? "http" : "https";
    const port = isLocal ? ":3000" : "";
    return `${scheme}://${server.ip}${port}`;
}

function isLocalAddress(ipOrHost) {
    // Only treat true localhost/loopback as local (needs :3000 port)
    // Domain names and public IPs should use public schema (https without port)
    if (ipOrHost === "localhost" || ipOrHost === "127.0.0.1" || ipOrHost === "::1") {
        return true;
    }
    // All other addresses (domain names, public IPs) are treated as public
    return false;
}

function fetchServerStatus(server, callback) {
    const url = getServerUrl(server) + "/status";
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => {
            console.error(`Error fetching status from ${server.ip}:`, error);
            callback({ status: "Offline", playerCount: 0 });
        });
}

function renderServerList() {
    // Clear the entire container to avoid stale elements
    if (serverListDiv) {
        serverListDiv.html("");
    }

    // Return early if list is empty
    if (serverList.length === 0) {
        if (serverListDiv) {
            let emptyMsg = createDiv("No servers added yet.");
            emptyMsg.parent(serverListDiv);
            emptyMsg.style("color", "white");
            emptyMsg.style("padding", "20px");
            emptyMsg.style("text-align", "center");
        }
        return;
    }

    // Render all servers
    serverList.forEach((server, index) => {
        renderSingleServerEntry(server, index);
    });
}

// --- Function to Hide or Remove the Server Browser ---
function hideServerBrowser() {
    let serverBrowserContainer = document.getElementById("serverBrowserContainer"); // Adjust selector accordingly
    if (serverBrowserContainer) {
        serverBrowserContainer.remove(); // Remove the element
        //console.log("Server browser container removed."); // Debugging output
    } else {
        console.warn("Server browser container not found.");
    }
}

// ─────────────────────────────────────────────────────────────────────
// RACE SELECTION
// ─────────────────────────────────────────────────────────────────────

// Show the selection UI elements
function drawSelection() {
    // Hide social links & marquee on mobile during race selection
    if (typeof isMobileDevice !== 'undefined' && isMobileDevice) {
        if (linkContainer) linkContainer.style("display", "none");
        if (markee) markee.style("display", "none");
    }
    // Show the flex wrapper
    if (window._raceWrapper) {
        window._raceWrapper.style("display", "flex");
    }
    raceContainer.style("display", "flex");
    // ---------------------------------------------------
    //  Create Title (centered, responsive)
    // ---------------------------------------------------
    raceTitle.id("raceTitle");
    raceTitle.elt.innerHTML = "Select Your Race";

    // Show the combined name+go container
    var ngc = document.getElementById('nameGoContainer');
    if (ngc) ngc.style.display = 'flex';
    nameInput.show();
    goButton.show();

    //back to server selection button
    race_back_button.innerHTML = " ← Back";
    race_back_button.show();
    // Don't parent to raceContainer — it would scroll away
    raceButtons.forEach((card) => {
        card.show();
    });
    // Enable the "Go" button only when a race is selected and a name is entered
}
// Hide UI elements during gameplay
function hideRaceSelect() {
    nameInput.hide();
    goButton.hide();
    var ngc = document.getElementById('nameGoContainer');
    if (ngc) ngc.style.display = 'none';
    raceButtons.forEach((card) => {
        card.hide();
    });
    race_back_button.hide();
    raceContainer.style("display", "none");
    raceTitle.style("display", "none");
    if (window._raceWrapper) window._raceWrapper.style("display", "none");
}

// ─────────────────────────────────────────────────────────────────────
// SETUP RACE SELECTION UI
// ─────────────────────────────────────────────────────────────────────

function setupRaceSelectionUI() {
    raceTitle = createDiv();
    // ---------------------------------------------------
    //  Create a full-page flex wrapper for race selection
    // ---------------------------------------------------
    window._raceWrapper = createDiv();
    window._raceWrapper.id('raceWrapper');
    window._raceWrapper.style("position", "fixed");
    window._raceWrapper.style("inset", "0");
    window._raceWrapper.style("display", "none");
    window._raceWrapper.style("flex-direction", "column");
    window._raceWrapper.style("align-items", "center");
    window._raceWrapper.style("justify-content", "center");
    window._raceWrapper.style("gap", "clamp(12px, 2dvh, 24px)");
    window._raceWrapper.style("z-index", "10");
    window._raceWrapper.style("padding", "20px");
    window._raceWrapper.style("box-sizing", "border-box");
    window._raceWrapper.style("overflow-y", "auto");
    window._raceWrapper.style("pointer-events", "none");

    // Parent title into wrapper
    raceTitle.parent(window._raceWrapper);
    raceTitle.style("pointer-events", "auto");

    // ---------------------------------------------------
    //  Create a container for race selection cards
    // ---------------------------------------------------
    raceContainer = createDiv();
    race_back_button = createButton("← Back");
    race_back_button.id("raceBackButton");
    raceContainer.id("raceContainer");
    raceContainer.parent(window._raceWrapper);
    raceContainer.style("display", "none");
    raceContainer.style("flex-wrap", "wrap");
    raceContainer.style("justify-content", "center");
    raceContainer.style("align-items", "stretch");
    raceContainer.style("gap", "16px");
    raceContainer.style("padding", "20px");
    raceContainer.style("width", "95vw");
    raceContainer.style("max-width", "900px");
    raceContainer.style("max-height", "clamp(200px, 50dvh, 60dvh)");
    raceContainer.style("overflow-y", "auto");
    raceContainer.style("overflow-x", "hidden");
    raceContainer.style("touch-action", "pan-y");
    raceContainer.style("-webkit-overflow-scrolling", "touch");
    raceContainer.style("pointer-events", "auto");
    // ---------------------------------------------------
    //  Create cards for each race (with responsive sizing)
    // Allowed stats to display
    const allowedStats = ["hp", "mhp", "healthRegen", "attack", "magic", "magicResistance", "hearing", "handDigSpeed", "runningSpeed"];

    // Iterate over each race in the races array
    races.forEach((raceName, i) => {
        var selectedItem = i;
        //console.log(selectedItem, i, raceName)
        // Create the card container for the race
        let card = createDiv();
        card.class("raceCard");
        card.style("display", "flex");
        card.style("flex-direction", "column");
        card.style("align-items", "center");
        card.style("cursor", "pointer");
        card.selected = false;

        // Create a race name label
        let raceLbl = createP(raceName.toUpperCase());
        raceLbl.style("font-size", "calc(0.5vw + 16px)");
        raceLbl.style("font-weight", "bold");
        raceLbl.style("margin", "10px 0 0 0");
        raceLbl.style("text-align", "center");

        raceLbl.parent(card);
        // Create an image element for the race portrait
        let raceImgPath = `images/characters/${raceName}/${raceName}_portrait.png`;
        let raceImg = createImg(raceImgPath, `${raceName} image`);
        raceImg.style("width", "clamp(64px, 65%, 140px)");
        raceImg.style("height", "auto");
        raceImg.style("aspect-ratio", "1");
        raceImg.style("object-fit", "contain");
        raceImg.style("image-rendering", "pixelated");
        raceImg.style("margin", "8px 0");
        raceImg.style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.5))");
        raceImg.parent(card);

        // Retrieve stats from BASE_STATS (assumes the same order as races)
        let raceStats = BASE_STATS[i];
        // Build a text string for only the allowed stats
     
        // Color mapping for stats (matching stats panel colors)
        const statColors = {
            "hp": "#27f50e",
            "mhp": "#27f50e",
            "healthRegen": "#99ff99",
            "attack": "#ff6666",
            "magic": "#9966ff",
            "magicResistance": "#66ccff",
            "hearing": "#ffaa00",
            "handDigSpeed": "#ff9966",
            "runningSpeed": "#66ffcc"
        };
        
        // Build color-coded stats HTML
        let statsText = allowedStats
            .map(stat => `<span style="color: ${statColors[stat] || '#fff'}; text-shadow: 0 0 3px #000, 0 0 6px #000;">${stat}: ${raceStats[stat]}</span>`)
            .join("<br/>");

        // Create a label for the stats
        let raceStatsLbl = createP(statsText);
        raceStatsLbl.style("font-size", "clamp(10px, 1.2vw, 14px)");
        raceStatsLbl.style("font-weight", "normal");
        raceStatsLbl.style("margin", "8px 0 0 0");
        raceStatsLbl.style("align-self", "stretch");
        raceStatsLbl.style("text-align", "left");
        raceStatsLbl.style("line-height", "1.4");
        raceStatsLbl.parent(card);

        // Hover in styling
        card.mouseOver(() => {
            if (!card.selected) {
                card.style("transform", "translateY(-4px) scale(1.03)");
                card.style("box-shadow", "0 8px 24px rgba(0,0,0,0.5), 0 0 12px rgba(255,215,0,0.15)");
            }
        });

        // Hover out styling
        card.mouseOut(() => {
            if (!card.selected) {
                card.style("transform", "scale(1)");
                card.style("box-shadow", "");
            }
        });

        // On click: deselect all cards, select only this one
        card.mousePressed(() => {
            // Deselect all cards
            raceButtons.forEach((c) => {
                c.selected = false;
                c.removeClass("race-selected");
            });

            // Select this card
            card.selected = true;
            card.addClass("race-selected");

            raceSelected = true;
            curRace = selectedItem;

            //console.log("Race selected:", races[selectedItem]);
        });

        // Hide the card initially (only shown in the race selection state)
        card.hide();
        card.parent(raceContainer);
        raceButtons.push(card);
    });

    race_back_button.hide();

    // ---------------------------------------------------
    //   Name + Go container (flex row)
    // ---------------------------------------------------
    var nameGoContainer = createDiv();
    nameGoContainer.id('nameGoContainer');
    nameGoContainer.parent(window._raceWrapper);
    nameGoContainer.style("display", "flex");
    nameGoContainer.style("align-items", "center");
    nameGoContainer.style("gap", "10px");
    nameGoContainer.style("z-index", "100");
    nameGoContainer.style("width", "auto");
    nameGoContainer.style("max-width", "90vw");
    nameGoContainer.style("pointer-events", "auto");
    nameGoContainer.hide();

    nameInput = createInput("");
    nameInput.parent(nameGoContainer);
    nameInput.style("width", "clamp(150px, 40vw, 300px)");
    nameInput.attribute("placeholder", "Name (A-Z, 0-9)");
    nameInput.attribute("maxlength", "20");

    // Focus style
    nameInput.elt.addEventListener("focus", () => {
        nameInput.attribute("placeholder", "");
    });

    // Real-time validation: only allow letters and numbers, no spaces
    nameInput.input(() => {
        let currentValue = nameInput.value();
        let filtered = currentValue.replace(/[^A-Za-z0-9]/g, "");
        if (filtered !== currentValue) {
            nameInput.value(filtered);
        }
        checkName();
    });

    nameInput.elt.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            startGame();
        }
    });

    // ---------------------------------------------------
    //   "Go" Button
    // ---------------------------------------------------
    goButton = createButton("Go");
    goButton.parent(nameGoContainer);

    goButton.mousePressed(() => {
        startGame();
    });

    // Parent back button after nameGoContainer so it appears below
    race_back_button.parent(window._raceWrapper);
    race_back_button.mousePressed(() => {
        hideRaceSelect();
        gameState = "initial";
    });
}

// ─────────────────────────────────────────────────────────────────────
// START GAME
// ─────────────────────────────────────────────────────────────────────

function startGame() {
    if (!selectedServer) {
        alert("Issue with server retry.");
        return;
    }
    if (!raceSelected) {
        alert("Pick a race.");
        return;
    }

    if (!nameEntered) {
        alert("Pick a name.");
        return;
    }

    const nameVal = nameInput.value().trim();

    if (nameVal.length === 0) {
        alert("Name cannot be empty.");
        return;
    }
    if (nameVal.length > 20) {
        alert("Name is too long (max 20 chars).");
        return;
    }
    if (/\s/.test(nameVal)) {
        alert("Name cannot contain spaces.");
        return;
    }
    if (!/^[A-Za-z0-9]+$/.test(nameVal)) {
        alert("Name can only contain letters and digits.");
        return;
    }

    const badWords = ["badword", "someoffensiveword"];
    for (let badWord of badWords) {
        if (nameVal.toLowerCase().includes(badWord)) {
            alert("Name contains forbidden content.");
            return;
        }
    }

    const pendingPlayer = new Player(
        200,
        200,
        undefined,
        curID,
        0,
        curRace,
        nameVal
    );

    const basePayload = {
        id: pendingPlayer.id,
        name: pendingPlayer.name,
        race: pendingPlayer.race,
        color: pendingPlayer.color,
        pos: { x: pendingPlayer.pos.x, y: pendingPlayer.pos.y },
        statBlock: {
            level: pendingPlayer.statBlock.level,
            xp: pendingPlayer.statBlock.xp,
            xpNeeded: pendingPlayer.statBlock.xpNeeded,
            stats: pendingPlayer.statBlock.stats
        },
        invBlock: null,
        teamId: pendingPlayer.teamId || null
    };

    const tryJoin = (passwordAttempt = "") => {
        const payload = { ...basePayload };
        if (passwordAttempt) {
            payload.password = passwordAttempt;
        }

        socket.emit("new_player", payload, (resp) => {
            if (!resp || resp.ok !== true) {
                const code = resp?.code || "UNKNOWN";
                if (code === "PASSWORD_REQUIRED" || code === "BAD_PASSWORD") {
                    const promptMsg = resp?.message || "Enter password for this player:";
                    const pw = prompt(promptMsg, "");
                    if (pw === null) {
                        alert("Join cancelled.");
                        return;
                    }
                    tryJoin(pw);
                    return;
                } else if (code === "NAME_IN_USE") {
                    alert("That name is already in use.");
                } else {
                    alert(resp?.message || "Unable to join.");
                }
                return;
            }

            curPlayer = pendingPlayer;
            playerJoined = true; // Server confirmed registration — allow batcher to send

            // Password can now be set/changed in Settings menu after login

            camera.pos = createVector(curPlayer.pos.x, curPlayer.pos.y);

            let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
            for (let yOff = -2; yOff < 3; yOff++) {
                for (let xOff = -2; xOff < 3; xOff++) {
                    testMap.getChunk(chunkPos.x + xOff, chunkPos.y + yOff);
                }
            }

            document.getElementById("canvas-container").style.display = "block";

            socket.emit("request_my_items", { name: nameVal });
            socket.emit("get_teams");

            gameState = "playing";
            hideRaceSelect();

            if (localStorage.getItem("tut_seen") == "true") {
                tutorialDiv.hide();
            } else {
                tutorialDiv.show();
                localStorage.setItem("tut_seen", "true");
            }

            // Clear spawn area — use update_nodes (single bulk event) instead of
            // 200 individual dig/mine calls that would flood the socket
            {
                const spawnChunk = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
                socket.emit('update_nodes', {
                    cx: spawnChunk.x, cy: spawnChunk.y,
                    pos: { x: curPlayer.pos.x, y: curPlayer.pos.y },
                    radius: 5, amt: 1
                });
                socket.emit('update_iron_nodes', {
                    cx: spawnChunk.x, cy: spawnChunk.y,
                    pos: { x: curPlayer.pos.x, y: curPlayer.pos.y },
                    radius: 5, amt: 1
                });
                // Also apply locally for immediate visual feedback
                for (let y = -5; y < 5; y++) {
                    for (let x = -5; x < 5; x++) {
                        const wx = curPlayer.pos.x + x * TILESIZE;
                        const wy = curPlayer.pos.y + y * TILESIZE;
                        const cp = testMap.globalToChunk(wx, wy);
                        const ck = cp.key || getChunkKey(cp.x, cp.y);
                        const ch = testMap.chunks[ck];
                        if (ch) {
                            const lx = floor(wx / TILESIZE) - cp.x * CHUNKSIZE;
                            const ly = floor(wy / TILESIZE) - cp.y * CHUNKSIZE;
                            const idx = lx + ly * CHUNKSIZE;
                            if (idx >= 0 && idx < CHUNKSIZE * CHUNKSIZE) {
                                if (ch.data[idx] > 0) ch.data[idx] = 0;
                                if (ch.iron_data && ch.iron_data[idx] > 0) ch.iron_data[idx] = 0;
                            }
                        }
                    }
                }
            }
        });
    };

    tryJoin();
}
