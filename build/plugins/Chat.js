/**
 * @name Chat
 * @description Adds an in-game chat to 2d gamemodes
 * @author TheLazySquid
 * @version 0.3.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Chat.js
 * @webpage https://gimloader.github.io/plugins/Chat
 * @needsLib Communication | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/Communication.js
 * @gamemode 2d
 * @changelog Added typing indicator
 */

// plugins/Chat/src/consts.ts
var maxLength = 1e3;

// plugins/Chat/src/styles.css
var styles_default = `#gl-chat {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.3);
    transition: background 0.5s;
    bottom: 15vh;
    left: 15px;
    width: 350px;
    z-index: 50;
    min-height: 300px;
    display: flex;
    flex-direction: column;
}

#chat-spacer {
    flex-grow: 1;
}

#chat-messages-wrap {
    max-height: 400px;
    overflow-y: auto;
    scrollbar-color: rgba(255, 255, 255, 0.5) transparent;
}

#chat-messages {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    color: white;
    padding: 5px;
}

#gl-chat input {
    width: 100%;
    border: none;
}
`;

// plugins/Chat/src/ui.ts
api.UI.addStyles(styles_default);
api.hotkeys.addConfigurableHotkey({
  category: "Chat",
  title: "Open Chat",
  preventDefault: false,
  default: {
    key: "KeyY"
  }
}, (e) => {
  if (document.activeElement !== document.body) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  UI.input?.focus();
});
var format = null;
api.rewriter.exposeVar("App", {
  check: ">%SPACE_HERE",
  find: /}\);const (\S+)=.=>.{0,175}>%SPACE_HERE%/,
  callback: (formatter) => format = formatter
});
var UI = class _UI {
  static send;
  static element;
  static messageWrapper;
  static messageContainer;
  static input;
  static typingDetails;
  static maxLength = 100;
  static history = [];
  static enabled = false;
  static init(send) {
    _UI.send = send;
    _UI.element = document.createElement("div");
    _UI.element.id = "gl-chat";
    const spacer = document.createElement("div");
    spacer.id = "chat-spacer";
    _UI.element.appendChild(spacer);
    _UI.messageWrapper = document.createElement("div");
    _UI.messageWrapper.id = "chat-messages-wrap";
    _UI.element.appendChild(_UI.messageWrapper);
    _UI.messageContainer = document.createElement("div");
    _UI.messageContainer.id = "chat-messages";
    _UI.messageWrapper.appendChild(_UI.messageContainer);
    _UI.typingDetails = document.createElement("div");
    _UI.typingDetails.id = "typing-details";
    _UI.typingDetails.className = "text-white text-sm h-6";
    _UI.messageWrapper.appendChild(_UI.typingDetails);
    _UI.input = _UI.createInput();
    _UI.element.appendChild(_UI.input);
    document.body.appendChild(_UI.element);
    api.onStop(() => _UI.element.remove());
    const blurInput = () => _UI.input?.blur();
    document.addEventListener("click", blurInput);
    api.onStop(() => document.removeEventListener("click", blurInput));
  }
  static createInput() {
    const input = document.createElement("input");
    input.maxLength = maxLength;
    input.disabled = true;
    input.placeholder = "...";
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("keydown", async (e) => {
      e.stopPropagation();
      if (e.key.length === 1 && e.key.charCodeAt(0) >= 256) e.preventDefault();
      if (e.key === "Escape") {
        input.blur();
        return;
      }
      if (e.key === "Enter") {
        const message = input.value;
        if (message.length === 0) return;
        input.value = "";
        input.placeholder = "Sending...";
        input.disabled = true;
        await _UI.send(message);
        if (!_UI.enabled) return;
        input.disabled = false;
        input.placeholder = "...";
        input.focus();
        return;
      }
    });
    return input;
  }
  static addMessage(message, forceScroll = false) {
    const element = document.createElement("div");
    if (format) {
      element.innerHTML = format({ inputText: message });
    } else {
      element.innerText = message;
    }
    const wrap = _UI.messageWrapper;
    const shouldScroll = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 1;
    _UI.history.push(element);
    _UI.messageContainer.appendChild(element);
    if (_UI.history.length > _UI.maxLength) {
      _UI.history.shift()?.remove();
    }
    if (shouldScroll || forceScroll) wrap.scrollTop = wrap.scrollHeight;
  }
  static setEnabled(enabled) {
    _UI.enabled = enabled;
    if (enabled) {
      _UI.input.disabled = false;
      _UI.input.placeholder = "...";
    } else {
      _UI.input.disabled = true;
      _UI.input.placeholder = "Chat not available in lobby";
    }
  }
  static setPlayersTyping(text) {
    _UI.typingDetails.textContent = text;
  }
};

