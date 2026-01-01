/**
 * @name Chat
 * @description Adds an in-game chat to 2d gamemodes
 * @author TheLazySquid
 * @version 0.2.4
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Chat.js
 * @webpage https://gimloader.github.io/plugins/chat
 * @gamemode 2d
 * @changelog Fixed chat colors not working when loaded mid-game
 */

// plugins/Chat/src/consts.ts
var identifier = [163, 58, 3, 206];
var maxLength = 1e3;

// plugins/Chat/src/encoding.ts
function bytesToFloat(bytes) {
  const buffer = new ArrayBuffer(8);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < 7; i++) {
    view[i] = bytes[i];
  }
  return new Float64Array(buffer)[0];
}
function floatToBytes(float) {
  const buffer = new ArrayBuffer(8);
  const floatView = new Float64Array(buffer);
  floatView[0] = float;
  const byteView = new Uint8Array(buffer);
  return Array.from(byteView);
}
function encodeMessage(message) {
  let codes = message.split("").map((c) => c.charCodeAt(0));
  codes = codes.filter((c) => c < 256);
  if (codes.length === 0) return;
  codes = codes.slice(0, maxLength);
  const charsLow = codes.length & 255;
  const charsHigh = (codes.length & 65280) >> 8;
  const header = [...identifier, 0 /* Transmit */, charsHigh, charsLow];
  const messages = [bytesToFloat(header)];
  while (codes.length % 7 !== 0) codes.push(0);
  for (let i = 0; i < codes.length; i += 7) {
    const msg = [];
    for (let j = 0; j < 7; j++) {
      msg[j] = codes[i + j];
    }
    messages.push(bytesToFloat(msg));
  }
  return messages;
}

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
  static maxLength = 100;
  static history = [];
  static enabled = false;
  static init(send2) {
    _UI.send = send2;
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
};

// plugins/Chat/src/index.ts
api.net.onLoad(() => {
  const myId = api.stores.network.authId;
  let sending = false;
  let ignoreNextAngle = false;
  let realAngle = 0;
  api.net.on("send:AIMING", (message, editFn) => {
    if (!sending) return;
    if (ignoreNextAngle) {
      ignoreNextAngle = false;
      return;
    }
    realAngle = message.angle;
    editFn(null);
  });
  api.net.on("ACTIVITY_FEED_MESSAGE", (message, editFn) => {
    UI.addMessage(`> ${message.message}`);
    editFn(null);
  });
  const me = api.net.room.state.characters.get(myId);
  let angleChangeRes;
  api.onStop(me.projectiles.listen("aimAngle", (angle) => {
    if (angle === 0) return;
    angleChangeRes?.();
  }));
  UI.init(async (text) => {
    const messages = encodeMessage(text);
    if (!messages) return;
    sending = true;
    for (const message of messages) {
      ignoreNextAngle = true;
      send(message);
      await new Promise((res) => angleChangeRes = res);
    }
    sending = false;
    send(realAngle);
    UI.addMessage(`${me.name}: ${text}`, true);
  });
  const messageStates = /* @__PURE__ */ new Map();
  api.onStop(api.net.room.state.characters.onAdd((char) => {
    if (char.id === myId) return;
    api.onStop(char.projectiles.listen("aimAngle", (angle) => {
      if (angle === 0) return;
      const bytes = floatToBytes(angle);
      const newPlayer = !messageStates.has(char);
      if (newPlayer) messageStates.set(char, { message: "", charsRemaining: 0 });
      const state = messageStates.get(char);
      if (bytes[0] === identifier[0] && bytes[1] === identifier[1] && bytes[2] === identifier[2] && bytes[3] === identifier[3]) {
        const op = bytes[4];
        if (op === 0 /* Transmit */) {
          const high = bytes[5];
          const low = bytes[6];
          state.charsRemaining = Math.min(maxLength, (high << 8) + low);
          state.message = "";
        } else if (op === 1 /* Join */ && newPlayer) {
          UI.addMessage(`${char.name} connected to the chat`);
        } else if (op === 2 /* Leave */ && !newPlayer) {
          UI.addMessage(`${char.name} left the chat`);
          messageStates.delete(char);
        } else if (op === 3 /* Greet */ && newPlayer) {
          UI.addMessage(`${char.name} connected to the chat`);
          sendOp(1 /* Join */);
        }
      } else if (state.charsRemaining > 0) {
        for (let i = 0; i < Math.min(7, state.charsRemaining); i++) {
          state.message += String.fromCharCode(bytes[i]);
        }
        state.charsRemaining -= 7;
        if (state.charsRemaining <= 0) {
          UI.addMessage(`${char.name}: ${state.message}`);
        }
      }
    }));
  }));
  if (api.net.room.state.session.phase === "game") {
    sendOp(3 /* Greet */);
  }
  api.onStop(api.net.room.state.session.listen("phase", (phase) => {
    UI.setEnabled(phase === "game");
  }));
  api.onStop(api.net.room.state.session.listen("phase", (phase) => {
    if (phase === "game") {
      UI.addMessage("The chat is active!");
      messageStates.clear();
      sendOp(1 /* Join */);
    } else {
      UI.addMessage("The chat is no longer active");
    }
  }, false));
  window.addEventListener("beforeunload", () => {
    sendOp(2 /* Leave */);
  });
  api.onStop(() => sendOp(2 /* Leave */));
});
function sendOp(op) {
  const message = [...identifier, op, 0, 0];
  send(bytesToFloat(message));
}
function send(message) {
  api.net.send("AIMING", { angle: message });
}
