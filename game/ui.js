//globals for ui.js
var raceSelected = false;
var curRace;
var nameEntered = false;
var raceButtons = []; // now storing "card" divs instead of p5 buttons
var goButton;
var nameInput;

// Array of build option objects

function updateResponsiveDesign() {
    // Update positions for the name input and "Go" button
    const inputWidth = 220; // as defined in style
    const spacing = 20;


    // Update race card widths responsively
    let newCardWidth = constrain(width * 0.15, 150, 300);
    raceButtons.forEach((card) => {
        card.style("width", newCardWidth + "px");
    });

    // Optionally update the race title font size for better scaling
    raceTitle?.style("font-size", "calc(1.5vw + 24px)");

    dirtBagUI.pos = createVector(width - 180 - 10, height - 186 - 10);

    timerDiv.position(width / 2 - 50, 10);

}

function hideRaceSelect() {
    // Hide UI elements during gameplay
    nameInput.hide();
    goButton.hide();
    raceButtons.forEach((card) => {
        card.hide();
    });
    race_back_button.hide()
    raceContainer.style("display", "none"); // Hide the container
    // If using raceTitle, hide it as well
    raceTitle.style("display", "none");
}

let serverList = JSON.parse(localStorage.getItem("servers")) || [
    { ip: "muddygame.net", name: "Holes Offical", status: "Online" },
    { ip: "localhost", name: "Local Server", status: "Online" }
];

serverList[0] = { ip: "muddygame.net", name: "Holes Offical", status: "Online"};

let selectedServer = null;
let serverBrowserContainer, inputIP, inputStatus, addServerButton, serverListDiv;
let renderedserverBrowserContainer = false;

function saveServers() {
    localStorage.setItem("servers", JSON.stringify(serverList));
}

let linksRendered = false; // Flag to prevent duplicate rendering
let linkContainer, settingsContainer, settingsToggle, toggleButton, titleImage, markee; // Store references for hiding

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
]
// Function to render buttons instead of links
function renderLinks() {
    if (linksRendered) return; // Prevent duplicate rendering

    // draw title image 

    titleImage = createImg("./images/ui/title.png");

    // Apply styles to the image using .style()
    titleImage.style("width", "28dvw"); // Set the width of the image
    titleImage.style("height", "9dvw"); // Automatically adjust the height
    titleImage.style("border", "5px solid #000"); // Add a border
    titleImage.style("display", "block"); // Make it a block element (to prevent inline styling)
    titleImage.style("margin", "10px auto");
    titleImage.style("padding-bottom", "20px auto");
    titleImage.style("top", "0")
    titleImage.style("position", "absolute"); let randItem1 = Math.floor(Math.random() * markeeText.length);
    // Suppose we want 5 distinct random items
    let chosenItems = [];
    while (chosenItems.length < markeeText.length) {
        let r = Math.floor(Math.random() * markeeText.length);
        if (!chosenItems.includes(r)) chosenItems.push(r);
    }
    // Now join them with a spacer or delimiter
    let marqueeContent = chosenItems
        .map(i => markeeText[i]).join("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;")


    markee = createElement("marquee", marqueeContent);
    markee.style("position", "fixed");
    markee.style("bottom", "0px");
    markee.style("width", "80%");

    markee.style("margin-right", "4%");

    markee.style("font-size", "1.5rem");
    markee.style("color", "white");

    markee.style("scrolldelay", "0");

    // Parent container for buttons (Bottom Right)
    linkContainer = createDiv();
    linkContainer.class("container")

    applyStyle(linkContainer, {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        zIndex: "1000",
    });

    // Create individual buttons
    createLinkButton(linkContainer, "👾 Play On Itch.io", "https://polypikzel.itch.io/");
    createLinkButton(linkContainer, "🖳 GitHub", "https://github.com/PolyPixels");
    createLinkButton(linkContainer, "🗪 Discord", "https://discord.gg/Quhy52U5ae");

    // Parent container for settings (Bottom Left)
    settingsToggle = createDiv();
    settingsToggle.class("container")
    applyStyle(settingsToggle, {
        position: "fixed",
        bottom: "10px",
        left: "10px",
        zIndex: "1000",
    });

    // Create settings button
    let settingsButton = createButton("⚙ Settings").parent(settingsToggle);
    styleButton(settingsButton);
    settingsButton.mousePressed(() => toggleSettings());

    titleImage.parent(document.body)
    // Append elements to body
    linkContainer.parent(document.body);
    settingsToggle.parent(document.body);

    linksRendered = true; // Set flag to true
}

// 🎯 Helper Function to Create Buttons
function createLinkButton(parent, text, url) {
    let button = createButton(text).parent(parent);
    styleButton(button);
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
    if (renderLinks) {
        if (linkContainer.style("display") === "none") {
            linkContainer.style("display", "flex");
            settingsToggle.style("display", "flex")
            markee.style("display", "flex")
            titleImage.style("display", "flex");
        } else {
            linkContainer.style("display", "none");
            markee.style("display", "none")
            titleImage.style("display", "none");
            settingsToggle.style("display", "none")
            renderLinks = false
        }
    }
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

function renderServerBrowser() {
    if (!renderedserverBrowserContainer) {
        renderedserverBrowserContainer = true;

        serverBrowserContainer = createDiv();
        serverBrowserContainer.id("serverBrowserContainer");
        serverBrowserContainer.class("container");
        serverBrowserContainer.style("overflow-y", "scroll")
        // Main container styling
        serverBrowserContainer.style("max-width", "50dvw");
        serverBrowserContainer.style("max-height", "75%");
        serverBrowserContainer.style("overflow-y", "hide");
        serverBrowserContainer.style("border-radius", "15px");
        serverBrowserContainer.style("color", "#fff");
        serverBrowserContainer.style("font-family", "Arial, sans-serif");
        serverBrowserContainer.style("box-shadow", "0px 8px 16px rgba(0, 0, 0, 0.4)");

        // Position the container in the center
        serverBrowserContainer.style("position", "fixed");
        serverBrowserContainer.style("top", "58%");
        serverBrowserContainer.style("left", "50%");
        serverBrowserContainer.style("transform", "translate(-50%, -50%)");

        // Title
        let title = createDiv("Select A Server");
        title.style("font-size", "2.5rem");
        title.style("font-weight", "bold");
        title.style("margin-bottom", "15px");
        title.style("text-align", "center");
        title.parent(serverBrowserContainer);

        serverListDiv = createDiv();
        serverListDiv.parent(serverBrowserContainer);
        // Render the server list
        renderServerList();

        // ─────────────────────────────────────────────────────────
        //  ADD NEW SERVER (COLLAPSIBLE / DROPDOWN)
        // ─────────────────────────────────────────────────────────

        // Parent section that holds the "Add New Server" header and collapsible content
        let addServerSection = createDiv();
        addServerSection.style("margin-top", "100px");
        addServerSection.style("padding", "15px");
        addServerSection.style("background", "#2a2a2a");
        addServerSection.style("border-radius", "10px");

        // ➕ Add Server Title (CLICKABLE)
        // Use a downward arrow (▼) or "V" to indicate it's a dropdown
        let addServerTitle = createDiv("Add New Server ▼");

        addServerTitle.style("font-weight", "bold");
        addServerTitle.style("font-size", "1.8em");
        addServerTitle.style("margin-bottom", "10px");
        addServerTitle.style("text-align", "center");
        addServerTitle.style("cursor", "pointer"); // Indicate it can be clicked
        addServerTitle.parent(addServerSection);

        // Collapsible content container (initially hidden)
        let addServerContent = createDiv();
        addServerContent.style("display", "none");  // Hide by default
        addServerContent.parent(addServerSection);


        // Server IP Input
        inputIP = createInput("").attribute("placeholder", " Server IP");
        inputIP.parent(addServerContent);
        inputIP.style("width", "90%");
        inputIP.style("margin-bottom", "8px");
        inputIP.style("padding", "10px");
        inputIP.style("border-radius", "5px");

        // Add Server Button
        addServerButton = createButton("ADD");
        addServerButton.parent(addServerContent);
        addServerButton.style("width", "80%");
        addServerButton.style("padding", "10px");
        addServerButton.style("cursor", "pointer");
        addServerButton.style("color", "#fff");
        addServerButton.style("border", "none");
        addServerButton.style("border-radius", "5px");

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
            // Optionally change the arrow: "▼" for open or "►" for closed
            addServerTitle.html(dropdownOpen ? "Add New Server ▼" : "Add New Server ►");
        });

        // ─────────────────────────────────────────────────────────
        //  CONNECT BUTTON
        // ─────────────────────────────────────────────────────────
        let connectButton = createButton("▶ Connect");
        connectButton.parent(serverBrowserContainer);
        connectButton.style("width", "80%");
        connectButton.style("height", "5dvw");

        connectButton.style("font-size", "2rem");
        connectButton.style("margin-top", "20px");
        connectButton.style("padding", "12px");
        connectButton.style("background", "#4CAF50");
        connectButton.style("color", "#fff");
        connectButton.style("border", "none");
        connectButton.style("border-radius", "5px");

        addServerSection.parent(serverBrowserContainer);
        connectButton.mousePressed(() => {
            if (selectedServer) {
                //console.log(getServerUrl(selectedServer))
                socket = io.connect(getServerUrl(selectedServer));
                socketSetup();
                testMap = new Map();
                ghostBuild = createObject("Wall", 0, 0, 0, 0, " ", " ");
                //console.log("Connected to " + selectedServer, socket);
                hideServerBrowser();
                gameState = "race_selection";
                renderedserverBrowserContainer = false;
            } else {
                alert("⚠️ Please select a server first.");
            }
        });
    }
}

