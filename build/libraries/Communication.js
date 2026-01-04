/**
 * @name Communication
 * @description Communication between different clients in 2D gamemodes
 * @author retrozy
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js
 * @gamemode 2d
 * @changelog Fixed messages sent at the same time being dropped
 * @isLibrary true
 */

// libraries/Communication/src/encoding.ts
var isUint8 = (n) => Number.isInteger(n) && n >= 0 && n <= 255;
function bytesToFloat(bytes) {
  const buffer = new ArrayBuffer(8);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < 7; i++) {
    view[i] = bytes[i] ?? 0;
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
function getIdentifier(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hash = hash * 31 + charCode | 0;
  }
  const uInt32Hash = hash >>> 0;
  return [
    uInt32Hash >>> 24 & 255,
    uInt32Hash >>> 16 & 255,
    uInt32Hash >>> 8 & 255,
    uInt32Hash & 255
  ];
}
function encodeStringMessage(identifier, op, message) {
  let codes = message.split("").map((c) => c.charCodeAt(0));
  codes = codes.filter((c) => c < 256);
  const charsLow = codes.length & 255;
  const charsHigh = (codes.length & 65280) >> 8;
  const header = [...identifier, op, charsHigh, charsLow];
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

// libraries/Communication/src/core.ts
var Runtime = class {
  constructor(myId) {
    this.myId = myId;
    api.net.on("send:AIMING", (message, editFn) => {
      if (!this.messageSendingAmount) return;
      if (this.ignoreNextAngle) {
        this.ignoreNextAngle = false;
        return;
      }
      this.pendingAngle = message.angle;
      editFn(null);
    });
  }
  pendingAngle = 0;
  ignoreNextAngle = false;
  angleChangeRes = null;
  messageStates = /* @__PURE__ */ new Map();
  messageSendingAmount = 0;
  angleQueue = [];
  sendingAngle = false;
  callbacks = /* @__PURE__ */ new Map();
  alternation = 0;
  // Make sure single-angle messages aren't dropped
  async sendBytes(bytes) {
    await this.sendAngle(bytesToFloat([...bytes, this.alternation]));
    this.alternation === 0 ? this.alternation = 1 : this.alternation = 0;
  }
  async sendAngle(angle) {
    if (this.sendingAngle) {
      return new Promise((res) => {
        this.angleQueue.push({
          angle,
          resolve: res
        });
      });
    }
    this.sendingAngle = true;
    this.angleQueue.unshift({ angle });
    while (this.angleQueue.length) {
      const pendingAngle = this.angleQueue.shift();
      this.ignoreNextAngle = true;
      api.net.send("AIMING", { angle: pendingAngle.angle });
      await new Promise((res) => this.angleChangeRes = res);
      this.ignoreNextAngle = false;
      pendingAngle.resolve?.();
    }
    this.sendingAngle = false;
  }
  async sendRealAngle() {
    if (!this.pendingAngle) return;
    await this.sendAngle(this.pendingAngle);
  }
  handleAngle(char, angle) {
    if (!angle) return;
    if (char.id === this.myId) return this.angleChangeRes?.();
    const bytes = floatToBytes(angle);
    const identifierBytes = bytes.slice(0, 4);
    const identifierString = identifierBytes.join(",");
    const callbacksForIdentifier = this.callbacks.get(identifierString);
    const state = this.messageStates.get(char);
    if (callbacksForIdentifier) {
      const op = bytes[4];
      if (op === 0 /* TransmittingBoolean */) {
        callbacksForIdentifier.forEach((callback) => {
          callback(bytes[5] === 1, char);
        });
      } else if (op === 1 /* TransmittingByteInteger */) {
        callbacksForIdentifier.forEach((callback) => {
          callback(bytes[5], char);
        });
      } else {
        const high = bytes[5];
        const low = bytes[6];
        this.messageStates.set(char, {
          message: "",
          charsRemaining: Math.min(1e3, (high << 8) + low),
          identifierString,
          op
        });
      }
    } else if (state) {
      for (let i = 0; i < Math.min(7, state.charsRemaining); i++) {
        state.message += String.fromCharCode(bytes[i]);
      }
      state.charsRemaining -= 7;
      if (state.charsRemaining <= 0) {
        const stateCallbacks = this.callbacks.get(state.identifierString);
        if (!stateCallbacks) return;
        let message;
        switch (state.op) {
          case 3 /* TransmittingNumber */:
            message = Number(state.message);
            break;
          case 4 /* TransmittingObject */:
            message = JSON.parse(state.message);
            break;
          case 2 /* TransmittingString */:
            message = state.message;
            break;
        }
        stateCallbacks.forEach((callback) => callback(message, char));
      }
    }
  }
  async sendMessages(messages) {
    this.messageSendingAmount++;
    await Promise.all([
      ...messages.map((message) => this.sendAngle(message)),
      this.sendRealAngle()
    ]);
    this.messageSendingAmount--;
  }
};

// libraries/Communication/src/index.ts
var runtime;
var onEnabledCallbacks = /* @__PURE__ */ new Map();
var onDisabledCallbacks = /* @__PURE__ */ new Map();
api.net.onLoad(() => {
  runtime = new Runtime(api.stores.network.authId);
  api.onStop(api.net.room.state.session.listen("phase", (phase) => {
    if (phase === "game") {
      for (const callbacks of onEnabledCallbacks.values()) {
        callbacks.forEach((cb) => cb());
      }
    } else {
      for (const callbacks of onDisabledCallbacks.values()) {
        callbacks.forEach((cb) => cb());
      }
    }
  }, false));
  api.onStop(api.net.room.state.characters.onAdd((char) => {
    api.onStop(
      char.projectiles.listen("aimAngle", (angle) => {
        runtime.handleAngle(char, angle);
      })
    );
  }));
});
var Communication = class _Communication {
  identifier;
  identifierString;
  constructor(name) {
    this.identifier = getIdentifier(name);
    this.identifierString = this.identifier.join(",");
  }
  get scriptCallbacks() {
    return runtime.callbacks.get(this.identifierString);
  }
  static get enabled() {
    return api.net.room?.state.session.phase === "game";
  }
  get onEnabledCallbacks() {
    if (!onEnabledCallbacks.has(this.identifierString)) {
      onEnabledCallbacks.set(this.identifierString, []);
    }
    return onEnabledCallbacks.get(this.identifierString);
  }
  get onDisabledCallbacks() {
    if (!onDisabledCallbacks.has(this.identifierString)) {
      onDisabledCallbacks.set(this.identifierString, []);
    }
    return onDisabledCallbacks.get(this.identifierString);
  }
  onEnabled(callback, immediate = true) {
    if (_Communication.enabled && immediate) callback(true);
    const listenerCallback = () => callback(false);
    this.onEnabledCallbacks.push(listenerCallback);
    return () => {
      onEnabledCallbacks.set(
        this.identifierString,
        this.onEnabledCallbacks.filter((cb) => cb !== listenerCallback)
      );
    };
  }
  onDisabled(callback, immediate = true) {
    if (!_Communication.enabled && immediate) callback(true);
    const listenerCallback = () => callback(false);
    this.onDisabledCallbacks.push(listenerCallback);
    return () => {
      onDisabledCallbacks.set(
        this.identifierString,
        this.onDisabledCallbacks.filter((cb) => cb !== listenerCallback)
      );
    };
  }
  async send(message) {
    if (!_Communication.enabled) {
      throw new Error("Communication can only be used after the game is started");
    }
    switch (typeof message) {
      case "number": {
        if (isUint8(message)) {
          await runtime.sendBytes([
            ...this.identifier,
            1 /* TransmittingByteInteger */,
            message
          ]);
        } else {
          const messages = encodeStringMessage(this.identifier, 3 /* TransmittingNumber */, String(message));
          await runtime.sendMessages(messages);
        }
        break;
      }
      case "string": {
        const messages = encodeStringMessage(this.identifier, 2 /* TransmittingString */, message);
        if (messages) await runtime.sendMessages(messages);
        break;
      }
      case "boolean": {
        await runtime.sendBytes([
          ...this.identifier,
          0 /* TransmittingBoolean */,
          message ? 1 : 0
        ]);
        break;
      }
      case "object": {
        const messages = encodeStringMessage(this.identifier, 4 /* TransmittingObject */, JSON.stringify(message));
        await runtime.sendMessages(messages);
      }
    }
  }
  onMessage(callback) {
    if (!this.scriptCallbacks) {
      runtime.callbacks.set(this.identifierString, []);
    }
    this.scriptCallbacks.push(callback);
    return () => {
      runtime.callbacks.set(this.identifierString, this.scriptCallbacks.filter((cb) => cb !== callback));
    };
  }
  destroy() {
    runtime.callbacks.delete(this.identifierString);
    onEnabledCallbacks.delete(this.identifierString);
    onDisabledCallbacks.delete(this.identifierString);
  }
};
export {
  Communication as default
};
