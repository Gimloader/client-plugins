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

// external-svelte:svelte
var mount = /* @__PURE__ */ (() => GL.svelte_5_43_0.Index.mount)();
var tick = /* @__PURE__ */ (() => GL.svelte_5_43_0.Index.tick)();
var unmount = /* @__PURE__ */ (() => GL.svelte_5_43_0.Index.unmount)();

// external-svelte:svelte/internal/client
var append = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.append)();
var append_styles = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.append_styles)();
var bind_this = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.bind_this)();
var bind_value = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.bind_value)();
var child = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.child)();
var delegate = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.delegate)();
var derived = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.derived)();
var each = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.each)();
var event = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.event)();
var from_html = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.from_html)();
var get = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.get)();
var index = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.index)();
var pop = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.pop)();
var proxy = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.proxy)();
var push = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.push)();
var remove_input_defaults = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.remove_input_defaults)();
var reset = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.reset)();
var set = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set)();
var set_attribute = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set_attribute)();
var set_text = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set_text)();
var sibling = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.sibling)();
var state = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.state)();
var template_effect = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.template_effect)();

// plugins/Chat/src/chatter.ts
var Comms = api.lib("Communication");
var settings = api.settings.create([
  {
    id: "transmitTyping",
    type: "toggle",
    title: "Transmit Typing",
    description: "Show other players when you are typing",
    default: true
  }
]);
var Chatter = class {
  constructor(addMessage, updatePlayersTypingText, setEnabled) {
    this.addMessage = addMessage;
    this.updatePlayersTypingText = updatePlayersTypingText;
    api.net.on("ACTIVITY_FEED_MESSAGE", (message, editFn) => {
      addMessage(`> ${message.message}`);
      editFn(null);
    });
    if (Comms.enabled) {
      this.comms.send(2 /* Greet */);
      setEnabled(true);
    } else {
      setEnabled(false);
    }
    const joinedPlayers = /* @__PURE__ */ new Set();
    this.comms.onMessage((message, char) => {
      const removePlayerTyping = () => {
        this.playersTyping = this.playersTyping.filter((c) => c !== char);
      };
      if (typeof message === "string") {
        this.addMessage(`${char.name}: ${message}`);
        removePlayerTyping();
      } else {
        switch (message) {
          case 0 /* Join */:
            if (joinedPlayers.has(char.id)) return;
            this.addMessage(`${char.name} connected to the chat`);
            joinedPlayers.add(char.id);
            break;
          case 1 /* Leave */:
            this.addMessage(`${char.name} left the chat`);
            joinedPlayers.delete(char.id);
            removePlayerTyping();
            this.playersTyping = this.playersTyping.filter((c) => c !== char);
            break;
          case 2 /* Greet */:
            addMessage(`${char.name} connected to the chat`);
            this.comms.send(0 /* Join */);
            joinedPlayers.add(char.id);
            break;
          case 3 /* Typing */:
            this.playersTyping.push(char);
            break;
          case 4 /* NotTyping */:
            removePlayerTyping();
            break;
        }
      }
      this.updatePlayersTyping();
    });
    api.onStop(
      api.net.room.state.characters.onRemove((char) => {
        joinedPlayers.delete(char.id);
        this.playersTyping = this.playersTyping.filter((c) => c !== char);
      })
    );
    this.comms.onEnabledChanged(() => {
      setEnabled(Comms.enabled);
      if (Comms.enabled) {
        addMessage("The chat is active!");
        this.comms.send(0 /* Join */);
      } else {
        addMessage("The chat is no longer active");
        this.playersTyping = [];
        this.updatePlayersTyping();
        if (this.typing && this.timeout) {
          clearTimeout(this.timeout);
        }
      }
    });
    window.addEventListener("beforeunload", this.sendLeave);
    api.onStop(() => {
      this.sendLeave();
      this.comms.destroy();
      window.removeEventListener("beforeunload", this.sendLeave);
    });
  }
  comms = new Comms("Chat");
  me = api.net.room.state.characters.get(api.stores.network.authId);
  typing = false;
  timeout = null;
  playersTyping = [];
  updatePlayersTyping() {
    const names = this.playersTyping.map((player) => player.name);
    if (names.length === 0) {
      this.updatePlayersTypingText("");
    } else if (names.length > 3) {
      this.updatePlayersTypingText("Several players are typing...");
    } else if (names.length === 1) {
      this.updatePlayersTypingText(`${names[0]} is typing...`);
    } else {
      this.updatePlayersTypingText(`${names.slice(0, -2).join(", ")} and ${names.at(-1)} are typing.`);
    }
  }
  sendLeave() {
    if (!Comms.enabled) return;
    this.comms.send(1 /* Leave */);
  }
  async send(text) {
    try {
      await this.comms.send(text);
      this.addMessage(`${this.me.name}: ${text}`, true);
    } catch {
      this.addMessage("Message failed to send", true);
    }
  }
  sendTyping() {
    if (!settings.transmitTyping) return;
    if (this.typing) {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = null;
    } else {
      this.typing = true;
      this.comms.send(3 /* Typing */);
    }
    this.timeout = setTimeout(() => this.stopTyping(), 3e3);
  }
  stopTyping() {
    if (!Comms.enabled || !this.typing) return;
    this.comms.send(4 /* NotTyping */);
    this.typing = false;
  }
};

