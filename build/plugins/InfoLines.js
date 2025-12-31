/**
 * @name InfoLines
 * @description Displays a configurable list of info on the screen
 * @author TheLazySquid
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InfoLines.js
 * @webpage https://gimloader.github.io/plugins/infolines
 * @hasSettings true
 * @gamemode 2d
 */

// plugins/InfoLines/src/baseLine.ts
var frameCallbacks = [];
var physicsTickCallbacks = [];
api.net.onLoad(() => {
  const worldManager = api.stores.phaser.scene.worldManager;
  api.patcher.after(worldManager, "update", () => {
    for (const callback of frameCallbacks) {
      callback();
    }
  });
  api.patcher.after(worldManager.physics, "physicsStep", () => {
    for (const callback of physicsTickCallbacks) {
      callback();
    }
  });
});
var BaseLine = class {
  enabled = false;
  settings;
  subscribedCallbacks = [];
  constructor() {
    setTimeout(() => {
      this.enabled = api.storage.getValue(this.name, this.enabledDefault);
      this.setupSettings();
      if (this.onFrame) {
        frameCallbacks.push(() => {
          if (!this.enabled) return;
          this.onFrame?.();
        });
      }
      if (this.onPhysicsTick) {
        physicsTickCallbacks.push(() => {
          if (!this.enabled) return;
          this.onPhysicsTick?.();
        });
      }
      api.net.onLoad(() => {
        if (this.init) this.init();
      });
    }, 0);
  }
  setupSettings() {
    if (this.settings) {
      for (const id in this.settings) {
        const setting = this.settings[id];
        setting.value = api.storage.getValue(id, setting.default);
      }
    }
  }
  subscribe(callback) {
    this.subscribedCallbacks.push(callback);
  }
  update(value) {
    for (const callback of this.subscribedCallbacks) {
      callback(value);
    }
  }
  enable() {
  }
  disable() {
    this.update("");
  }
};

// plugins/InfoLines/src/lines/visualCoordinates.ts
var VisualCoordinates = class extends BaseLine {
  enabledDefault = true;
  name = "Visual Coordinates";
  settings = {
    "visualCoordsDecimalPlaces": {
      label: "Visual coordinates decimal places",
      min: 0,
      max: 10,
      default: 0
    }
  };
  onFrame() {
    const body = api.stores.phaser.mainCharacter.body;
    const decimals = this.settings.visualCoordsDecimalPlaces.value;
    this.update(`visual x: ${body.x.toFixed(decimals)}, y: ${body.y.toFixed(decimals)}`);
  }
};

// plugins/InfoLines/src/Settings.tsx
function Settings({ infoLines: infoLines2 }) {
  const React = api.React;
  const [lines, setLines] = React.useState(infoLines2.lines);
  const [position, setPosition] = React.useState(infoLines2.position);
  return /* @__PURE__ */ GL.React.createElement("div", { id: "il-settings" }, /* @__PURE__ */ GL.React.createElement("div", { className: "position" }, "Position", /* @__PURE__ */ GL.React.createElement(
    "select",
    {
      value: position,
      onChange: (e) => {
        setPosition(e.target.value);
        api.storage.setValue("position", e.target.value);
        if (infoLines2.element) infoLines2.element.className = e.target.value;
      }
    },
    /* @__PURE__ */ GL.React.createElement("option", { value: "top left" }, "Top Left"),
    /* @__PURE__ */ GL.React.createElement("option", { value: "top right" }, "Top Right"),
    /* @__PURE__ */ GL.React.createElement("option", { value: "bottom left" }, "Bottom Left"),
    /* @__PURE__ */ GL.React.createElement("option", { value: "bottom right" }, "Bottom Right")
  )), /* @__PURE__ */ GL.React.createElement("hr", null), lines.map((line) => /* @__PURE__ */ GL.React.createElement("div", null, /* @__PURE__ */ GL.React.createElement("div", null, /* @__PURE__ */ GL.React.createElement(
    "input",
    {
      type: "checkbox",
      checked: line.enabled,
      onChange: (e) => {
        line.enabled = e.target.checked;
        api.storage.setValue(line.name, line.enabled);
        if (line.enabled) line.enable();
        else line.disable();
        setLines([...lines]);
      }
    }
  ), line.name), line.settings && Object.entries(line.settings).map(([id, setting]) => /* @__PURE__ */ GL.React.createElement("div", { className: "setting" }, setting.label, /* @__PURE__ */ GL.React.createElement(
    "input",
    {
      type: "range",
      min: setting.min,
      step: 1,
      max: setting.max,
      value: setting.value,
      onChange: (e) => {
        setting.value = parseInt(e.target.value, 10);
        api.storage.setValue(id, setting.value);
        if (line.enabled) line.onSettingsChange?.();
        setLines([...lines]);
      }
    }
  ), setting.value)), /* @__PURE__ */ GL.React.createElement("hr", null))));
}

