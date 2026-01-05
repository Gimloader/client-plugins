/**
 * @name Communication
 * @description Communication between different clients in 2D gamemodes
 * @author retrozy
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js
 * @gamemode 2d
 * @changelog Allowed unsigned 16-bit integers to be sent in a single message
 * @changelog Allowed strings with a length of 1-2 to be sent in a single message
 * @changelog Simplified onEnabled/onDisabled to only onEnabledChange
 * @isLibrary true
 */

// libraries/Communication/src/encoding.ts
var isUint16 = (n) => Number.isInteger(n) && n >= 0 && n <= 65535;
var splitUint16 = (int) => [
  int >> 8 & 255,
  int & 255
];
var getUint16 = (int1, int2) => int1 << 8 | int2;
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
var encodeCharacters = (characters) => characters.split("").map((c) => c.charCodeAt(0)).filter((c) => c < 256);
function encodeStringMessage(identifier, type, message) {
  const codes = encodeCharacters(message);
  const charsLow = codes.length & 255;
  const charsHigh = (codes.length & 65280) >> 8;
  const header = [...identifier, type, charsHigh, charsLow];
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
      if (this.sending) return;
      this.pendingAngle = message.angle;
      editFn(null);
    });
  }
  pendingAngle = 0;
  sending = false;
  angleChangeRes = null;
  messageStates = /* @__PURE__ */ new Map();
  messageSendingAmount = 0;
  angleQueue = [];
  callbacks = /* @__PURE__ */ new Map();
  altType = false;
  // Make sure messages with an Op are different from the last so they don't get dropped
  async sendBytes(bytes) {
    this.altType = !this.altType;
    if (this.altType) bytes[4] += 10;
    await this.sendAngle(bytesToFloat(bytes));
  }
  async sendAngle(angle) {
    if (this.sending) {
      return new Promise((res) => {
        this.angleQueue.push({
          angle,
          resolve: res
        });
      });
    }
    this.angleQueue.unshift({ angle });
    while (this.angleQueue.length) {
      const pendingAngle = this.angleQueue.shift();
      this.sending = true;
      api.net.send("AIMING", { angle: pendingAngle.angle });
      await new Promise((res) => this.angleChangeRes = res);
      this.sending = false;
      pendingAngle.resolve?.();
    }
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
      const type = bytes[4] >= 10 ? bytes[4] - 10 : bytes[4];
      if (type === 0 /* Boolean */) {
        callbacksForIdentifier.forEach((callback) => {
          callback(bytes[5] === 1, char);
        });
      } else if (type === 1 /* Uint16 */) {
        callbacksForIdentifier.forEach((callback) => {
          callback(getUint16(bytes[5], bytes[6]), char);
        });
      } else if (type === 3 /* TwoCharacters */) {
        callbacksForIdentifier.forEach((callback) => {
          callback(String.fromCharCode(bytes[5], bytes[6]), char);
        });
      } else {
        const high = bytes[5];
        const low = bytes[6];
        this.messageStates.set(char, {
          message: "",
          charsRemaining: Math.min(1e3, (high << 8) + low),
          identifierString,
          type
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
        switch (state.type) {
          case 2 /* Number */:
            message = Number(state.message);
            break;
          case 5 /* Object */:
            message = JSON.parse(state.message);
            break;
          case 4 /* String */:
            message = state.message;
            break;
        }
        stateCallbacks.forEach((callback) => callback(message, char));
      }
    }
  }
  async sendMessages(messages) {
    this.messageSendingAmount++;
    await Promise.all(messages.map((message) => this.sendAngle(message)));
    this.messageSendingAmount--;
    if (!this.messageSendingAmount) this.sendRealAngle();
  }
};

// libraries/Communication/src/index.ts
var runtime;
api.net.onLoad(() => {
  runtime = new Runtime(api.stores.network.authId);
  api.onStop(api.net.room.state.characters.onAdd((char) => {
    api.onStop(
      char.projectiles.listen("aimAngle", (angle) => {
        runtime.handleAngle(char, angle);
      })
    );
  }));
});
var Communication = class _Communication {
  #identifier;
  #identifierString;
  #onDisabledCallbacks = [];
  constructor(name) {
    this.#identifier = getIdentifier(name);
    this.#identifierString = this.#identifier.join(",");
  }
  get #onMessageCallbacks() {
    if (!runtime.callbacks.has(this.#identifierString)) {
      runtime.callbacks.set(this.#identifierString, []);
    }
    return runtime.callbacks.get(this.#identifierString);
  }
  static get enabled() {
    return api.net.room?.state.session.phase === "game";
  }
  onEnabledChanged(callback) {
    const unsub = api.net.room.state.session.listen("phase", () => callback(), false);
    this.#onDisabledCallbacks.push(unsub);
    return unsub;
  }
  async send(message) {
    if (!_Communication.enabled) {
      throw new Error("Communication can only be used after the game is started");
    }
    switch (typeof message) {
      case "number": {
        if (isUint16(message)) {
          return await runtime.sendBytes([
            ...this.#identifier,
            1 /* Uint16 */,
            ...splitUint16(message)
          ]);
        }
        const messages = encodeStringMessage(this.#identifier, 2 /* Number */, String(message));
        return await runtime.sendMessages(messages);
      }
      case "string": {
        if (message.length <= 2) {
          return await runtime.sendBytes([
            ...this.#identifier,
            3 /* TwoCharacters */,
            ...encodeCharacters(message)
          ]);
        }
        const messages = encodeStringMessage(this.#identifier, 4 /* String */, message);
        return await runtime.sendMessages(messages);
      }
      case "boolean": {
        return await runtime.sendBytes([
          ...this.#identifier,
          0 /* Boolean */,
          message ? 1 : 0
        ]);
      }
      case "object": {
        const messages = encodeStringMessage(this.#identifier, 5 /* Object */, JSON.stringify(message));
        return await runtime.sendMessages(messages);
      }
    }
  }
  onMessage(callback) {
    const cb = callback;
    this.#onMessageCallbacks.push(cb);
    return () => {
      const index = this.#onMessageCallbacks.indexOf(cb);
      if (index !== -1) this.#onMessageCallbacks.slice(index, 1);
    };
  }
  destroy() {
    runtime.callbacks.delete(this.#identifierString);
    this.#onDisabledCallbacks.forEach((cb) => cb());
  }
};
export {
  Communication as default
};
