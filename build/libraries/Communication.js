/**
 * @name Communication
 * @description Communication between different clients in 2D gamemodes
 * @author retrozy
 * @version 0.4.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js
 * @webpage https://gimloader.github.io/libraries/communication
 * @gamemode 2d
 * @changelog Allowed arrays of only bytes to be sent optimally
 * @changelog Disregarded sentries when ignoring sending messages
 * @changelog Added webpage link
 * @isLibrary true
 */

// libraries/Communication/src/encoding.ts
var isUint8 = (n) => Number.isInteger(n) && n >= 0 && n <= 255;
var isUint24 = (n) => Number.isInteger(n) && n >= 0 && n <= 16777215;
var splitUint24 = (int) => [
  int >> 16 & 255,
  int >> 8 & 255,
  int & 255
];
var joinUint24 = (int1, int2, int3) => int1 << 16 | int2 << 8 | int3;
function bytesToFloat(bytes) {
  const buffer = new ArrayBuffer(8);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < 8; i++) {
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
function encodeCharacters(characters) {
  return characters.split("").map((c) => c.charCodeAt(0)).filter((c) => c < 256 && c > 0);
}

// libraries/Communication/src/messenger.ts
var Messenger = class _Messenger {
  constructor(identifier) {
    this.identifier = identifier;
  }
  static pendingAngle = 0;
  static angleChangeRes = null;
  static angleChangeRej = null;
  static messageStates = /* @__PURE__ */ new Map();
  static angleQueue = [];
  static callbacks = /* @__PURE__ */ new Map();
  static alternate = false;
  static ignoreNextAngle = false;
  static init() {
    api.net.on("send:AIMING", (message, editFn) => {
      if (this.ignoreNextAngle) {
        this.ignoreNextAngle = false;
        return;
      }
      this.pendingAngle = message.angle;
      if (this.angleQueue.length > 0) editFn(null);
    });
    api.net.room.state.session.listen("phase", (phase) => {
      if (phase === "game") return;
      this.angleQueue.forEach((pending) => pending.reject());
      this.angleQueue.length = 0;
      this.angleChangeRej?.();
      this.messageStates.clear();
    }, false);
  }
  async sendBoolean(value) {
    await this.sendHeader(0 /* Boolean */, value ? 1 : 0);
  }
  async sendPositiveInt24(value) {
    const bytes = splitUint24(value);
    await this.sendHeader(1 /* PositiveInt24 */, ...bytes);
  }
  async sendNegativeInt24(value) {
    const bytes = splitUint24(-value);
    await this.sendHeader(2 /* NegativeInt24 */, ...bytes);
  }
  async sendNumber(value) {
    const bytes = floatToBytes(value);
    await this.sendSpreadBytes(3 /* Float */, bytes);
  }
  async sendByte(byte) {
    await this.sendHeader(7 /* Byte */, byte);
  }
  async sendTwoBytes(bytes) {
    await this.sendHeader(8 /* TwoBytes */, ...bytes);
  }
  async sendThreeBytes(bytes) {
    await this.sendHeader(9 /* ThreeBytes */, ...bytes);
  }
  async sendSeveralBytes(bytes) {
    await this.sendSpreadBytes(10 /* SeveralBytes */, bytes);
  }
  async sendThreeCharacters(string) {
    const codes = encodeCharacters(string);
    await this.sendHeader(4 /* ThreeCharacters */, ...codes);
  }
  async sendString(string) {
    await this.sendStringOfType(string, 5 /* String */);
  }
  async sendObject(obj) {
    const string = JSON.stringify(obj);
    await this.sendStringOfType(string, 6 /* Object */);
  }
  async sendStringOfType(string, type) {
    const codes = encodeCharacters(string);
    await this.sendSpreadBytes(type, codes);
  }
  async sendSpreadBytes(type, bytes) {
    const messages = [];
    for (let i = 3; i < bytes.length; i += 7) {
      messages.push(bytes.slice(i, i + 7));
    }
    const lastMessage = messages.at(-1);
    const lastIndex = lastMessage.length + 1;
    await Promise.all([
      this.sendHeader(type, ...bytes.slice(0, 3)),
      ...messages.slice(0, -1).map((msg) => _Messenger.sendAlternatedBytes(msg)),
      _Messenger.sendAlternatedBytes(lastMessage, lastIndex)
    ]);
  }
  // Maxmium of 3 free bytes
  async sendHeader(type, ...free) {
    const header = [...this.identifier, ...free];
    header[7] = type;
    _Messenger.alternate = !_Messenger.alternate;
    if (_Messenger.alternate) header[7] |= 128;
    await _Messenger.sendBytes(header);
  }
  // Maxmium of 7 bytes
  static async sendAlternatedBytes(bytes, overrideLast) {
    if (overrideLast) {
      bytes[7] = overrideLast;
    } else {
      this.alternate = !this.alternate;
      if (this.alternate) bytes[7] = 1;
    }
    await this.sendBytes(bytes);
  }
  static async sendBytes(bytes) {
    await this.sendAngle(bytesToFloat(bytes));
  }
  static async sendAngle(angle) {
    return new Promise((res, rej) => {
      this.angleQueue.push({
        angle,
        resolve: res,
        reject: rej
      });
      if (this.angleQueue.length > 1) return;
      this.processQueue();
    });
  }
  static async processQueue() {
    while (this.angleQueue.length > 0) {
      const queuedAngle = this.angleQueue[0];
      this.ignoreNextAngle = true;
      api.net.send("AIMING", { angle: queuedAngle.angle });
      try {
        await this.awaitAngleChange();
      } catch {
        break;
      }
      queuedAngle.resolve();
      this.angleQueue.shift();
    }
    if (!this.pendingAngle) return;
    api.net.send("AIMING", { angle: this.pendingAngle });
  }
  static async awaitAngleChange() {
    return new Promise((res, rej) => {
      this.angleChangeRes = res;
      this.angleChangeRej = rej;
    });
  }
  static handleAngle(char, angle) {
    if (!angle) return;
    if (char.id === api.stores.network.authId) return this.angleChangeRes?.();
    const bytes = floatToBytes(angle);
    const state = this.messageStates.get(char);
    if (state) {
      const callbacksForState = this.callbacks.get(state.identifierString);
      if (!callbacksForState) return;
      const payload = bytes.slice(0, 7);
      const flag = bytes[7];
      const gotValue = (value) => {
        this.messageStates.delete(char);
        callbacksForState.forEach((callback) => {
          callback(value, char);
        });
      };
      if (flag < 2) {
        state.recieved.push(...payload);
        return;
      }
      state.recieved.push(...payload.slice(0, flag - 1));
      if (state.type === 3 /* Float */) {
        return gotValue(bytesToFloat(state.recieved));
      } else if (state.type === 10 /* SeveralBytes */) {
        return gotValue(state.recieved);
      }
      const string = String.fromCharCode(...state.recieved);
      if (state.type === 5 /* String */) {
        gotValue(string);
      } else if (state.type === 6 /* Object */) {
        try {
          const obj = JSON.parse(string);
          gotValue(obj);
        } catch {
          this.messageStates.delete(char);
        }
      }
    } else {
      const identifierBytes = bytes.slice(0, 4);
      const payload = bytes.slice(4, 7);
      const type = bytes[7] & 127;
      const identifierString = identifierBytes.join(",");
      const callbacksForIdentifier = this.callbacks.get(identifierString);
      if (!callbacksForIdentifier) return;
      const gotValue = (value) => {
        callbacksForIdentifier.forEach((callback) => {
          callback(value, char);
        });
      };
      if (type === 0 /* Boolean */) {
        gotValue(payload[0] === 1);
      } else if (type === 1 /* PositiveInt24 */) {
        gotValue(joinUint24(...payload));
      } else if (type === 2 /* NegativeInt24 */) {
        gotValue(-joinUint24(...payload));
      } else if (type === 7 /* Byte */) {
        gotValue([payload[0]]);
      } else if (type === 8 /* TwoBytes */) {
        gotValue(payload.slice(0, 2));
      } else if (type === 9 /* ThreeBytes */) {
        gotValue(payload);
      } else if (type === 4 /* ThreeCharacters */) {
        const codes = payload.filter((b) => b !== 0);
        gotValue(String.fromCharCode(...codes));
      } else if (type === 5 /* String */ || type === 6 /* Object */ || type === 10 /* SeveralBytes */ || type === 3 /* Float */) {
        this.messageStates.set(char, {
          type,
          identifierString,
          recieved: payload
        });
      }
    }
  }
};

// libraries/Communication/src/index.ts
api.net.onLoad(() => {
  Messenger.init();
  api.onStop(api.net.room.state.characters.onAdd((char) => {
    api.onStop(
      char.projectiles.listen("aimAngle", (angle) => {
        Messenger.handleAngle(char, angle);
      })
    );
  }));
});
var Communication = class _Communication {
  #identifierString;
  #onDisabledCallbacks = [];
  #messenger;
  constructor(name) {
    const identifier = getIdentifier(name);
    this.#identifierString = identifier.join(",");
    this.#messenger = new Messenger(identifier);
  }
  get #onMessageCallbacks() {
    if (!Messenger.callbacks.has(this.#identifierString)) {
      Messenger.callbacks.set(this.#identifierString, []);
    }
    return Messenger.callbacks.get(this.#identifierString);
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
    const players = [...api.net.room.state.characters.values()].filter((char) => char.type === "player");
    if (players.length <= 1) return;
    switch (typeof message) {
      case "number": {
        if (isUint24(message)) {
          return await this.#messenger.sendPositiveInt24(message);
        } else if (isUint24(-message)) {
          return await this.#messenger.sendNegativeInt24(message);
        } else {
          return await this.#messenger.sendNumber(message);
        }
      }
      case "string": {
        if (message.length <= 3) {
          return await this.#messenger.sendThreeCharacters(message);
        } else {
          return await this.#messenger.sendString(message);
        }
      }
      case "boolean": {
        return await this.#messenger.sendBoolean(message);
      }
      case "object": {
        if (Array.isArray(message) && message.every((element) => typeof element === "number") && message.every(isUint8)) {
          if (message.length === 1) {
            return await this.#messenger.sendByte(message[0]);
          } else if (message.length === 2) {
            return await this.#messenger.sendTwoBytes(message);
          } else if (message.length === 3) {
            return await this.#messenger.sendThreeBytes(message);
          } else if (message.length > 3) {
            return await this.#messenger.sendSeveralBytes(message);
          }
        } else {
          return await this.#messenger.sendObject(message);
        }
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
    Messenger.callbacks.delete(this.#identifierString);
    this.#onDisabledCallbacks.forEach((cb) => cb());
  }
};
export {
  Communication as default
};