function getServerUrl(server) {
    const isLocal = isLocalAddress(server.ip);
    // Use HTTP with port 3000 for local, otherwise HTTPS with no extra port for production
    const scheme = isLocal ? "http" : "https";
    const port = isLocal ? ":3000" : "";
    return `${scheme}://${server.ip}${port}`;
}

function isLocalAddress(ipOrHost) {
    // Exact matches for localhost or loopback
    if (ipOrHost === 'localhost' || ipOrHost === '127.0.0.1') {
        return true;
    }

    // A simple regex for IPv4 addresses (it doesn't enforce 0-255 on each octet, but is sufficient for a basic check)
    return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ipOrHost);

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
    let oldEntries = selectAll(".serverEntry");
    for (let e of oldEntries) {
        e.remove();
    }

    serverList.forEach((server, index) => {
        let serverEntry = createDiv();
        serverEntry.class("serverEntry");

        // Basic layout styling
        serverEntry.style("font-size", "2rem");
        serverEntry.style("padding", "12px");
        serverEntry.style("margin-bottom", "12px");
        serverEntry.style("background-color", "var(--color-dirt-dark)");
        serverEntry.style("cursor", "pointer");
        serverEntry.style("display", "flex");
        serverEntry.style("align-items", "center"); // align items horizontally centered
        serverEntry.style("gap", "12px");
        serverEntry.style("transition", "transform 0.15s ease-in-out");

        // === Logo Container ===
        let logoContainer = createDiv();
        logoContainer.style("width", "100px");
        logoContainer.style("height", "100px");
        logoContainer.style("display", "flex");
        logoContainer.style("border-radius", "8px"); // blocky-pixel style instead of circular
        logoContainer.style("overflow", "hidden");
        logoContainer.style("border", "2px solid var(--color-dirt-clay)");

        let serverLogo = createImg(server.image);
        serverLogo.style("width", "100%");
        serverLogo.style("height", "100%");
        serverLogo.style("object-fit", "cover");
        serverLogo.parent(logoContainer);
        logoContainer.parent(serverEntry);

        // === Text Details Container ===
        let textContainer = createDiv();
        textContainer.style("display", "flex");
        textContainer.style("flex-direction", "column");
        textContainer.style("justify-content", "center");
        textContainer.style("flex-grow", "1");
        textContainer.style("font-size", "1.2rem");

        // Server Name
        let serverName = createDiv(server.name);
        serverName.style("font-weight", "bold");
        serverName.style("color", "white");
        serverName.style("margin-bottom", "20px");
        serverName.parent(textContainer);

        // IP
        let serverIP = createDiv(`IP: ${server.ip}`);
        serverIP.style("color", "yellow");
        serverIP.style("margin-bottom", "15px");
        serverIP.parent(textContainer);

        // Status
        let serverStatus = createDiv("Status: Loading...");
        serverStatus.style("color", "var(--color-gold)");
        serverStatus.style("margin-bottom", "15px");

        serverEntry.style("pointer-events", "none");

        serverEntry.style("opacity", "0.5");
        serverStatus.parent(textContainer);

        // Player Count
        let playerCount = createDiv("Players: Loading...");
        playerCount.style("color", "#00ffff"); // neon cyan stands out nicely
        playerCount.style("margin-bottom", "5px")
        playerCount.parent(textContainer);

        textContainer.parent(serverEntry);


        // Fetch server status
        fetchServerStatus(server, (data) => {
            serverStatus.html(`Status: ${data.status}`);
            serverStatus.style("color", data.status === "Online" ? "#4CAF50" : "#F44336");

            serverStatus.style("background-color", data.status === "Online" ? "black" : "white");
            serverName.html(data.name || "Unnamed Server")
            playerCount.html(`Players: ${data.playerCount}` +( !data.max ? ``: `/ ${data.max}`)) ;
            serverLogo.attribute("src", data.image);



            // Optionally, adjust opacity to signal a disabled state
            serverEntry.style("opacity", data.status === "Online" ? "1" : "0.5");

            // server entry can not be clicked if status is not online 
            serverEntry.style("pointer-events", data.status === "Online" ? "auto" : "none");
        });

        // Remove server button
        let removeButton = createButton(" &#x20E0; &nbsp; Remove ");
        removeButton.parent(serverEntry);
        removeButton.style("margin-left", "10px");
        removeButton.style("padding", "15px");
        removeButton.style("background-color", "#F44336");
        removeButton.style("color", "#fff");
        removeButton.style("border", "none");
        removeButton.style("border-radius", "3px");
        removeButton.style("cursor", "pointer");


        removeButton.style("pointer-events", "auto");


        removeButton.mousePressed(() => {
            serverList.splice(index, 1);
            saveServers();
            renderServerList();
            //renderServerList();
        });

        // Select a server
        serverEntry.mousePressed(() => {
            let entries = selectAll(".serverEntry");
            for (let e of entries) {
                e.style("background-color", "#404040");
            }
            serverEntry.style("background-color", "#4CAF50");
            selectedServer = server;
            //console.log("Server selected:", selectedServer);
        });

        serverEntry.parent(serverListDiv);
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
    // (Socket setup and raceImages flipping omitted for brevity)
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

    timerDiv = createDiv("⏳ 15:00");
    timerDiv.position(width / 2 - 250, 10); // adjust as needed
    timerDiv.style("font-size", "32px");
    timerDiv.style("color", "white");
    timerDiv.style("text-align", "center");
    timerDiv.style("width", "100px");
    timerDiv.style("background-color", "black");
    timerDiv.style("z-index", "10");
    timerDiv.hide();
    raceTitle = createDiv();
    // ---------------------------------------------------
    //  Create a container for race selection cards (centered)
    // ---------------------------------------------------
    raceContainer = createDiv();
    race_back_button = createButton("<- Back")
    raceContainer.id("raceContainer");
    raceContainer.style("position", "absolute");
    raceContainer.style("top", "40dvh");
    raceContainer.style("left", "50%");
    raceContainer.style("transform", "translateX(-50%)");
    raceContainer.style("display", "none");
    raceContainer.style("flex-wrap", "wrap");
    raceContainer.style("justify-content", "center");
    raceContainer.style("align-items", "center");
    raceContainer.style("gap", "30px");
    raceContainer.style("padding", "0px");
    raceContainer.style("border-radius", "10px");
    raceContainer.style("min-width", "100dvw")
    // ---------------------------------------------------
    //  Create cards for each race (with responsive sizing)
    // Allowed stats to display
    const allowedStats = ["hp", "mhp", "regen", "attack", "magic", "magicResistance", "hearing"];

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

        // Responsive card width: based on canvas width, constrained between 150 and 300px
        let cardWidth = constrain(width * 0.15, 150, 400);
        card.style("width", cardWidth + "px");
        card.style("border-radius", "10px");
        card.style("padding", "25px");
        card.style("cursor", "pointer");
        card.selected = false; // custom property for selection

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
        raceImg.style("max-width", "15dvw");
        raceImg.style("height", "15dvh");
        raceImg.style("image-rendering", "pixelated");
        raceImg.parent(card);

        // Retrieve stats from BASE_STATS (assumes the same order as races)
        let raceStats = BASE_STATS[i];
        // Build a text string for only the allowed stats
        let statsText = allowedStats
            .map(stat => `${stat}: ${raceStats[stat]}`)
            .join(" <br/><br/> ");

        // Create a label for the stats
        let raceStatsLbl = createP(statsText);
        raceStatsLbl.style("font-size", "calc(0.6vw + 2px)");
        raceStatsLbl.style("font-weight", "bold");
        raceStatsLbl.style("margin", "0");
        raceStatsLbl.style("align-self", "flex-end");
        raceStatsLbl.style("text-align", "right");
        raceStatsLbl.parent(card);

        // Hover out styling
        card.mouseOut(() => {
            card.style("transform", "scale(1)");
            card.style("box-shadow", "none");

            card.style("background-color", card.selected ? "#4CAF50" : "#222");
        });

        // On click: deselect all cards, select only this one
        card.mousePressed(() => {
            //console.log(selectedItem, i, raceName);

            // Deselect all cards
            raceButtons.forEach((c) => {
                c.selected = false;
                c.style("background-color", "#222"); // reset background for all
            });

            // Select this card
            card.selected = true;
            card.style("background-color", "#4CAF50");

            raceSelected = true;
            curRace = selectedItem;

            //console.log("Race selected:", races[selectedItem]);
        });


        // Hide the card initially (only shown in the race selection state)
        card.hide();
        card.parent(raceContainer);
        raceButtons.push(card);
    });

    race_back_button.hide()

    // ---------------------------------------------------
    //   Name Input Field (centered, larger & responsive)
    // ---------------------------------------------------
    nameInput = createInput("");
    nameInput.hide();
    let inputWidth = constrain(width * 0.5, 100, 200); // Responsive width
    let inputX = (width - inputWidth) / 2;
    let inputY = height * 0.86;
    nameInput.size(inputWidth, AUTO); // Auto height from padding
    nameInput.position(inputX, inputY);

    // Responsive base styling
    nameInput.style("font-size", width < 500 ? "14px" : "18px");
    nameInput.style("border-radius", "8px");
    nameInput.style("padding", "10px");
    nameInput.style("outline", "none");
    nameInput.style("transition", "border 0.2s, box-shadow 0.2s");
    nameInput.style("width", inputWidth + "px");
    nameInput.attribute("placeholder", "Name :");
    nameInput.style("border", "2px solid #ccc"); // base border

    // Focus style
    nameInput.elt.addEventListener("focus", () => {
        nameInput.style("border", "2px solid var(--color-gold)");
        nameInput.style("box-shadow", "0 0 6px rgba(255, 215, 0, 0.6)");


        nameInput.attribute("placeholder", "");
    });

    // Revert on blur
    nameInput.elt.addEventListener("blur", () => {
        nameInput.style("border", "2px solid #ccc");
        nameInput.style("box-shadow", "none");
    });


    // Optional shadow or backdrop (optional UX polish)
    nameInput.style("background-color", "rgba(255, 255, 255, 0.9)");
    nameInput.style("box-shadow", "2px 2px 4px rgba(0, 0, 0, 0.3)");


    nameInput.style("padding", "10px");
    nameInput.style("outline", "none");
    nameInput.attribute('placeholder', 'Name :');
    nameInput.style("transition", "border 0.2s");
    nameInput.input(() => {
        checkName();
    });
    nameInput.mouseOver(() => {
        nameInput.style("border", "3px black #4CAF50");
    });
    nameInput.mouseOut(() => {
        nameInput.style("border", "3px solid #ccc");
    });
    nameInput.elt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            startGame();
        }
    });


    // ---------------------------------------------------
    //   "Go" Button (centered, larger & responsive)
    // ---------------------------------------------------
    goButton = createButton("Go");
    goButton.hide();
    // Position near the name input with a fixed offset
    goButton.style("position", "absolute");
    goButton.style("left", "calc(50% + 130px)");
    goButton.style("top", "85dvh"); // or "80%" if more stable


    goButton.style("font-size", "20px");
    goButton.style("color", "#fff");
    goButton.style("border", "none");
    goButton.style("border-radius", "8px");
    goButton.style("padding", "10px 20px");

    goButton.style("margin-left", "20px");
    goButton.style("cursor", "pointer");
    goButton.style("transition", "background-color 0.2s, transform 0.2s");

    goButton.mouseOver(() => {
        goButton.style("transform", "scale(1.05)");
    });
    goButton.mouseOut(() => {
        goButton.style("transform", "scale(1)");
    });

    goButton.mousePressed(() => {
        startGame();
    })

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