// plugins/InfoLines/src/lines/fps.ts
var FPS = class extends BaseLine {
  name = "FPS";
  enabledDefault = true;
  lastTime = 0;
  frames = 0;
  onFrame() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.frames++;
    if (delta > 1e3) {
      this.lastTime = now;
      const fps = this.frames / (delta / 1e3);
      this.update(`${Math.round(fps)} fps`);
      this.frames = 0;
    }
  }
};

// plugins/InfoLines/src/lines/physicsCoordinates.ts
var PhysicsCoordinates = class extends BaseLine {
  name = "Physics Coordinates";
  enabledDefault = false;
  settings = {
    "physicsCoordsDecimalPlaces": {
      label: "Physics coordinates decimal places",
      min: 0,
      max: 10,
      default: 2
    }
  };
  rb;
  init() {
    const physics = api.stores.phaser.mainCharacter.physics;
    this.rb = physics.getBody().rigidBody;
  }
  onPhysicsTick() {
    const translation = this.rb?.translation();
    if (!translation) return;
    const decimals = this.settings.physicsCoordsDecimalPlaces.value;
    this.update(`physics x: ${translation.x.toFixed(decimals)}, y: ${translation.y.toFixed(decimals)}`);
  }
};

// plugins/InfoLines/src/lines/velocity.ts
var Velocity = class extends BaseLine {
  enabledDefault = true;
  name = "Velocity";
  settings = {
    "velocityDecimalPlaces": {
      label: "Velocity decimal places",
      min: 0,
      max: 10,
      default: 2
    }
  };
  rb;
  init() {
    const physics = api.stores.phaser.mainCharacter.physics;
    this.rb = physics.getBody().rigidBody;
  }
  onPhysicsTick() {
    const velocity = this.rb?.linvel();
    if (!velocity) return;
    const decimals = this.settings.velocityDecimalPlaces.value;
    this.update(`velocity x: ${velocity.x.toFixed(decimals)}, y: ${velocity.y.toFixed(decimals)}`);
  }
};

// plugins/InfoLines/src/lines/ping.ts
var Ping = class extends BaseLine {
  name = "Ping";
  enabledDefault = true;
  deviceChangeRes = null;
  init() {
    let pongDelivered = false;
    const onDeviceStateChanges = (value, editFn) => {
      if (!value.initial) return;
      this.deviceChangeRes?.();
      editFn(null);
      pongDelivered = true;
    };
    const onTerrainChanges = (_, editFn) => {
      if (!pongDelivered) return;
      editFn(null);
    };
    const onWorldChanges = (_, editFn) => {
      if (!pongDelivered) return;
      pongDelivered = false;
      editFn(null);
    };
    api.net.on("DEVICES_STATES_CHANGES", onDeviceStateChanges);
    api.net.on("TERRAIN_CHANGES", onTerrainChanges);
    api.net.on("WORLD_CHANGES", onWorldChanges);
    const interval = setInterval(async () => {
      api.net.send("REQUEST_INITIAL_WORLD", void 0);
      const start = Date.now();
      await new Promise((res) => this.deviceChangeRes = res);
      this.update(`ping: ${Date.now() - start} ms`);
    }, 5e3);
    this.disable = () => {
      api.net.off("DEVICES_STATES_CHANGES", onDeviceStateChanges);
      api.net.off("TERRAIN_CHANGES", onTerrainChanges);
      api.net.off("WORLD_CHANGES", onWorldChanges);
      clearInterval(interval);
    };
  }
};

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
}

#il-settings .setting, #il-settings .position {
  display: flex;
  align-items: center;
  gap: 5px;
}
#il-settings .setting input {
  flex-grow: 1;
}`;

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
  position = api.storage.getValue("position", "top right");
  constructor() {
    api.net.onLoad(() => {
      this.create();
    });
  }
  create() {
    this.element = document.createElement("div");
    this.element.id = "infoLines";
    this.element.className = this.position;
    for (const line of this.lines) {
      const lineElement = document.createElement("div");
      lineElement.classList.add("line");
      this.element.appendChild(lineElement);
      line.subscribe((value) => {
        lineElement.innerText = value;
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
api.openSettingsMenu(() => {
  api.UI.showModal(api.React.createElement(Settings, { infoLines }), {
    title: "InfoLines settings",
    id: "infoLinesSettings",
    buttons: [{ text: "Close", "style": "close" }]
  });
});
export {
  InfoLines
};