// plugins/Chat/src/index.ts
var settings = api.settings.create([
  {
    id: "transmitTyping",
    type: "toggle",
    title: "Transmit Typing",
    description: "Show other players when you are typing",
    default: true
  }
]);
api.net.onLoad(() => {
  const myId = api.stores.network.authId;
  api.net.on("ACTIVITY_FEED_MESSAGE", (message, editFn) => {
    UI.addMessage(`> ${message.message}`);
    editFn(null);
  });
  const me = api.net.room.state.characters.get(myId);
  const Comms = api.lib("Communication");
  const comms = new Comms("Chat");
  UI.init(async (text) => {
    try {
      await comms.send(text);
      UI.addMessage(`${me.name}: ${text}`, true);
    } catch {
      UI.addMessage("Message failed to send", true);
    }
  });
  const joinedPlayers = /* @__PURE__ */ new Set();
  let typing = false;
  let timeout;
  let playersTyping = [];
  function stopTyping() {
    if (!Comms.enabled || !typing) return;
    comms.send(4 /* NotTyping */);
    typing = false;
  }
  if (settings.transmitTyping) {
    UI.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") return;
      if (typing) {
        clearTimeout(timeout);
      } else {
        typing = true;
        comms.send(3 /* Typing */);
      }
      timeout = setTimeout(() => stopTyping(), 3e3);
    });
    UI.input.addEventListener("blur", () => {
      if (UI.input.disabled) return;
      stopTyping();
    });
  }
  function updatePlayersTyping() {
    const names = playersTyping.map((player) => player.name);
    if (names.length === 0) {
      UI.setPlayersTyping("");
    } else if (names.length > 3) {
      UI.setPlayersTyping("Several players are typing...");
    } else if (names.length === 1) {
      UI.setPlayersTyping(`${names[0]} is typing...`);
    } else {
      UI.setPlayersTyping(`${names.slice(0, -2).join(", ")} and ${names.at(-1)} are typing.`);
    }
  }
  comms.onMessage((message, char) => {
    const removeTyping = () => playersTyping = playersTyping.filter((c) => c !== char);
    if (typeof message === "string") {
      UI.addMessage(`${char.name}: ${message}`);
      removeTyping();
      updatePlayersTyping();
    } else {
      if (message === 0 /* Join */) {
        if (joinedPlayers.has(char.id)) return;
        UI.addMessage(`${char.name} connected to the chat`);
        joinedPlayers.add(char.id);
      } else if (message === 1 /* Leave */) {
        UI.addMessage(`${char.name} left the chat`);
        joinedPlayers.delete(char.id);
        removeTyping();
        updatePlayersTyping();
      } else if (message === 2 /* Greet */) {
        UI.addMessage(`${char.name} connected to the chat`);
        comms.send(0 /* Join */);
        joinedPlayers.add(char.id);
      } else if (message === 3 /* Typing */) {
        playersTyping.push(char);
        updatePlayersTyping();
      } else if (message === 4 /* NotTyping */) {
        removeTyping();
        updatePlayersTyping();
      }
    }
  });
  api.onStop(api.net.room.state.characters.onRemove((char) => {
    joinedPlayers.delete(char.id);
    playersTyping = playersTyping.filter((c) => c !== char);
  }));
  if (Comms.enabled) {
    comms.send(2 /* Greet */);
    UI.setEnabled(true);
  } else {
    UI.setEnabled(false);
  }
  comms.onEnabledChanged(() => {
    UI.setEnabled(Comms.enabled);
    if (Comms.enabled) {
      UI.addMessage("The chat is active!");
      comms.send(0 /* Join */);
    } else {
      UI.addMessage("The chat is no longer active");
      playersTyping = [];
      updatePlayersTyping();
      if (typing) {
        clearTimeout(timeout);
      }
    }
  });
  function sendLeave() {
    if (!Comms.enabled) return;
    comms.send(1 /* Leave */);
  }
  window.addEventListener("beforeunload", sendLeave);
  api.onStop(() => {
    sendLeave();
    comms.destroy();
  });
});