function startGame() {
    //console.log(raceSelected, "sasd")
    if (!selectedServer) {
        alert("Issue with server retry.");
        return;
    }
    if (!raceSelected) {
        alert("Pick a race.");
        //console.log("SDSD")
        return;
    }

    if (!nameEntered) {
        alert("Pick a name.");
        return;
    }

    // 1) Pull the value from the name input.
    const nameVal = nameInput.value().trim();

    // 2) Check length
    if (nameVal.length === 0) {
        alert("Name cannot be empty.");
        return;
    }
    if (nameVal.length > 20) {
        alert("Name is too long (max 20 chars).");
        return;
    }

    // 3) Disallow spaces
    if (/\s/.test(nameVal)) {
        alert("Name cannot contain spaces.");
        return;
    }

    // 4) Letters and digits only
    if (!/^[A-Za-z0-9]+$/.test(nameVal)) {
        alert("Name can only contain letters and digits.");
        return;
    }

    // 5) Check forbidden words
    const badWords = ["badword", "someoffensiveword"];
    for (let badWord of badWords) {
        if (nameVal.toLowerCase().includes(badWord)) {
            alert("Name contains forbidden content.");
            return;
        }
    }

    // If all checks pass, make their character and send it to the server
    curPlayer = new Player(
        200, //random(-200*TILESIZE, 200*TILESIZE)
        200, //random(-200*TILESIZE, 200*TILESIZE)
        undefined,
        curID,
        0,
        curRace,
        nameVal
    ); // Default race index 0

    camera.pos = createVector(curPlayer.pos.x, curPlayer.pos.y);

    //load in some chunks for easy start
    let chunkPos = testMap.globalToChunk(curPlayer.pos.x, curPlayer.pos.y);
    for (let yOff = -2; yOff < 3; yOff++) {
        for (let xOff = -2; xOff < 3; xOff++) {
            testMap.getChunk(chunkPos.x + xOff, chunkPos.y + yOff);
        }
    }

    giveDefaultItems();

    document.getElementById("canvas-container").style.display = "block";
    socket.emit("new_player", curPlayer);
    gameState = "playing";
    hideRaceSelect();

    if (localStorage.getItem("tut_seen") == "true") {

        tutorialDiv.hide();
    } else {

        tutorialDiv.show();
        localStorage.setItem("tut_seen", "true")
    }

    // Clear a small area around the player (example logic)
    for (let y = -5; y < 5; y++) {
        for (let x = -5; x < 5; x++) {
            dig(curPlayer.pos.x + x * TILESIZE, curPlayer.pos.y + y * TILESIZE, 1, false);
            mine(curPlayer.pos.x + x * TILESIZE, curPlayer.pos.y + y * TILESIZE, 1, false);
        }
    }
}

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

