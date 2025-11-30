/**
 * @name InfoLines
 * @description Displays a configurable list of info on the screen
 * @author TheLazySquid
 * @version 1.0.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InfoLines.js
 * @webpage https://gimloader.github.io/plugins/infolines
 * @hasSettings true
 * @gamemode 2d
 * @changelog Switched to native Gimloader settings. Your old settings have been reset!
 * @changelog Fixed ping not hiding when disabled
 * @changelog Made FPS more accurate
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "node_modules/eventemitter3/index.js"(exports, module) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter2;
    }
  }
});

// plugins/InfoLines/src/styles.scss
var styles_default = `#infoLines {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 4px;
  z-index: 99999999;
  border-radius: 5px;
}
#infoLines.top {
  top: 4px;
}
#infoLines.bottom {
  bottom: 4px;
}
#infoLines.left {
  left: 4px;
}
#infoLines.right {
  right: 4px;
}`;

// node_modules/eventemitter3/index.mjs
var import_index = __toESM(require_eventemitter3(), 1);
var eventemitter3_default = import_index.default;

// plugins/InfoLines/src/baseLine.ts
var BaseLine = class extends eventemitter3_default {
  settings;
  net = {
    on: (...args) => {
      this.on("stop", () => {
        api.net.off(args[0], args[1]);
      });
      return api.net.on(...args);
    }
  };
  patcher = {
    before: (...args) => {
      this.on("stop", api.patcher.before(...args));
    },
    after: (...args) => {
      this.on("stop", api.patcher.after(...args));
    }
  };
  constructor() {
    super();
    api.net.onLoad(() => {
      const { worldManager } = api.stores.phaser.scene;
      this.patcher.after(worldManager, "update", () => this.emit("frame"));
      this.patcher.after(worldManager.physics, "physicsStep", () => this.emit("physicsTick"));
    });
  }
  update(value) {
    this.emit("update", value);
  }
  disable() {
    this.emit("stop");
    this.removeAllListeners("frame");
    this.removeAllListeners("physicsTick");
  }
};

// plugins/InfoLines/src/lines/visualCoordinates.ts
var VisualCoordinates = class extends BaseLine {
  name = "Visual Coordinates";
  enabledDefault = true;
  settings = [{
    type: "slider",
    id: "visualCoordsDecimalPlaces",
    title: "Visual coordinates decimal places",
    min: 0,
    max: 10,
    step: 1,
    default: 2
  }];
  init() {
    this.on("frame", () => {
      const { body } = api.stores.phaser.mainCharacter;
      const decimals = api.settings.visualCoordsDecimalPlaces;
      this.update(`visual x: ${body.x.toFixed(decimals)}, y: ${body.y.toFixed(decimals)}`);
    });
  }
};

// plugins/InfoLines/src/lines/fps.ts
var FPS = class extends BaseLine {
  name = "FPS";
  enabledDefault = true;
  init() {
    const { loop } = api.stores.phaser.scene.game;
    const updateFps = () => {
      this.update(`${Math.round(loop.actualFps)} fps`);
    };
    updateFps();
    this.patcher.after(loop, "updateFPS", updateFps);
  }
};

// plugins/InfoLines/src/lines/physicsCoordinates.ts
var PhysicsCoordinates = class extends BaseLine {
  name = "Physics Coordinates";
  enabledDefault = false;
  settings = [{
    type: "slider",
    id: "physicsCoordsDecimalPlaces",
    title: "Physics coordinates decimal places",
    min: 0,
    max: 10,
    step: 1,
    default: 2
  }];
  init() {
    const { physics } = api.stores.phaser.mainCharacter;
    const rb = physics.getBody().rigidBody;
    this.on("physicsTick", () => {
      const translation = rb?.translation();
      if (!translation) return;
      const decimals = api.settings.physicsCoordsDecimalPlaces;
      this.update(`physics x: ${translation.x.toFixed(decimals)}, y: ${translation.y.toFixed(decimals)}`);
    });
  }
};

// plugins/InfoLines/src/lines/velocity.ts
var Velocity = class extends BaseLine {
  name = "Velocity";
  enabledDefault = true;
  settings = [{
    type: "slider",
    id: "velocityDecimalPlaces",
    title: "Velocity decimal places",
    min: 0,
    max: 10,
    step: 1,
    default: 2
  }];
  init() {
    const { physics } = api.stores.phaser.mainCharacter;
    const rb = physics.getBody().rigidBody;
    this.on("physicsTick", () => {
      const velocity = rb?.linvel();
      if (!velocity) return;
      const decimals = api.settings.velocityDecimalPlaces;
      this.update(`velocity x: ${velocity.x.toFixed(decimals)}, y: ${velocity.y.toFixed(decimals)}`);
    });
  }
};

// plugins/InfoLines/src/lines/ping.ts
var Ping = class extends BaseLine {
  name = "Ping";
  enabledDefault = true;
  init() {
    this.update("calculating ping...");
    let pongDelivered = false;
    let deviceChangeRes = null;
    this.net.on("DEVICES_STATES_CHANGES", (value, editFn) => {
      if (!value.initial) return;
      deviceChangeRes?.();
      editFn(null);
      pongDelivered = true;
    });
    this.net.on("TERRAIN_CHANGES", (_, editFn) => {
      if (!pongDelivered) return;
      editFn(null);
    });
    this.net.on("WORLD_CHANGES", (_, editFn) => {
      if (!pongDelivered) return;
      pongDelivered = false;
      editFn(null);
    });
    const interval = setInterval(async () => {
      api.net.send("REQUEST_INITIAL_WORLD", void 0);
      const start = Date.now();
      await new Promise((res) => deviceChangeRes = res);
      this.update(`ping: ${Date.now() - start} ms`);
    }, 5e3);
    this.on("stop", () => clearInterval(interval));
  }
};

// plugins/InfoLines/src/index.ts
api.UI.addStyles(styles_default);
var InfoLines = class {
  lines = [
    new VisualCoordinates(),
    new Velocity(),
    new PhysicsCoordinates(),
    new FPS(),
    new Ping()
  ];
  element;
  constructor() {
    api.settings.create([
      {
        type: "dropdown",
        id: "position",
        title: "Position",
        options: [
          { label: "Top Left", value: "top left" },
          { label: "Top Right", value: "top right" },
          { label: "Bottom Left", value: "bottom left" },
          { label: "Bottom Right", value: "bottom right" }
        ],
        default: "top right"
      },
      ...this.lines.map((line) => ({
        type: "group",
        title: line.name,
        settings: [
          {
            type: "toggle",
            id: line.name,
            title: line.name,
            default: line.enabledDefault,
            onChange(value) {
              value ? line.init() : line.disable();
            }
          },
          ...line.settings ?? []
        ]
      }))
    ]);
    api.net.onLoad(() => {
      this.create();
    });
  }
  create() {
    this.element = document.createElement("div");
    this.element.id = "infoLines";
    this.element.className = api.settings.position;
    api.settings.listen("position", (value) => this.element.className = value);
    for (const line of this.lines) {
      const lineElement = document.createElement("div");
      lineElement.classList.add("line");
      this.element.appendChild(lineElement);
      line.on("update", (value) => {
        lineElement.innerText = value;
      });
      line.on("stop", () => {
        lineElement.innerText = "";
      });
      api.net.onLoad(() => {
        if (api.settings[line.name]) line.init();
      });
    }
    document.body.appendChild(this.element);
  }
  destroy() {
    for (const line of this.lines) {
      line.disable();
    }
    this.element?.remove();
  }
};
var infoLines = new InfoLines();
api.onStop(() => infoLines.destroy());
export {
  InfoLines
};
