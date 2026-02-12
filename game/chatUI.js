// Chat UI module extracted from ui.js
// Exports all chat UI logic and globals

// Global variables for chat UI elements and player count display
let chatContainer, chatMessagesBox, chatInput, chatSendButton;
let chatRendered = false;
let toggleChatButton; // Button to collapse/expand chat
let inputContainer;   // Reference to hide/show input container
let isChatOpen = true; // Will be set to false on mobile in renderChatUI()
let unreadChatCount = 0; // Track number of unread messages
let chatNotificationBadge; // Badge element for unread count
let lastReadTimestamp = Date.now(); // Track when user last viewed chat
let chatFloatingBtn = null; // Mobile floating chat button
let chatFloatingBadge = null; // Badge on floating button

function renderChatUI() {
    if (chatRendered) return;
    chatRendered = true;

    const mobile = (typeof isMobileDevice !== 'undefined' && isMobileDevice);

    // ── Mobile: create floating chat icon button ──
    if (mobile) {
        chatFloatingBtn = createDiv('💬');
        chatFloatingBtn.id('chat-floating-btn');
        chatFloatingBtn.style('position', 'fixed');
        chatFloatingBtn.style('left', '12px');
        chatFloatingBtn.style('top', '60px');
        chatFloatingBtn.style('z-index', '9995');
        chatFloatingBtn.style('width', '44px');
        chatFloatingBtn.style('height', '44px');
        chatFloatingBtn.style('border-radius', '50%');
        chatFloatingBtn.style('background', 'rgba(0,0,0,0.65)');
        chatFloatingBtn.style('border', '2px solid rgba(255,255,255,0.25)');
        chatFloatingBtn.style('color', '#fff');
        chatFloatingBtn.style('font-size', '18px');
        chatFloatingBtn.style('display', 'flex');
        chatFloatingBtn.style('align-items', 'center');
        chatFloatingBtn.style('justify-content', 'center');
        chatFloatingBtn.style('cursor', 'pointer');
        chatFloatingBtn.style('touch-action', 'manipulation');
        chatFloatingBtn.mousePressed(function() {
            toggleChatDropdown();
        });

        // Badge on the floating button
        chatFloatingBadge = createSpan('');
        chatFloatingBadge.class('chat-badge');
        chatFloatingBadge.style('display', 'none');
        chatFloatingBadge.parent(chatFloatingBtn);
    }

    // Create main chat container
    chatContainer = createDiv();
    chatContainer.id('chat-container');
    chatContainer.style('position', 'fixed');
    chatContainer.style('bottom', '24px');
    chatContainer.style('left', '24px');
    chatContainer.style('width', '25dvw');
    chatContainer.style('max-width', '90vw');
    chatContainer.style('background', 'rgba(30,30,30,0.95)');
    chatContainer.style('border-radius', '10px');
    chatContainer.style('box-shadow', '0 2px 12px #0008');
    chatContainer.style('z-index', '1000');
    chatContainer.style('font-family', 'sans-serif');
    chatContainer.style('overflow', 'hidden');
    chatContainer.style('display', 'flex');
    chatContainer.style('flex-direction', 'column');

    // Toggle/collapse button
    toggleChatButton = createButton('Chat (Players: 1) ▼');
    toggleChatButton.parent(chatContainer);
    toggleChatButton.style('width', '100%');
    toggleChatButton.style('background', '#222');
    toggleChatButton.style('color', '#fff');
    toggleChatButton.style('font-weight', 'bold');
    toggleChatButton.style('border', 'none');
    toggleChatButton.style('padding', '8px 0');
    toggleChatButton.style('cursor', 'pointer');
    toggleChatButton.mousePressed(toggleChatDropdown);

    // Notification badge
    chatNotificationBadge = createDiv('');
    chatNotificationBadge.parent(toggleChatButton);
    chatNotificationBadge.style('position', 'absolute');
    chatNotificationBadge.style('right', '16px');
    chatNotificationBadge.style('top', '8px');
    chatNotificationBadge.style('background', '#ff4444');
    chatNotificationBadge.style('color', '#fff');
    chatNotificationBadge.style('border-radius', '10px');
    chatNotificationBadge.style('padding', '2px 7px');
    chatNotificationBadge.style('font-size', '12px');
    chatNotificationBadge.style('display', 'none');
    chatNotificationBadge.style('z-index', '1001');

    // Messages box
    chatMessagesBox = createDiv();
    chatMessagesBox.parent(chatContainer);
    chatMessagesBox.id('chat-messages-box');
    chatMessagesBox.style('height', '180px');
    chatMessagesBox.style('overflow-y', 'auto');
    chatMessagesBox.style('background', 'rgba(0,0,0,0.2)');
    chatMessagesBox.style('padding', '10px');
    chatMessagesBox.style('flex', '1');
    chatMessagesBox.style('font-size', '15px');
    chatMessagesBox.style('color', '#fff');

    // Input container
    inputContainer = createDiv();
    inputContainer.parent(chatContainer);
    inputContainer.style('display', 'flex');
    inputContainer.style('padding', '8px');
    inputContainer.style('background', '#222');
    inputContainer.style('border-top', '1px solid #333');

    // Input box
    chatInput = createInput('');
    chatInput.parent(inputContainer);
    chatInput.id('chat-input');
    chatInput.attribute('placeholder', 'Type a message...');
    chatInput.style('flex', '1');
    chatInput.style('padding', '7px 10px');
    chatInput.style('border-radius', '5px');
    chatInput.style('border', '1px solid #444');
    chatInput.style('background', '#181818');
    chatInput.style('color', '#fff');
    chatInput.style('font-size', '15px');
    chatInput.style('margin-right', '8px');
    chatInput.elt.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Send button
    chatSendButton = createButton('Send');
    chatSendButton.parent(inputContainer);
    chatSendButton.style('padding', '7px 16px');
    chatSendButton.style('border-radius', '5px');
    chatSendButton.style('border', 'none');
    chatSendButton.style('background', '#3a7');
    chatSendButton.style('color', '#fff');
    chatSendButton.style('font-weight', 'bold');
    chatSendButton.style('font-size', '15px');
    chatSendButton.style('cursor', 'pointer');
    chatSendButton.mousePressed(sendChatMessage);

    // On mobile, start hidden (CSS hides it, floating btn opens it); on desktop, start open
    if (typeof isMobileDevice !== 'undefined' && isMobileDevice) {
        isChatOpen = false;
        // CSS `display: none !important` on #chat-container keeps it hidden
        // Adding .chat-open class shows it
    } else {
        isChatOpen = true;
    }
    updateToggleChatButtonText();
    updateChatNotificationBadge();
}

