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

// plugins/InfoLines/src/baseLine.ts
var BaseLine = class {
  onStopCallbacks = [];
  onUpdateCallbacks = [];
  settings;
  net = {
    on: (...args) => {
      this.onStop(() => {
        api.net.off(args[0], args[1]);
      });
      return api.net.on(...args);
    }
  };
  patcher = {
    before: (...args) => {
      this.onStop(api.patcher.before(...args));
    },
    after: (...args) => {
      this.onStop(api.patcher.after(...args));
    }
  };
  enable() {
    api.net.onLoad(() => {
      if (this.onFrame) {
        this.patcher.after(api.stores.phaser.scene.worldManager, "update", () => this.onFrame?.());
      }
      if (this.onPhysicsTick) {
        this.patcher.after(api.stores.phaser.scene.worldManager.physics, "physicsStep", () => this.onPhysicsTick?.());
      }
      this.init?.();
    });
  }
  disable() {
    this.onStopCallbacks.forEach((cb) => cb());
  }
  onStop(cb) {
    this.onStopCallbacks.push(cb);
  }
  onUpdate(cb) {
    this.onUpdateCallbacks.push(cb);
  }
  update(value) {
    this.onUpdateCallbacks.forEach((cb) => cb(value));
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
  onFrame() {
    const { body } = api.stores.phaser.mainCharacter;
    const decimals = api.settings.visualCoordsDecimalPlaces;
    this.update(`visual x: ${body.x.toFixed(decimals)}, y: ${body.y.toFixed(decimals)}`);
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
  rb;
  init() {
    this.rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
  }
  onPhysicsTick() {
    const translation = this.rb?.translation();
    if (!translation) return;
    const decimals = api.settings.physicsCoordsDecimalPlaces;
    this.update(`physics x: ${translation.x.toFixed(decimals)}, y: ${translation.y.toFixed(decimals)}`);
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
  rb;
  init() {
    this.rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
  }
  onPhysicsTick() {
    const velocity = this.rb?.linvel();
    if (!velocity) return;
    const decimals = api.settings.velocityDecimalPlaces;
    this.update(`velocity x: ${velocity.x.toFixed(decimals)}, y: ${velocity.y.toFixed(decimals)}`);
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
      api.net.send("REQUEST_INITIAL_WORLD");
      const start = Date.now();
      await new Promise((res) => deviceChangeRes = res);
      this.update(`ping: ${Date.now() - start} ms`);
    }, 5e3);
    this.onStop(() => clearInterval(interval));
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
    const settings = [
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
      }
    ];
    for (const line of this.lines) {
      settings.push({
        type: "toggle",
        id: line.name,
        title: line.name,
        default: line.enabledDefault
      });
      if (line.settings) settings.push(...line.settings);
    }
    api.settings.create(settings);
    api.net.onLoad(() => {
      this.create();
    });
  }
  create() {
    this.element = document.createElement("div");
    this.element.id = "infoLines";
    api.settings.listen("position", (value) => this.element.className = value, true);
    for (const line of this.lines) {
      const lineElement = document.createElement("div");
      lineElement.classList.add("line");
      this.element.appendChild(lineElement);
      line.onUpdate((value) => lineElement.innerText = value);
      line.onStop(() => {
        lineElement.innerText = "";
      });
      api.settings.listen(line.name, (value) => value ? line.enable() : line.disable(), true);
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
