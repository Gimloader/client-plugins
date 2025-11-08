/**
 * @name Communication
 * @description Communication between different clients in 2D gamemodes
 * @author retrozy
 * @version 0.0.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js
 * @gamemode 2d
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
      if (!this.sending) return;
      if (this.ignoreNextAngle) {
        this.ignoreNextAngle = false;
        return;
      }
      this.pendingAngle = message.angle;
      editFn(null);
    });
  }
  sending = false;
  pendingAngle = 0;
  ignoreNextAngle = false;
  angleChangeRes;
  messageStates = /* @__PURE__ */ new Map();
  callbacks = /* @__PURE__ */ new Map();
  handleAngle(char, angle) {
    if (!angle) return;
    if (char.id === this.myId) {
      this.angleChangeRes?.();
      return;
    }
    const bytes = floatToBytes(angle);
    const identifierBytes = bytes.slice(0, 4);
    const identifierString = JSON.stringify(identifierBytes);
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
  async sendAngle(angle) {
    api.net.send("AIMING", { angle });
    await new Promise((res) => this.angleChangeRes = res);
  }
  async sendMessages(messages) {
    this.sending = true;
    for (const message of messages) {
      this.ignoreNextAngle = true;
      await this.sendAngle(message);
    }
    this.sending = false;
    this.sendAngle(this.pendingAngle);
  }
};

// libraries/Communication/src/index.ts
var runtime;
api.net.onLoad(() => {
  runtime = new Runtime(api.stores.network.authId);
  api.onStop(api.net.room.state.characters.onAdd((char) => {
    const cleanupChar = char.projectiles.listen("aimAngle", (angle) => {
      runtime.handleAngle(char, angle);
    });
    api.onStop(cleanupChar);
    api.onStop(char.onRemove(cleanupChar));
  }));
});
var Communication = class {
  identifier;
  get identifierString() {
    return JSON.stringify(this.identifier);
  }
  get scriptCallbacks() {
    return runtime.callbacks.get(this.identifierString);
  }
  constructor(name) {
    this.identifier = getIdentifier(name);
  }
  async send(message) {
    if (api.net.room?.state.session.phase !== "game") {
      throw new Error("Communication can only be used after the game is started");
    }
    switch (typeof message) {
      case "number": {
        if (isUint8(message)) {
          const bytes = [
            ...this.identifier,
            1 /* TransmittingByteInteger */,
            message
          ];
          await runtime.sendMessages([bytesToFloat(bytes)]);
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
        const bytes = [
          ...this.identifier,
          0 /* TransmittingBoolean */,
          message ? 1 : 0
        ];
        await runtime.sendAngle(bytesToFloat(bytes));
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
};
export {
  Communication as default
};