// plugins/Chat/src/UI.svelte
var root_1 = from_html(`<div> </div>`);
var root = from_html(`<div class="gl-chat svelte-9jbcin"><div class="chat-spacer svelte-9jbcin"></div> <div class="chat-messages-wrap svelte-9jbcin"><div class="chat-messages svelte-9jbcin"></div> <div class="typing-text svelte-9jbcin"> </div></div> <input class="svelte-9jbcin"/></div>`);
var $$css = {
  hash: "svelte-9jbcin",
  code: ".gl-chat.svelte-9jbcin {position:fixed;background-color:rgba(0, 0, 0, 0.3);transition:background 0.5s;bottom:15vh;left:15px;width:350px;z-index:50;min-height:300px;display:flex;flex-direction:column;}.chat-spacer.svelte-9jbcin {flex-grow:1;}.chat-messages-wrap.svelte-9jbcin {max-height:400px;overflow-y:auto;scrollbar-color:rgba(255, 255, 255, 0.5) transparent;}.chat-messages.svelte-9jbcin {display:flex;flex-direction:column;justify-content:flex-end;color:white;padding:5px;}.typing-text.svelte-9jbcin {padding-left:5px;height:1.5rem;color:white;font-size:small;}.gl-chat.svelte-9jbcin input:where(.svelte-9jbcin) {width:100%;border:none;}"
};
function UI($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css);
  let format = null;
  api.rewriter.exposeVar("App", {
    check: ">%SPACE_HERE",
    find: /}\);const (\S+)=.=>.{0,175}>%SPACE_HERE%/,
    callback: (formatter) => format = formatter
  });
  api.hotkeys.addConfigurableHotkey(
    {
      category: "Chat",
      title: "Open Chat",
      preventDefault: false,
      default: { key: "KeyY" }
    },
    (e) => {
      if (document.activeElement !== document.body) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      input.focus();
    }
  );
  let messages = proxy([]);
  let playersTypingText = state("");
  let inputText = state("");
  let enabled = state(false);
  let sending = state(false);
  let wrap;
  let input;
  let inputPlaceholder = derived(() => {
    if (!get(enabled)) return "Chat not available in lobby";
    if (get(sending)) return "Sending...";
    return "...";
  });
  function addMessage(text, forceScroll = false) {
    if (format) text = format({ inputText: text });
    if (messages.length === 100) messages.splice(0, 1);
    messages.push(text);
    const shouldScroll = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 1;
    if (shouldScroll || forceScroll) wrap.scrollTop = wrap.scrollHeight;
  }
  const chatter = new Chatter(addMessage, (text) => set(playersTypingText, text, true), (e) => set(enabled, e, true));
  var div = root();
  var div_1 = sibling(child(div), 2);
  var div_2 = child(div_1);
  each(div_2, 21, () => messages, index, ($$anchor2, message) => {
    var div_3 = root_1();
    var text_1 = child(div_3, true);
    reset(div_3);
    template_effect(() => set_text(text_1, get(message)));
    append($$anchor2, div_3);
  });
  reset(div_2);
  var div_4 = sibling(div_2, 2);
  var text_2 = child(div_4, true);
  reset(div_4);
  reset(div_1);
  bind_this(div_1, ($$value) => wrap = $$value, () => wrap);
  var input_1 = sibling(div_1, 2);
  remove_input_defaults(input_1);
  input_1.__keydown = (e) => {
    e.stopPropagation();
    if (e.key.length === 1 && e.key.charCodeAt(0) >= 256) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      set(sending, true);
      chatter.send(get(inputText)).then(async () => {
        set(sending, false);
        await tick();
        input.focus();
      });
      set(inputText, "");
      return;
    }
    if (e.key === "Escape") {
      e.currentTarget.blur();
      chatter.stopTyping();
      return;
    }
    chatter.sendTyping();
  };
  set_attribute(input_1, "maxlength", 1e3);
  bind_this(input_1, ($$value) => input = $$value, () => input);
  reset(div);
  template_effect(() => {
    set_text(text_2, get(playersTypingText));
    set_attribute(input_1, "placeholder", get(inputPlaceholder));
    input_1.disabled = get(sending) || !get(enabled);
  });
  event("blur", input_1, () => {
    if (get(sending)) return;
    chatter.stopTyping();
  });
  bind_value(input_1, () => get(inputText), ($$value) => set(inputText, $$value));
  append($$anchor, div);
  pop();
}
delegate(["keydown"]);

// plugins/Chat/src/index.ts
api.net.onLoad(() => {
  const ui = mount(UI, { target: document.body });
  api.onStop(() => {
    unmount(ui);
  });
});