function toggleChatDropdown() {
    const mobile = (typeof isMobileDevice !== 'undefined' && isMobileDevice);
    if (isChatOpen) {
        if (mobile) {
            // Close the bottom-sheet
            chatContainer.removeClass('chat-open');
        } else {
            chatMessagesBox.hide();
            inputContainer.hide();
        }
    } else {
        if (mobile) {
            chatContainer.addClass('chat-open');
            chatMessagesBox.show();
            inputContainer.show();
            chatMessagesBox.elt.scrollTop = chatMessagesBox.elt.scrollHeight;
            setTimeout(function() { chatInput.elt.focus(); }, 100);
        } else {
            chatMessagesBox.show();
            inputContainer.show();
        }
        markChatAsRead();
    }
    isChatOpen = !isChatOpen;
    updateToggleChatButtonText();
}

function updateToggleChatButtonText() {
    const playerCount = Object.keys(players).length + 1;
    const mobile = (typeof isMobileDevice !== 'undefined' && isMobileDevice);
    if (mobile) {
        // On mobile the toggle button is a "Close" button inside the overlay
        toggleChatButton.html(`✕ Close Chat (${playerCount} online)`);
    } else {
        const arrow = isChatOpen ? "▼" : "▲";
        toggleChatButton.html(`Chat (Players: ${playerCount}) ${arrow}`);
    }
    if (chatNotificationBadge) {
        chatNotificationBadge.parent(toggleChatButton);
    }
    updateChatNotificationBadge();
}

function updatePlayerCount() {
    const playerCount = Object.keys(players).length + 1;
    const mobile = (typeof isMobileDevice !== 'undefined' && isMobileDevice);
    if (toggleChatButton != undefined) {
        if (mobile) {
            toggleChatButton.html(`✕ Close Chat (${playerCount} online)`);
        } else {
            const arrow = isChatOpen ? "▼" : "▲";
            toggleChatButton.html(`Chat (Players: ${playerCount}) ${arrow}`);
        }
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
    // Also update the floating button badge on mobile
    if (chatFloatingBadge) {
        if (unreadChatCount > 0) {
            chatFloatingBadge.html(unreadChatCount > 99 ? "99+" : String(unreadChatCount));
            chatFloatingBadge.style("display", "block");
        } else {
            chatFloatingBadge.style("display", "none");
        }
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
