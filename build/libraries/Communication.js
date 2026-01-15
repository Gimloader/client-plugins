/**
 * @name Communication
 * @description Communication between different clients in 2D gamemodes
 * @author retrozy
 * @version 0.3.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js
 * @gamemode 2d
 * @changelog Fixed strings sent at a specific length never resolving
 * @isLibrary true
 */

// libraries/Communication/src/encoding.ts
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

// libraries/Communication/src/core.ts
var Runtime = class {
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
  static async sendBoolean(identifier, value) {
    await this.sendHeader(identifier, 0 /* Boolean */, value ? 1 : 0);
  }
  static async sendPositiveInt24(identifier, value) {
    const bytes = splitUint24(value);
    await this.sendHeader(identifier, 1 /* PositiveInt24 */, ...bytes);
  }
  static async sendNegativeInt24(identifier, value) {
    const bytes = splitUint24(-value);
    await this.sendHeader(identifier, 2 /* NegativeInt24 */, ...bytes);
  }
  static async sendNumber(identifier, value) {
    const bytes = floatToBytes(value);
    await Promise.all([
      this.sendHeader(identifier, 3 /* Float */, ...bytes.slice(0, 3)),
      this.sendBytes(bytes.slice(3, 8))
    ]);
  }
  static async sendThreeCharacters(identifier, string) {
    const codes = encodeCharacters(string);
    await this.sendHeader(identifier, 4 /* ThreeCharacters */, ...codes);
  }
  static async sendStringOfType(identifier, string, type) {
    const codes = encodeCharacters(string);
    const messages = [];
    for (let i = 3; i < codes.length; i += 7) {
      const msg = [];
      for (let j = 0; j < 7; j++) {
        if (i + j >= codes.length) break;
        msg[j] = codes[i + j];
      }
      messages.push(msg);
    }
    await Promise.all([
      this.sendHeader(identifier, type, ...codes.slice(0, 3)),
      ...messages.map(
        (msg, i) => this.sendBytes(
          msg,
          i === messages.length - 1 ? 2 : void 0
        )
      )
    ]);
  }
  static async sendString(identifier, string) {
    await this.sendStringOfType(identifier, string, 5 /* String */);
  }
  static async sendObject(identifier, obj) {
    const string = JSON.stringify(obj);
    await this.sendStringOfType(identifier, string, 6 /* Object */);
  }
  // Maxmium of 3 free bytes
  static async sendHeader(identifier, type, ...free) {
    const header = [...identifier, ...free];
    header[7] = type;
    this.alternate = !this.alternate;
    if (this.alternate) header[7] |= 128;
    await this.sendAngle(bytesToFloat(header));
  }
  // Maxmium of 7 bytes
  static async sendBytes(bytes, overrideLast) {
    if (overrideLast) {
      bytes[7] = overrideLast;
    } else {
      this.alternate = !this.alternate;
      if (this.alternate) bytes[7] = 1;
    }
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
    const identifierBytes = bytes.slice(0, 4);
    const identifierString = identifierBytes.join(",");
    const callbacksForIdentifier = this.callbacks.get(identifierString);
    const state = this.messageStates.get(char);
    if (state) {
      const callbacksForIdentifier2 = this.callbacks.get(state.identifierString);
      if (!callbacksForIdentifier2) return;
      const gotValue = (value) => {
        this.messageStates.delete(char);
        callbacksForIdentifier2.forEach((callback) => {
          callback(value, char);
        });
      };
      if (state.type === 3 /* Float */) {
        const numberBytes = [...state.recieved, ...bytes.slice(0, 5)];
        return gotValue(bytesToFloat(numberBytes));
      }
      state.recieved.push(...bytes.slice(0, 7).filter((byte) => byte !== 0));
      if (bytes[7] !== 2) return;
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
    } else if (callbacksForIdentifier) {
      const type = bytes[7] & 127;
      const gotValue = (value) => {
        callbacksForIdentifier.forEach((callback) => {
          callback(value, char);
        });
      };
      if (type === 0 /* Boolean */) {
        gotValue(bytes[4] === 1);
      } else if (type === 1 /* PositiveInt24 */) {
        gotValue(joinUint24(bytes[4], bytes[5], bytes[6]));
      } else if (type === 2 /* NegativeInt24 */) {
        gotValue(-joinUint24(bytes[4], bytes[5], bytes[6]));
      } else if (type === 3 /* Float */) {
        this.messageStates.set(char, {
          type: 3 /* Float */,
          identifierString,
          recieved: bytes.slice(4, 7)
        });
      } else if (type === 4 /* ThreeCharacters */) {
        const codes = bytes.slice(4, 7).filter((b) => b !== 0);
        gotValue(String.fromCharCode(...codes));
      } else if (type === 5 /* String */ || type === 6 /* Object */) {
        this.messageStates.set(char, {
          type,
          identifierString,
          recieved: bytes.slice(4, 7)
        });
      }
    }
  }
};

// libraries/Communication/src/index.ts
api.net.onLoad(() => {
  Runtime.init();
  api.onStop(api.net.room.state.characters.onAdd((char) => {
    api.onStop(
      char.projectiles.listen("aimAngle", (angle) => {
        Runtime.handleAngle(char, angle);
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
    if (!Runtime.callbacks.has(this.#identifierString)) {
      Runtime.callbacks.set(this.#identifierString, []);
    }
    return Runtime.callbacks.get(this.#identifierString);
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
    if (api.net.room.state.characters.size <= 1) return;
    switch (typeof message) {
      case "number": {
        if (isUint24(message)) {
          return await Runtime.sendPositiveInt24(this.#identifier, message);
        } else if (isUint24(-message)) {
          return await Runtime.sendNegativeInt24(this.#identifier, message);
        } else {
          return await Runtime.sendNumber(this.#identifier, message);
        }
      }
      case "string": {
        if (message.length <= 3) {
          return await Runtime.sendThreeCharacters(this.#identifier, message);
        } else {
          return await Runtime.sendString(this.#identifier, message);
        }
      }
      case "boolean": {
        return await Runtime.sendBoolean(this.#identifier, message);
      }
      case "object": {
        return await Runtime.sendObject(this.#identifier, message);
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
    Runtime.callbacks.delete(this.#identifierString);
    this.#onDisabledCallbacks.forEach((cb) => cb());
  }
};
export {
  Communication as default
};
