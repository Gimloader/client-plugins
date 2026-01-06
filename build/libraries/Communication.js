/**
 * @name Communication
 * @description Communication between different clients in 2D gamemodes
 * @author retrozy
 * @version 0.2.3
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js
 * @gamemode 2d
 * @changelog Fixed real angle not being sent
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
var encodeCharacters = (characters) => characters.split("").map((c) => c.charCodeAt(0)).filter((c) => c < 256 && c > 0);

// libraries/Communication/src/core.ts
var Runtime = class {
  static pendingAngle = 0;
  static sending = false;
  static angleChangeRes = null;
  static messageStates = /* @__PURE__ */ new Map();
  static angleQueue = [];
  static callbacks = /* @__PURE__ */ new Map();
  static alternate = false;
  static myId = "";
  static ignoreNextAngle = false;
  static init(myId) {
    this.myId = myId;
    api.net.on("send:AIMING", (message, editFn) => {
      if (this.ignoreNextAngle) {
        this.ignoreNextAngle = false;
        return;
      }
      this.pendingAngle = message.angle;
      if (this.sending) editFn(null);
    });
  }
  static async sendBoolean(identifier, value) {
    await this.sendHeader(identifier, 0 /* Boolean */, value ? 1 : 0);
  }
  static async sendPositiveUint24(identifier, value) {
    const bytes = splitUint24(value);
    await this.sendHeader(identifier, 1 /* PositiveUint24 */, ...bytes);
  }
  static async sendNegativeUint24(identifier, value) {
    const bytes = splitUint24(-value);
    await this.sendHeader(identifier, 2 /* NegativeUint24 */, ...bytes);
  }
  static async sendNumber(identifier, value) {
    const bytes = floatToBytes(value);
    await this.sendHeader(identifier, 3 /* Float */, ...bytes.slice(0, 3));
    await this.sendBytes(bytes.slice(3, 8));
  }
  static async sendThreeCharacters(identifier, string) {
    const codes = encodeCharacters(string);
    await this.sendHeader(identifier, 4 /* ThreeCharacters */, ...codes);
  }
  static async #sendStringOfType(identifier, string, type) {
    const codes = encodeCharacters(string);
    codes.push(0);
    await this.sendHeader(identifier, type, ...codes.slice(0, 3));
    for (let i = 3; i < codes.length; i += 7) {
      const msg = [];
      for (let j = 0; j < 7; j++) {
        if (i + j >= codes.length) break;
        msg[j] = codes[i + j];
      }
      await this.sendBytes(msg);
    }
  }
  static async sendString(identifier, string) {
    await this.#sendStringOfType(identifier, string, 5 /* String */);
  }
  static async sendObject(identifier, obj) {
    const string = JSON.stringify(obj);
    await this.#sendStringOfType(identifier, string, 6 /* Object */);
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
  static async sendBytes(bytes) {
    this.alternate = !this.alternate;
    if (this.alternate) bytes[7] = 1;
    await this.sendAngle(bytesToFloat(bytes));
  }
  static async sendAngle(angle) {
    if (this.sending) {
      return new Promise((res) => {
        this.angleQueue.push({
          angle,
          resolve: res
        });
      });
    }
    this.angleQueue.unshift({ angle });
    this.sending = true;
    while (this.angleQueue.length) {
      const queuedAngle = this.angleQueue.shift();
      this.ignoreNextAngle = true;
      api.net.send("AIMING", { angle: queuedAngle.angle });
      await new Promise((res) => this.angleChangeRes = res);
      queuedAngle.resolve?.();
    }
    this.sending = false;
    console.log("Sending done, pending angle is", this.pendingAngle);
    if (!this.pendingAngle) return;
    api.net.send("AIMING", { angle: this.pendingAngle });
  }
  static handleAngle(char, angle) {
    if (!angle) return;
    if (char.id === this.myId) return this.angleChangeRes?.();
    const bytes = floatToBytes(angle);
    const identifierBytes = bytes.slice(0, 4);
    const identifierString = identifierBytes.join(",");
    const callbacksForIdentifier = this.callbacks.get(identifierString);
    const state = this.messageStates.get(char);
    if (callbacksForIdentifier) {
      const type = bytes[7] & 127;
      const gotValue = (value) => {
        callbacksForIdentifier.forEach((callback) => {
          callback(value, char);
        });
      };
      if (type === 0 /* Boolean */) {
        gotValue(bytes[4] === 1);
      } else if (type === 1 /* PositiveUint24 */) {
        gotValue(joinUint24(bytes[4], bytes[5], bytes[6]));
      } else if (type === 2 /* NegativeUint24 */) {
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
    } else if (state) {
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
      let ended = false;
      for (let i = 0; i < 7; i++) {
        const byte = bytes[i];
        if (byte === 0) {
          ended = true;
          break;
        }
        state.recieved.push(byte);
      }
      if (!ended) return;
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
    }
  }
};

// libraries/Communication/src/index.ts
api.net.onLoad(() => {
  Runtime.init(api.stores.network.authId);
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
    switch (typeof message) {
      case "number": {
        if (isUint24(message)) {
          return await Runtime.sendPositiveUint24(this.#identifier, message);
        } else if (isUint24(-message)) {
          return await Runtime.sendNegativeUint24(this.#identifier, message);
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