// Helper function to add a chat message to the messages box
function addChatMessage(chatMsg) {
    if (!chatContainer) return

    //console.log(chatMsg)

    if (!chatMsg.user) {
        chatMsg.user = "SERVER"
    }
    // If your 'chatMsg' object doesn't have a time property, you can generate one:
    const timeString = chatMsg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
            updateSwapItemLists(curPlayer.otherInv.invBlock);
            updatecurSwapItemDiv(curPlayer.otherInv.invBlock);
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

    // Close Button
    let closeButton = createButton("X").parent(topBar);
    closeButton.class("close-button"); // Style it in CSS
    applyStyle(closeButton, {
        marginLeft: "auto",  // Pushes it to the right
        position: "absolute",
        fontSize: "18px",
        right: "0",
        color: "white",
        cursor: "pointer",
        background: "none",
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



function updateItemList() {
    if (curPlayer == undefined) return;

    itemListDiv.html("");
    //create a div for each item in the inventory
    let arr = Object.keys(curPlayer.invBlock.items);
    arr = arr.filter((itemName) => {
        if (curPlayer.invBlock.curTag == "All") {
            return true;
        }
        else if (curPlayer.invBlock.curTag == "Tools/Seeds") {
            if (curPlayer.invBlock.items[itemName].type == "Shovel" || curPlayer.invBlock.items[itemName].type == "Seed") {
                return true;
            }
        }
        else if (curPlayer.invBlock.curTag == "Weapons") {
            if (curPlayer.invBlock.items[itemName].type == "Melee" || curPlayer.invBlock.items[itemName].type == "Ranged") {
                return true;
            }
        }
        else if (curPlayer.invBlock.curTag == "Equipment") {
            if (curPlayer.invBlock.items[itemName].type == "Equipment") {
                return true;
            }
        }
        else if (curPlayer.invBlock.curTag == "Consumables") {
            if (curPlayer.invBlock.items[itemName].type == "Food" || curPlayer.invBlock.items[itemName].type == "Potion") {
                return true;
            }
        }

        return false;
    });

    for (let i = 0; i < arr.length; i++) {
        let itemName = arr[i];
        let itemDiv = createDiv();
        itemDiv.style("width", "100%");
        itemDiv.style("height", "50px");
        itemDiv.style("display", "flex");
        itemDiv.style("align-items", "center");
        itemDiv.style("justify-content", "center");
        itemDiv.style("border-bottom", "2px solid black");
        if (curPlayer.invBlock.curItem == itemName) itemDiv.style("background-color", "rgb(120, 120, 120)");
        if (curPlayer.invBlock.curItem == itemName) itemDiv.style("font-style", "italic");
        itemDiv.style("cursor", "pointer");
        itemDiv.parent(itemListDiv);
        itemDiv.mousePressed(() => {
            curPlayer.invBlock.curItem = itemName;
            //click to select item 
            updateItemList();
            updatecurItemDiv();
        });
        let itemInfoDiv = createDiv();
        itemInfoDiv.style("width", "80%");
        itemInfoDiv.style("height", "50px");
        itemInfoDiv.style("display", "flex");
        itemInfoDiv.style("align-items", "center");
        itemInfoDiv.style("justify-content", "space-between");
        itemInfoDiv.parent(itemDiv);

        // Add item icon (responsive, pixelated)
        let imgNum = curPlayer.invBlock.items[itemName].imgNum;
        //let itemImg = itemImgPaths[imgNum][0];
        let imgDiv = createDiv();
        imgDiv.style('width', '2.2em');  // Responsive size
        imgDiv.style('height', '2.2em');
        imgDiv.style('min-width', '28px');
        imgDiv.style('min-height', '28px');
        imgDiv.style('margin-right', '0.5em');
        imgDiv.style('display', 'flex');
        imgDiv.style('align-items', 'center');
        imgDiv.parent(itemInfoDiv);

        let imgEl = createImg(itemImgs[imgNum][0].canvas.toDataURL(), '');
        imgEl.style('width', '100%');
        imgEl.style('height', '100%');
        imgEl.style('image-rendering', 'pixelated');
        imgEl.style('pointer-events', 'none'); // Avoid accidental drag
        imgEl.parent(imgDiv);


        let itemNameP = createP((itemName == curPlayer.invBlock.curItem ? "* " : "") + itemName);
        itemNameP.style("font-size", "20px");
        itemNameP.style("color", "white");
        itemNameP.parent(itemInfoDiv);

        let itemAmount = createP(curPlayer.invBlock.items[itemName].amount);
        itemAmount.style("font-size", "20px");
        itemAmount.style("color", "white");
        itemAmount.parent(itemInfoDiv);
    }
}

function updatecurItemDiv() {
    if (curPlayer == undefined) return;

    //clear the div
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

    itemImgDiv.src = ""
    //console.log(itemImgPaths[curPlayer.invBlock.items[curPlayer.invBlock.curItem].imgNum][0]);
    itemImgDiv.style("background-image", "url('" + itemImgs[curPlayer.invBlock.items[curPlayer.invBlock.curItem].imgNum][0].canvas.toDataURL() + "')");
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
    itemNameP.style("color", "white");
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

var pauseDiv;
var resumeButton;
var serverSelectButton;
var optionsButton;



var player_status_container;


function styleButton(button) {
    button.style("width", "80%");
    button.style("padding", "10px");
    button.style("margin", "10px");
    button.style("font-size", "18px");
    button.style("border-radius", "5px");
    button.style("cursor", "pointer");
    button.style("color", "white");
}

function togglePlayerStatusTable() {
    // If the container doesn't exist, create and style it
    if (!player_status_container) {
        player_status_container = createDiv();
        player_status_container.id("player_status_container");
        player_status_container.class("container");
        player_status_container.style("position", "absolute");
        player_status_container.style("top", "50%");
        player_status_container.style("left", "50%");
        player_status_container.style("transform", "translate(-50%, -50%)");
        player_status_container.style("width", "30%");
        player_status_container.style("height", "40%");
        player_status_container.style("border", "2px solid black");
        player_status_container.style("border-radius", "10px");
        player_status_container.style("text-align", "center");
        player_status_container.style("padding", "20px");
        player_status_container.style("overflow", "hidden"); // clip if needed
        player_status_container.style("background-color", "#222");
        player_status_container.style("z-index", "999");
        player_status_container.hide();
    }

    // Toggle visibility
    const isVisible = player_status_container.style("display") !== "none";
    //console.log(isVisible)
    if (isVisible) {
        player_status_container.hide();
        return;
    }

    // Clear and fetch fresh data
    player_status_container.html("");

    const title = createP("Players").parent(player_status_container);
    title.style("font-size", "28px");
    title.style("font-weight", "bold");
    title.style("color", "white");
    title.style("text-decoration", "underline");

    if (gameState == "player_status") {
        fetch(getServerUrl(selectedServer) + "/playerinfo")
            .then(res => res.json())
            .then(players => {
                let tableWrapper = createDiv().parent(player_status_container);
                tableWrapper.style("overflow-y", "auto");
                tableWrapper.style("max-height", "70%");
                tableWrapper.style("margin-top", "10px");
                //console.log(players)
                let table = createElement("table").parent(tableWrapper);
                table.style("width", "100%");
                table.style("color", "white");
                table.style("border-collapse", "collapse");
                table.style("font-size", "1rem");

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




function definePauseUI() {
    settingsContainer = createDiv();
    settingsContainer.class("container");
    settingsContainer.style("position", "absolute");
    settingsContainer.style("font-family", "Arial, sans-serif");
    settingsContainer.style("margin", "0 auto");
    settingsContainer.style("width", "300px");
    settingsContainer.style("background-color", "#222");
    settingsContainer.style("color", "white");
    settingsContainer.style("padding", "20px");
    settingsContainer.style("border-radius", "10px");
    settingsContainer.style("display", "none");
    settingsContainer.style("flex-direction", "column");
    settingsContainer.style("align-items", "center");
    settingsContainer.style("z-index", "998");

    let title = createElement("h2", "Settings");
    title.parent(settingsContainer);

    let sliderContainer = createDiv()
        .parent(settingsContainer)
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("gap", "15px")
        .style("margin", "20px 0");

    let effectsRow = createDiv()
        .parent(sliderContainer)
        .style("display", "flex")
        .style("align-items", "center");

let savedVolume = localStorage.getItem("volume");
savedVolume = savedVolume !== null ? parseInt(savedVolume) : 50;

    let volumeLabel = createElement("label", "🔊 Volume:")
        .parent(effectsRow)
        .style("font-size", "16px")
        .style("margin-right", "10px");

    volumeSlider = createSlider(0, 100, savedVolume)
        .parent(effectsRow)
        .style("width", "150px");

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
        .style("display", "flex")
        .style("align-items", "center");

    let savedMusic = localStorage.getItem("musicVolume");
    savedMusic = savedMusic !== null ? parseInt(savedMusic) : 50;
    let musicVolLabel = createElement("label", "🎵 Music:")
        .parent(musicRow)
        .style("font-size", "16px")
        .style("margin-right", "10px");

    musicVolumeSlider = createSlider(0, 100, savedMusic)
        .parent(musicRow)
        .style("width", "150px");

    musicVolumeSlider.input(() => {
        let mv = musicVolumeSlider.value();
        localStorage.setItem("musicVolume", mv);
        if (MusicPlayer) MusicPlayer.setVolume();
    });

    keyBind_Button = createButton("Key Bindings");
    keyBind_Button.parent(sliderContainer);
    keyBind_Button.class("button");
    keyBind_Button.style("padding", "10px");
    keyBind_Button.style("margin-top", "20px");
    keyBind_Button.style("background-color", "#444");
    keyBind_Button.style("border", "none");
    keyBind_Button.style("color", "white");
    keyBind_Button.style("border-radius", "5px");
    keyBind_Button.style("cursor", "pointer");
    keyBind_Button.mousePressed(() => {
        gameState = "controls";
        settingsContainer.hide();
        bindingDiv.show();
    });

    removeData_button = createButton("Remove Data");
    removeData_button.parent(sliderContainer);
    removeData_button.class("button");
    removeData_button.style("padding", "10px");
    removeData_button.style("margin-top", "20px");
    removeData_button.style("background-color", "#444");
    removeData_button.style("border", "none");
    removeData_button.style("color", "white");
    removeData_button.style("border-radius", "5px");
    removeData_button.style("cursor", "pointer");
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
    saveButton.class("button");
    saveButton.style("padding", "10px");
    saveButton.style("margin-top", "20px");
    saveButton.style("background-color", "#444");
    saveButton.style("border", "none");
    saveButton.style("color", "white");
    saveButton.style("border-radius", "5px");
    saveButton.style("cursor", "pointer");
    saveButton.parent(settingsContainer);
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
    pauseDiv.class("container");
    pauseDiv.style("position", "absolute");
    pauseDiv.style("top", "50%");
    pauseDiv.style("left", "50%");
    pauseDiv.style("transform", "translate(-50%, -50%)");
    pauseDiv.style("display", "none");
    pauseDiv.style("flex-direction", "column");
    pauseDiv.style("align-items", "center");
    pauseDiv.style("justify-content", "space-evenly");
    pauseDiv.style("width", "30%");
    pauseDiv.style("height", "40%");
    pauseDiv.style("border", "2px solid black");
    pauseDiv.style("border-radius", "10px");
    pauseDiv.style("text-align", "center");
    pauseDiv.style("padding", "20px");

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


var oldState = "";



// Toggle function for settings menu
function toggleSettings() {
    if (gameState === "settings") {
        // Hide settings (remove iframe and reset game state)
        settingsContainer.style('display', 'none');
        gameState = oldState;  // Restore to previous game state
    } else {
        // Show settings iframe and set game state to "settings"
        oldState = gameState;  // Store the current game state
        settingsContainer.style('display', 'flex');  // Show the iframe
        gameState = "settings";  // Set game state to settings
    }
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

    let raceName = races[curPlayer.race];
    image(raceImages[raceName].portrait, width - 30 - 115 + 6 + 7, 7, 98, 98);

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
    //fill with team color
    fill(teamColors[curPlayer.color].r, teamColors[curPlayer.color].g, teamColors[curPlayer.color].b);
    stroke(teamColors[curPlayer.color].r, teamColors[curPlayer.color].g, teamColors[curPlayer.color].b);
    textAlign(CENTER, CENTER);
    nameBtn = createButton(curPlayer.name);

    // Style it to look like plain text
    nameBtn.style('background', 'none');
    nameBtn.style('border', 'none');
    nameBtn.style('padding', '0');
    nameBtn.style('color', `rgb(${teamColors[curPlayer.color].r},
                                ${teamColors[curPlayer.color].g},
                                ${teamColors[curPlayer.color].b})`);
    nameBtn.style('font-size', '20px');   // adjust if needed
    nameBtn.style('cursor', 'pointer');   // so it behaves like clickable text

    // Position it EXACTLY where your text was
    let x = width - 530 + 6 + 45 + (350 / 2);
    let y = 19;
    nameBtn.position(x, y);

    // Add onclick action
    nameBtn.mousePressed(() => {
        gameState = "team_select";
        teamPickDiv.show();
    });

    let box = gameUIFont.textBounds(curPlayer.name, width - 530 + 6 + 45 + (350 / 2), 19);
    line(box.x, box.y + box.h + 4, box.x + box.w, box.y + box.h + 4);
    pop();
}


var teamPickDiv;

function defineTeamPickUI() {
    teamPickDiv = createDiv();
    teamPickDiv.class("container");
    teamPickDiv.id("teamPickDiv");
    teamPickDiv.style("position", "absolute");
    teamPickDiv.style("top", "50%");
    teamPickDiv.style("left", "50%");
    teamPickDiv.style("transform", "translate(-50%, -50%)");
    teamPickDiv.style("display", "none");
    teamPickDiv.style("width", "25%");
    // teamPickDiv.style("height", "20%");
    teamPickDiv.style("border", "2px solid black");
    teamPickDiv.style("border-radius", "10px");
    teamPickDiv.style("text-align", "center");
    teamPickDiv.style("padding", "20px");

    updateTeamPickUI();
}

function updateTeamPickUI() {
    teamPickDiv.html("");

    let teamPickTitle = createP("Pick Team");
    teamPickTitle.style("font-size", "28px");
    teamPickTitle.style("font-weight", "bold");
    teamPickTitle.style("color", "white");
    teamPickTitle.style("text-decoration", "underline");
    teamPickTitle.style("margin", "0px");
    teamPickTitle.style("margin-bottom", "10px");
    teamPickTitle.parent(teamPickDiv);

    //turn the team colors into buttons
    for (let i = 0; i < teamColors.length; i++) {
        let teamButton = createButton("");

        teamButton.style("width", "50px");
        teamButton.style("height", "50px");
        teamButton.style("background-color", "rgb(" + teamColors[i].r + "," + teamColors[i].g + "," + teamColors[i].b + ")");
        teamButton.style("margin", "10px");
        teamButton.style("padding", "0px");
        teamButton.style("border-radius", "0px");
        teamButton.style("border", "2px solid black");
        teamButton.style("box-shadow", "0 0 0 4px rgb(128, 128, 128)");
        teamButton.style("cursor", "pointer");
        if (curPlayer == undefined) {
            if (i == 0) {
                teamButton.style("box-shadow", "0 0 0 4px rgb(128, 128, 128), 0 0 0 8px rgb(255, 255, 255)");
            }
        }
        else {
            if (curPlayer.color == i) {
                teamButton.style("box-shadow", "0 0 0 4px rgb(128, 128, 128), 0 0 0 8px rgb(255, 255, 255)");
            }
        }
        if (i == 0) {
            teamButton.style("background-color", "rgb(0,0,0)");
            teamButton.style("background-image", "url('images/ui/none.png')");
            teamButton.style("background-size", "contain");
            teamButton.style("background-repeat", "no-repeat");
            teamButton.style("background-position", "center");
        }

        teamButton.mousePressed(() => {
            curPlayer.color = i;
            socket.emit("update_player", {
                id: curPlayer.id,
                pos: curPlayer.pos,
                holding: curPlayer.holding,
                update_names: ["color"],
                update_values: [curPlayer.color]
            });
            updateTeamPickUI();
            teamPickDiv.hide();
            gameState = "playing";
            curPlayer.invBlock.useTimer = 10;
        });
        teamButton.parent(teamPickDiv);
    }
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

    // Close Button
    let closeButton = createButton("X").parent(swapInvTitleBar);
    closeButton.class("close-button"); // Style it in CSS
    applyStyle(closeButton, {
        marginLeft: "auto",  // Pushes it to the right
        position: "absolute",
        fontSize: "18px",
        right: "0",
        color: "white",
        cursor: "pointer",
        background: "none",
        border: "none",
    });

    closeButton.mousePressed(() => {
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
 * Rebuilds the two inventory columns for swapping between the current player and another inventory.
 * Never throws if an image/frame is missing; falls back to a text placeholder.
 *
 * @param {Inventory} otherInv
 */
function updateSwapItemLists(otherInv) {
    if (!curPlayer || !curPlayer.invBlock) return;

    updatecurSwapItemDiv(otherInv);

    // LEFT SIDE (current player)
    itemListDivLeft.html("");

    /** @type {Record<string, ItemEntry>} */
    const myItems = curPlayer.invBlock.items || {};
    let arr = Object.keys(myItems);

    for (let i = 0; i < arr.length; i++) {
        const itemName = arr[i];
        const entry = myItems[itemName] || { amount: 0 };

        const itemDiv = createDiv();
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
            updateSwapItemLists(otherInv);
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

        const dataURL = getItemFrameDataURL(entry.imgNum);
        let imgEl;
        if (dataURL) {
            imgEl = createImg(dataURL, "");
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
        itemNameP.style("color", "white");
        itemNameP.parent(itemInfoDiv);

        const itemAmount = createP(String(entry.amount ?? 0));
        itemAmount.style("font-size", "20px");
        itemAmount.style("color", "white");
        itemAmount.parent(itemInfoDiv);
    }

    // RIGHT SIDE (other inventory)
    itemListDivRight.html("");
    /** @type {Inventory} */
    const safeOther = otherInv || /** @type {Inventory} */({ items: {}, curItem: "" });
    const otherItems = safeOther.items || {};
    arr = Object.keys(otherItems);

    for (let i = 0; i < arr.length; i++) {
        const itemName = arr[i];
        const entry = otherItems[itemName] || { amount: 0 };

        const itemDiv = createDiv();
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
            updateSwapItemLists(safeOther);
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

        const dataURL = getItemFrameDataURL(entry.imgNum);
        if (dataURL) {
            const imgEl = createImg(dataURL, "");
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
        itemNameP.style("color", "white");
        itemNameP.parent(itemInfoDiv);

        const itemAmount = createP(String(entry.amount ?? 0));
        itemAmount.style("font-size", "20px");
        itemAmount.style("color", "white");
        itemAmount.parent(itemInfoDiv);
    }
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

    /** @type {Inventory} */
    const safeOther = otherInv || /** @type {Inventory} */ ({ items: {}, curItem: "" });

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
    const bgURL = getItemFrameDataURL(curSwapItem.imgNum);
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
    itemNameP.style("color", "white");
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
let timerRemaining = 15 * 60; // in seconds
let lastUpdateTime = 0;

let timerDisplay = "15:00";
function setTimeUI(data) {
    //console.log(data)
    timerRemaining = data.totalSeconds ?? (data.minutes * 60 + data.seconds);
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

    // Optional: call resize function here
    adjustFontSize(timerRemaining);
}
function adjustFontSize(timerRemaining) {
    const el = document.getElementById("timer");

    if (!el) return;

    if (timerRemaining >= 365 * 24 * 3600) {
        el.style.fontSize = "1.2rem"; // Years
    } else if (timerRemaining >= 24 * 3600) {
        el.style.fontSize = "1.5rem"; // Days
    } else if (timerRemaining >= 3600) {
        el.style.fontSize = "2rem"; // Hours
    } else {
        el.style.fontSize = "2.5rem"; // MM:SS
    }
}


function renderTimeUI() {
    if (millis() - lastUpdateTime >= 1000) {
        if (timerRemaining > 0) {
            timerRemaining--;
            updateTimerDisplay();
        }
        lastUpdateTime = millis();
    }
    if (timerDiv) {
        timerDiv.html(" ⏳ " + timerDisplay);
        applyStyle(timerDiv, {
            position: "absolute",
            width: "auto"

        });
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

    let closeButton = createButton("X").parent(topBar);
    closeButton.class("close-button");
    applyStyle(closeButton, {
        marginLeft: "auto",
        position: "absolute",
        right: "0",
        fontSize: "18px",
        cursor: "pointer",
        background: "none",
        color: "white",
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


    for (let i = 0; i < arr.length; i++) {
        let itemName = arr[i].itemName;
        let itemDiv = createDiv();
        applyStyle(itemDiv, {
            width: "100%",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "2px solid black",
            cursor: "pointer",
            backgroundColor: curPlayer.invBlock.curItem == itemName ? "rgb(120, 120, 120)" : "",
            fontStyle: curPlayer.invBlock.curItem == itemName ? "italic" : "normal"
        });
        itemDiv.parent(craftListDiv);
        itemDiv.mousePressed(() => {
            curPlayer.invBlock.curItem = itemName;
            updateCraftList();
            updatecurCraftItemDiv();
        });

        let itemInfoDiv = createDiv().parent(itemDiv);
        applyStyle(itemInfoDiv, {
            width: "80%",
            height: "50px",
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

        let imgEl = createImg(itemImgs[arr[i].imgNum][0].canvas.toDataURL(), '').parent(imgDiv);
        applyStyle(imgEl, {
            width: "100%",
            height: "100%",
            imageRendering: "pixelated",
            pointerEvents: "none"
        });

        let itemNameP = createP(itemName).parent(itemInfoDiv);
        itemNameP.style("font-size", "20px");
        itemNameP.style("color", "white");

        let craftCheckText = createP(curPlayer.invBlock.craftCheck(itemName) ? "✔" : "✘").parent(itemInfoDiv);
        craftCheckText.style("font-size", "20px");
        craftCheckText.style("color", curPlayer.invBlock.craftCheck(itemName) ? "green" : "red");
    }
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
    applyStyle(itemImgDiv, {
        width: "50%",
        height: "100%",
        border: "2px solid black",
        borderRadius: "10px",
        backgroundImage: `url('${itemImgs[itemData.img][0].canvas.toDataURL()}')`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        imageRendering: "pixelated"
    });

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
        color: "white",
        margin: "5px"
    });

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
        location.reload();
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
    let closeButton = createButton("X").parent(topBar);
    applyStyle(closeButton, {
        fontSize: "18px",
        cursor: "pointer",
        background: "none",
        color: "white",
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

var bindingDiv;

function defineKeyBindingUI() {
    //make div to hold the key binding UI
    bindingDiv = createDiv();
    bindingDiv.style("background-color", "var(--color-ui-dark)");
    bindingDiv.style("border", "2px solid var(--color-dirt-dark)");
    bindingDiv.style("border-radius", "10px");
    bindingDiv.style("padding", "10px");
    bindingDiv.style("z-index", "999");
    bindingDiv.style("position", "absolute");
    bindingDiv.style("top", "50%");
    bindingDiv.style("left", "50%");
    bindingDiv.style("transform", "translate(-50%, -50%)");
    bindingDiv.id("bindingDiv");
    bindingDiv.hide();

    bindingTitle = createP("Key Bindings");
    bindingTitle.style("padding", "10px 5px");
    bindingTitle.style("margin", "0px");
    bindingTitle.style("text-align", "center");
    bindingTitle.style("font-size", "30px");
    bindingTitle.style("color", "white");
    bindingTitle.parent(bindingDiv);

    contentDiv = createDiv();
    contentDiv.style("display", "flex");
    contentDiv.parent(bindingDiv);

    doneButtonDiv = createDiv();
    doneButtonDiv.style("width", "100%");
    doneButtonDiv.style("display", "flex");
    doneButtonDiv.style("align-items", "center");
    doneButtonDiv.style("justify-content", "center");
    doneButtonDiv.parent(bindingDiv);

    doneButton = createButton("Done");
    doneButton.class("button");
    doneButton.style("font-size", "25px");
    doneButton.style("background-color", "rgb(76, 175, 80)");
    doneButton.style("border-radius", "10px");
    doneButton.style("color", "white");
    doneButton.parent(doneButtonDiv);
    doneButton.mousePressed(() => {
        bindingDiv.hide();
        gameState = "settings";
        settingsContainer.show();
    });



    namesDiv = createDiv();
    namesDiv.id("namesDiv");
    namesDiv.parent(contentDiv);
    namesDiv.style("height", "auto");

    //create the labels for each key
    Controls_Up = createP("Move Up:");
    Controls_Up.style("padding", "10px 5px");
    Controls_Up.style("margin", "0px");
    Controls_Up.style("text-align", "end");
    Controls_Up.style("font-size", "20px");
    Controls_Up.style("color", "white");
    Controls_Up.parent(namesDiv);

    Controls_Left = createP("Move Left:");
    Controls_Left.style("padding", "10px 5px");
    Controls_Left.style("margin", "0px")
    Controls_Left.style("text-align", "end");
    Controls_Left.style("font-size", "20px");
    Controls_Left.style("color", "white");
    Controls_Left.parent(namesDiv);

    Controls_Down = createP("Move Down:");
    Controls_Down.style("padding", "10px 5px");
    Controls_Down.style("margin", "0px");
    Controls_Down.style("text-align", "end");
    Controls_Down.style("font-size", "20px");
    Controls_Down.style("color", "white");
    Controls_Down.parent(namesDiv);

    Controls_Right = createP("Move Right:");
    Controls_Right.style("padding", "10px 5px");
    Controls_Right.style("margin", "0px");
    Controls_Right.style("text-align", "end");
    Controls_Right.style("font-size", "20px");
    Controls_Right.style("color", "white");
    Controls_Right.parent(namesDiv);

    Controls_Interact = createP("Interact:");
    Controls_Interact.style("padding", "10px 5px");
    Controls_Interact.style("margin", "0px");
    Controls_Interact.style("text-align", "end");
    Controls_Interact.style("font-size", "20px");
    Controls_Interact.style("color", "white");
    Controls_Interact.parent(namesDiv);

    Controls_Inventory = createP("Inventory:");
    Controls_Inventory.style("padding", "10px 5px");
    Controls_Inventory.style("margin", "0px");
    Controls_Inventory.style("text-align", "end");
    Controls_Inventory.style("font-size", "20px");
    Controls_Inventory.style("color", "white");
    Controls_Inventory.parent(namesDiv);

    Controls_Crafting = createP("Crafting:");
    Controls_Crafting.style("padding", "10px 5px");
    Controls_Crafting.style("margin", "0px");
    Controls_Crafting.style("text-align", "end");
    Controls_Crafting.style("font-size", "20px");
    Controls_Crafting.style("color", "white");
    Controls_Crafting.parent(namesDiv);

    Controls_Pause = createP("Pause:");
    Controls_Pause.style("padding", "10px 5px");
    Controls_Pause.style("margin", "0px");
    Controls_Pause.style("text-align", "end");
    Controls_Pause.style("font-size", "20px");
    Controls_Pause.style("color", "white");
    Controls_Pause.parent(namesDiv);

    Controls_MoveHotBarRight = createP("Move HotBar Right:");
    Controls_MoveHotBarRight.style("padding", "10px 5px");
    Controls_MoveHotBarRight.style("margin", "0px");
    Controls_MoveHotBarRight.style("text-align", "end");
    Controls_MoveHotBarRight.style("font-size", "20px");
    Controls_MoveHotBarRight.style("color", "white");
    Controls_MoveHotBarRight.parent(namesDiv);

    Controls_MoveHotBarLeft = createP("Move HotBar Left:");
    Controls_MoveHotBarLeft.style("padding", "10px 5px");
    Controls_MoveHotBarLeft.style("margin", "0px");
    Controls_MoveHotBarLeft.style("text-align", "end");
    Controls_MoveHotBarLeft.style("font-size", "20px");
    Controls_MoveHotBarLeft.style("color", "white");
    Controls_MoveHotBarLeft.parent(namesDiv);

    Controls_Build = createP("Build:");
    Controls_Build.style("padding", "10px 5px");
    Controls_Build.style("margin", "0px");
    Controls_Build.style("text-align", "end");
    Controls_Build.style("font-size", "20px");
    Controls_Build.style("color", "white");
    Controls_Build.parent(namesDiv);

    Controls_Space = createP("Space:");
    Controls_Space.style("padding", "10px 5px");
    Controls_Space.style("margin", "0px");
    Controls_Space.style("text-align", "end");
    Controls_Space.style("font-size", "20px");
    Controls_Space.style("color", "white");
    Controls_Space.parent(namesDiv);

    keysDiv = createDiv();
    keysDiv.id("keysDiv");
    keysDiv.style("display", "flex");
    keysDiv.style("flex-direction", "column");
    keysDiv.parent(contentDiv);
    //create the buttons for each key

    //if we want transparent buttons, we can use this
    //Controls_Up_button.style('background','url()');
    //Controls_Up.style("border","none");
    Controls_Up_button = createButton(keyToVisualKey(Controls_Up_key));
    Controls_Up_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 1;
            key = Controls_Up_key;
            lastKey = key;
            Controls_Up_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Up_button.style('min-width', '90px');
    Controls_Up_button.style("cursor", "pointer");
    Controls_Up_button.parent(keysDiv);

    Controls_Left_button = createButton(keyToVisualKey(Controls_Left_key));
    Controls_Left_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 2;
            key = Controls_Left_key;
            lastKey = key;
            Controls_Left_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Left_button.style('min-width', '90px');
    Controls_Left_button.style("cursor", "pointer");
    Controls_Left_button.parent(keysDiv);

    Controls_Down_button = createButton(keyToVisualKey(Controls_Down_key));
    Controls_Down_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 3;
            key = Controls_Down_key;
            lastKey = key;
            Controls_Down_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Down_button.style('min-width', '90px');
    Controls_Down_button.style("cursor", "pointer");
    Controls_Down_button.parent(keysDiv);

    Controls_Right_button = createButton(keyToVisualKey(Controls_Right_key));
    Controls_Right_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 4;
            key = Controls_Right_key;
            lastKey = key;
            Controls_Right_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Right_button.style('min-width', '90px');
    Controls_Right_button.style("cursor", "pointer");
    Controls_Right_button.parent(keysDiv);

    Controls_Interact_button = createButton(keyToVisualKey(Controls_Interact_key));
    Controls_Interact_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 5;
            key = Controls_Interact_key;
            lastKey = key;
            Controls_Interact_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Interact_button.style('min-width', '90px');
    Controls_Interact_button.style("cursor", "pointer");
    Controls_Interact_button.parent(keysDiv);

    Controls_Inventory_button = createButton(keyToVisualKey(Controls_Inventory_key));
    Controls_Inventory_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 6;
            key = Controls_Inventory_key;
            lastKey = key;
            Controls_Inventory_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Inventory_button.style('min-width', '90px');
    Controls_Inventory_button.style("cursor", "pointer");
    Controls_Inventory_button.parent(keysDiv);

    Controls_Crafting_button = createButton(keyToVisualKey(Controls_Crafting_key));
    Controls_Crafting_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 7;
            key = Controls_Crafting_key;
            lastKey = key;
            Controls_Crafting_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Crafting_button.style('min-width', '90px');
    Controls_Crafting_button.style("cursor", "pointer");
    Controls_Crafting_button.parent(keysDiv);

    Controls_Pause_button = createButton(keyToVisualKey(Controls_Pause_key));
    Controls_Pause_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 8;
            key = Controls_Pause_key;
            lastKey = key;
            Controls_Pause_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Pause_button.style('min-width', '90px');
    Controls_Pause_button.style("cursor", "pointer");
    Controls_Pause_button.parent(keysDiv);

    Controls_MoveHotBarRight_button = createButton(keyToVisualKey(Controls_MoveHotBarRight_key));
    Controls_MoveHotBarRight_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 9;
            key = Controls_MoveHotBarRight_key;
            lastKey = key;
            Controls_MoveHotBarRight_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_MoveHotBarRight_button.style('min-width', '90px');
    Controls_MoveHotBarRight_button.style("cursor", "pointer");
    Controls_MoveHotBarRight_button.parent(keysDiv);

    Controls_MoveHotBarLeft_button = createButton(keyToVisualKey(Controls_MoveHotBarLeft_key));
    Controls_MoveHotBarLeft_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 10;
            key = Controls_MoveHotBarLeft_key;
            lastKey = key;
            Controls_MoveHotBarLeft_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_MoveHotBarLeft_button.style('min-width', '90px');
    Controls_MoveHotBarLeft_button.style("cursor", "pointer");
    Controls_MoveHotBarLeft_button.parent(keysDiv);

    Controls_Build_button = createButton(keyToVisualKey(Controls_Build_key));
    Controls_Build_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 11;
            key = Controls_Build_key;
            lastKey = key;
            Controls_Build_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Build_button.style('min-width', '90px');
    Controls_Build_button.style("cursor", "pointer");
    Controls_Build_button.parent(keysDiv);

    Controls_Space_button = createButton(keyToVisualKey(Controls_Space_key));
    Controls_Space_button.mousePressed(() => {
        if (control_set == 0) {
            control_set = 12;
            key = Controls_Space_key;
            lastKey = key;
            Controls_Space_button.style("background-color", "var(--color-gold)");
        }
    });
    Controls_Space_button.style('min-width', '90px');
    Controls_Space_button.style("cursor", "pointer");
    Controls_Space_button.parent(keysDiv);
}

function keyToVisualKey(key) {
    if (key == " ") { key = "Space"; }
    if (key == "ArrowUp") { key = "↑"; }
    if (key == "ArrowLeft") { key = "←"; }
    if (key == "ArrowDown") { key = "↓"; }
    if (key == "ArrowRight") { key = "→"; }

    return key;
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

    // Close Button
    let closeButton = createButton("X").parent(topBar);
    closeButton.class("close-button"); // Style it in CSS
    applyStyle(closeButton, {
        marginLeft: "auto",  // Pushes it to the right
        position: "absolute",
        fontSize: "18px",
        right: "0",
        color: "white",
        cursor: "pointer",
        background: "none",
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