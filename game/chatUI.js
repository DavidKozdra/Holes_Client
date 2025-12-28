// Chat UI module extracted from ui.js
// Exports all chat UI logic and globals

// Global variables for chat UI elements and player count display
let chatContainer, chatMessagesBox, chatInput, chatSendButton;
let chatRendered = false;
let toggleChatButton; // Button to collapse/expand chat
let inputContainer;   // Reference to hide/show input container
let isChatOpen = true; // Track whether the chat is currently open or collapsed
let unreadChatCount = 0; // Track number of unread messages
let chatNotificationBadge; // Badge element for unread count
let lastReadTimestamp = Date.now(); // Track when user last viewed chat

function renderChatUI() {
    if (chatRendered) return;
    chatRendered = true;
    // ...existing code from ui.js renderChatUI...
}

function toggleChatDropdown() {
    if (isChatOpen) {
        chatMessagesBox.hide();
        inputContainer.hide();
    } else {
        chatMessagesBox.show();
        inputContainer.show();
        markChatAsRead();
    }
    isChatOpen = !isChatOpen;
    updateToggleChatButtonText();
}

function updateToggleChatButtonText() {
    const playerCount = Object.keys(players).length + 1;
    const arrow = isChatOpen ? "▼" : "▲";
    toggleChatButton.html(`Chat (Players: ${playerCount}) ${arrow}`);
    if (chatNotificationBadge) {
        chatNotificationBadge.parent(toggleChatButton);
    }
    updateChatNotificationBadge();
}

function updatePlayerCount() {
    const playerCount = Object.keys(players).length + 1;
    const arrow = isChatOpen ? "▼" : "▲";
    if (toggleChatButton != undefined) {
        toggleChatButton.html(`Chat (Players: ${playerCount}) ${arrow}`);
        if (chatNotificationBadge) {
            chatNotificationBadge.parent(toggleChatButton);
        }
        updateChatNotificationBadge();
    }
}

function sendChatMessage() {
    let message = chatInput.value();
    if (message.trim() === "") return;
    let x = curPlayer && curPlayer.pos ? curPlayer.pos.x : 0;
    let y = curPlayer && curPlayer.pos ? curPlayer.pos.y : 0;
    let data = `${x},${y},${message}`;
    if (socket) {
        socket.emit("send_message", data);
    }
    chatInput.value("");
    if (!isChatOpen) {
        unreadChatCount = 0;
        updateChatNotificationBadge();
    } else {
        markChatAsRead();
    }
}

function formatChatTimestamp(rawTime) {
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    let d = rawTime ? new Date(rawTime) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addChatMessage(chatMsg) {
    if (!chatContainer) return;
    if (!chatMsg.user) chatMsg.user = "SERVER";
    const timeString = formatChatTimestamp(chatMsg.time);
    const isNewMessage = !isChatOpen;
    if (!isChatOpen) {
        unreadChatCount++;
        updateChatNotificationBadge();
    }
    let msgContainer = createDiv();
    msgContainer.style("display", "flex");
    msgContainer.style("align-items", "center");
    msgContainer.style("margin-bottom", "6px");
    msgContainer.class(isNewMessage ? "chat-message-unread" : "chat-message-read");
    if (isNewMessage) {
        let unreadIndicator = createDiv("●");
        unreadIndicator.style("color", "#ff4444");
        unreadIndicator.style("font-size", "12px");
        unreadIndicator.style("margin-right", "6px");
        unreadIndicator.style("animation", "pulse 1.5s ease-in-out infinite");
        msgContainer.child(unreadIndicator);
    }
    let textContainer = createDiv(`<strong>${chatMsg.user}:</strong> ${chatMsg.message}`);
    textContainer.style("color", "#fff");
    textContainer.style("background-color", isNewMessage ? "rgba(255, 68, 68, 0.15)" : "#333");
    textContainer.style("padding", "6px 8px");
    textContainer.style("border-radius", "5px 0 0 5px");
    textContainer.style("flex", "1");
    textContainer.style("font-size", "0.9em");
    if (isNewMessage) {
        textContainer.style("border-left", "3px solid #ff4444");
    }
    let timeDiv = createDiv(timeString);
    timeDiv.style("background-color", isNewMessage ? "rgba(255, 68, 68, 0.3)" : "#555");
    timeDiv.style("color", "#ccc");
    timeDiv.style("padding", "6px 8px");
    timeDiv.style("border-radius", "0 5px 5px 0");
    timeDiv.style("margin-left", "4px");
    timeDiv.style("font-size", "0.8em");
    timeDiv.style("white-space", "nowrap");
    msgContainer.child(textContainer);
    msgContainer.child(timeDiv);
    chatMessagesBox.child(msgContainer);
    chatMessagesBox.elt.scrollTop = chatMessagesBox.elt.scrollHeight;
}

function updateChatNotificationBadge() {
    if (!chatNotificationBadge) return;
    if (unreadChatCount > 0) {
        chatNotificationBadge.html(unreadChatCount > 99 ? "99+" : String(unreadChatCount));
        chatNotificationBadge.style("display", "flex");
    } else {
        chatNotificationBadge.style("display", "none");
    }
}

function markChatAsRead() {
    unreadChatCount = 0;
    lastReadTimestamp = Date.now();
    updateChatNotificationBadge();
    if (chatMessagesBox && chatMessagesBox.elt) {
        const messages = chatMessagesBox.elt.querySelectorAll('.chat-message-unread');
        messages.forEach(msg => {
            msg.classList.remove('chat-message-unread');
            msg.classList.add('chat-message-read');
            const indicator = msg.querySelector('div');
            if (indicator && indicator.innerHTML === '●') {
                indicator.remove();
            }
            const textContainer = msg.querySelectorAll('div')[0];
            if (textContainer) {
                textContainer.style.backgroundColor = '#333';
                textContainer.style.borderLeft = '';
            }
            const timeDiv = msg.querySelectorAll('div')[1];
            if (timeDiv) {
                timeDiv.style.backgroundColor = '#555';
            }
        });
    }
}

// Expose globals
window.renderChatUI = renderChatUI;
window.toggleChatDropdown = toggleChatDropdown;
window.updateToggleChatButtonText = updateToggleChatButtonText;
window.updatePlayerCount = updatePlayerCount;
window.sendChatMessage = sendChatMessage;
window.addChatMessage = addChatMessage;
window.updateChatNotificationBadge = updateChatNotificationBadge;
window.markChatAsRead = markChatAsRead;
