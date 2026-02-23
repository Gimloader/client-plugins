/**
 * @name 2dMovementTAS
 * @description Allows for making TASes of CTF and tag
 * @author TheLazySquid
 * @version 0.4.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/2dMovementTAS.js
 * @webpage https://gimloader.github.io/plugins/2dMovementTAS
 * @reloadRequired ingame
 * @gamemode ctf
 * @gamemode tag
 * @changelog Updated webpage url
 */

// external-svelte:svelte
var mount = /* @__PURE__ */ (() => GL.svelte_5_43_0.Index.mount)();
var unmount = /* @__PURE__ */ (() => GL.svelte_5_43_0.Index.unmount)();
var untrack = /* @__PURE__ */ (() => GL.svelte_5_43_0.Index.untrack)();

// external-svelte:svelte/internal/client
var append = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.append)();
var append_styles = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.append_styles)();
var bind_checked = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.bind_checked)();
var bind_this = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.bind_this)();
var bind_value = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.bind_value)();
var child = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.child)();
var comment = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.comment)();
var delegate = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.delegate)();
var derived = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.derived)();
var each = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.each)();
var event = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.event)();
var first_child = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.first_child)();
var from_html = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.from_html)();
var get = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.get)();
var index = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.index)();
var next = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.next)();
var pop = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.pop)();
var prop = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.prop)();
var proxy = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.proxy)();
var push = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.push)();
var remove_input_defaults = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.remove_input_defaults)();
var reset = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.reset)();
var set = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set)();
var set_class = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set_class)();
var set_style = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set_style)();
var set_text = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set_text)();
var sibling = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.sibling)();
var state = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.state)();
var template_effect = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.template_effect)();
var user_effect = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.user_effect)();
var window2 = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.window)();
var if_export = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.if)();

// plugins/2dMovementTAS/src/ui/AnglePicker.svelte
var root = from_html(`<div><div class="circleWrap svelte-lcb12k"><div class="circle svelte-lcb12k"><div class="pointer svelte-lcb12k"></div></div></div> <div class="inputs svelte-lcb12k"><input type="range" min="0" max="360" step="0.01"/> <div><input class="numInput svelte-lcb12k" type="number" min="0" max="360"/> <span>\xB0</span></div></div></div>`);
var $$css = {
  hash: "svelte-lcb12k",
  code: ".circleWrap.svelte-lcb12k {width:100%;display:flex;align-items:center;justify-content:center;}.circle.svelte-lcb12k {width:100px;height:100px;border-radius:50%;background-color:#f0f0f0;position:relative;}.pointer.svelte-lcb12k {width:2px;height:50px;background-color:#000;position:absolute;top:50%;left:50%;transform-origin:0 0;}.inputs.svelte-lcb12k {width:100%;display:flex;align-items:center;justify-content:space-between;}.numInput.svelte-lcb12k {border:none;border-bottom:1px solid black;}"
};
function AnglePicker($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css);
  let angle = prop($$props, "angle", 7, 0);
  function getAngle() {
    return angle();
  }
  let circle;
  let dragging = false;
  function onMousedown(e) {
    dragging = true;
    updateAngle(e);
  }
  function updateAngle(e) {
    if (!dragging) return;
    let rect = circle.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let newAngle = Math.atan2(y - 50, x - 50) * 180 / Math.PI;
    angle(Math.round((newAngle + 360) % 360 * 100) / 100);
  }
  var $$exports = { getAngle };
  var div = root();
  event("pointerup", window2, () => dragging = false);
  event("pointermove", window2, updateAngle);
  var div_1 = child(div);
  var div_2 = child(div_1);
  div_2.__pointerdown = onMousedown;
  var div_3 = child(div_2);
  reset(div_2);
  bind_this(div_2, ($$value) => circle = $$value, () => circle);
  reset(div_1);
  var div_4 = sibling(div_1, 2);
  var input = child(div_4);
  remove_input_defaults(input);
  var div_5 = sibling(input, 2);
  var input_1 = child(div_5);
  remove_input_defaults(input_1);
  next(2);
  reset(div_5);
  reset(div_4);
  reset(div);
  template_effect(() => set_style(div_3, `transform: rotate(${angle() - 90}deg)`));
  bind_value(input, angle);
  bind_value(input_1, angle);
  append($$anchor, div);
  return pop($$exports);
}
delegate(["pointerdown"]);

// plugins/2dMovementTAS/src/util.ts
var blankFrame = {
  angle: 0,
  moving: true,
  answer: false,
  purchase: false
};
function between(number, bound1, bound2) {
  return number >= Math.min(bound1, bound2) && number <= Math.max(bound1, bound2);
}
function showAnglePicker(initial) {
  return new Promise((res) => {
    const div = document.createElement("div");
    const anglePicker = mount(AnglePicker, {
      target: div,
      props: { angle: initial }
    });
    api.UI.showModal(div, {
      title: "Pick an angle",
      closeOnBackgroundClick: false,
      onClosed() {
        unmount(anglePicker);
      },
      buttons: [{
        text: "Cancel",
        style: "close",
        onClick() {
          res(initial);
        }
      }, {
        text: "Ok",
        style: "primary",
        onClick() {
          res(anglePicker.getAngle());
        }
      }]
    });
  });
}
var defaultState = {
  gravity: 0,
  velocity: {
    x: 0,
    y: 0
  },
  movement: {
    direction: "none",
    xVelocity: 0,
    accelerationTicks: 0
  },
  jump: {
    isJumping: false,
    jumpsLeft: 1,
    jumpCounter: 0,
    jumpTicks: 0,
    xVelocityAtJumpStart: 0
  },
  forces: [],
  grounded: false,
  groundedTicks: 0,
  lastGroundedAngle: 0
};
function getFrameState(state2) {
  return Object.assign({}, defaultState, state2);
}
function makeFrameState() {
  const state2 = api.stores.phaser.mainCharacter.physics.state;
  const returnObj = {};
  for (const key in state2) {
    if (JSON.stringify(defaultState[key]) !== JSON.stringify(state2[key])) {
      returnObj[key] = state2[key];
    }
  }
  return returnObj;
}
function updateDeviceState(device, key, value) {
  const deviceId = device.id;
  const states = api.stores.world.devices.states;
  if (!states.has(deviceId)) {
    states.set(deviceId, { deviceId, properties: /* @__PURE__ */ new Map() });
  }
  states.get(deviceId)?.properties.set(key, value);
  device.onStateUpdateFromServer(key, value);
}
function downloadFile(contents, name) {
  const blob = new Blob([contents], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function uploadFile() {
  return new Promise((res, rej) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      if (!input.files || !input.files[0]) return rej();
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        res(reader.result);
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

// plugins/2dMovementTAS/src/tools.svelte.ts
var active = false;
api.net.on("PHYSICS_STATE", (_, editFn) => {
  if (active) editFn(null);
});
window.expectedPoses = [];
var TASTools = class {
  constructor(frames, setFrames, startPos) {
    this.frames = frames;
    this.setFrames = setFrames;
    active = true;
    const mcState = api.net.room.state.characters.get(api.stores.phaser.mainCharacter.id);
    mcState.$callbacks.movementSpeed = [];
    for (const slot of mcState.inventory.slots.values()) {
      slot.$callbacks = {};
    }
    mcState.inventory.slots.onAdd((item) => {
      setTimeout(() => {
        item.$callbacks = {};
      });
    });
    const mc = api.stores.phaser.mainCharacter;
    this.stopPlayback();
    this.rb = mc.physics.getBody().rigidBody;
    if (startPos) {
      this.startPos = startPos;
      this.rb.setTranslation(startPos, true);
    } else {
      this.startPos = this.rb.translation();
    }
    this.movement.state = Object.assign({}, defaultState);
    const allDevices = api.stores.phaser.scene.worldManager.devices.allDevices;
    this.tagEnergyDisplay = allDevices.find((d) => d.options?.text === '0/10,000 <item-image item="energy" />');
    api.net.on("DEVICES_STATES_CHANGES", (packet) => {
      packet.changes.splice(0, packet.changes.length);
    });
    this.setEnergy(940);
    setInterval(
      () => {
        this.save();
      },
      6e4
    );
    window.addEventListener("unload", () => {
      this.save();
    });
  }
  #currentFrame = state(0);
  get currentFrame() {
    return get(this.#currentFrame);
  }
  set currentFrame(value) {
    set(this.#currentFrame, value, true);
  }
  startPos;
  physicsManager = api.stores.phaser.scene.worldManager.physics;
  nativeStep = this.physicsManager.physicsStep;
  inputManager = api.stores.phaser.scene.inputManager;
  prevFrameStates = [];
  mc = api.stores.phaser.mainCharacter;
  rb = this.mc.physics.getBody().rigidBody;
  movement = this.mc.movement;
  tagEnergyDisplay;
  energyPerQuestion = 5e3;
  energyUsage = 60;
  energyTimeout = 0;
  purchaseTimeouts = [];
  energyFrames = [];
  tagMaxEnergy = 1e4;
  setEnergy(amount) {
    if (this.tagEnergyDisplay) {
      updateDeviceState(this.tagEnergyDisplay, `PLAYER_${api.stores.phaser.mainCharacter.id}_text`, `${amount}/${this.tagMaxEnergy} <item-image item="energy" />`);
    }
    const energySlot = api.stores.me.inventory.slots.get("energy");
    if (energySlot) energySlot.amount = amount;
  }
  getEnergy() {
    return api.stores.me.inventory.slots.get("energy")?.amount ?? 0;
  }
  goBackToFrame(number) {
    for (let i = this.currentFrame - 1; i >= number; i--) {
      const frame2 = this.prevFrameStates[i];
      if (!frame2) continue;
      frame2.undoDeviceChanges?.();
    }
    const frame = this.prevFrameStates[number];
    if (!frame) return;
    this.currentFrame = number;
    this.rb.setTranslation(frame.position, true);
    api.stores.phaser.mainCharacter.physics.state = getFrameState(frame.state);
    api.stores.me.movementSpeed = frame.speed;
    this.setEnergy(frame.energy);
    this.energyPerQuestion = frame.epq;
    this.energyUsage = frame.energyUsage;
    this.energyTimeout = frame.energyTimeout;
    this.tagMaxEnergy = frame.maxEnergy;
    this.purchaseTimeouts = frame.purchaseTimeouts;
    this.energyFrames = frame.energyFrames;
  }
  backFrame() {
    if (this.currentFrame <= 0) return;
    this.goBackToFrame(this.currentFrame - 1);
  }
  advanceFrame() {
    const frame = this.frames[this.currentFrame];
    const save = this.getState();
    this.prevFrameStates[this.currentFrame] = save;
    this.updateDevices(frame);
    this.updateCharacter(frame);
    this.inputManager.getPhysicsInput = () => this.getPhysicsInput();
    this.nativeStep(0);
    this.currentFrame++;
  }
  hideUI() {
    api.stores.me.currentAction = "none";
    api.stores.gui.none.screen = "home";
  }
  updateDevices(frame) {
    for (const [countdown, purchase] of this.purchaseTimeouts) {
      if (countdown === 0) {
        const undo = purchase();
        this.prevFrameStates[this.currentFrame].undoDeviceChanges = undo;
      }
    }
    if (!frame.purchase) return;
    const devices = api.stores.phaser.scene.worldManager.devices;
    const realPos = this.rb.translation();
    const device = devices.interactives.findClosestInteractiveDevice(devices.devicesInView, realPos.x * 100, realPos.y * 100);
    if (!device) return;
    if (device.options?.requiredItemId === "energy" && device.options?.amountOfRequiredItem <= this.getEnergy()) {
      const vendingMachines = [
        "Energy Per Question Upgrade",
        "Speed Upgrade",
        "Efficiency Upgrade",
        "Endurance Upgrade",
        "Energy Generator"
      ];
      const name = device.options.grantedItemName;
      const isBarrier = name.includes("Barrier");
      const isBlocker = name.includes("Teleportal") || name.includes("Tunnel") || name.includes("Access") || name.includes("Escape");
      if (isBarrier) {
        this.purchaseTimeouts.push([
          Math.floor(device.options.interactionDuration * 12) - 1,
          () => {
            const channel = device.options.purchaseChannel.split(",")[0];
            updateDeviceState(device, "GLOBAL_active", false);
            const barrier = devices.devicesInView.find((d) => d.options?.showWhenReceivingFrom === channel);
            if (barrier) updateDeviceState(barrier, "GLOBAL_visible", true);
            this.setEnergy(this.getEnergy() - device.options.amountOfRequiredItem);
            return () => {
              updateDeviceState(device, "GLOBAL_active", true);
              if (barrier) updateDeviceState(barrier, "GLOBAL_visible", false);
            };
          }
        ]);
      } else if (isBlocker) {
        this.purchaseTimeouts.push([
          Math.floor(device.options.interactionDuration * 12) - 1,
          () => {
            const channels = device.options.purchaseChannel.split(",").map((str) => str.trim());
            const disable = devices.devicesInView.filter((d) => channels.includes(d.options?.deactivateChannel));
            disable.forEach((d) => updateDeviceState(d, "GLOBAL_active", false));
            this.setEnergy(this.getEnergy() - device.options.amountOfRequiredItem);
            return () => {
              disable.forEach((d) => updateDeviceState(d, "GLOBAL_active", true));
            };
          }
        ]);
      } else if (vendingMachines.includes(name)) {
        this.purchaseTimeouts.push([
          Math.floor(device.options.interactionDuration * 12) - 1,
          () => {
            updateDeviceState(device, "GLOBAL_active", false);
            api.UI.notification.open({ message: `Purchased ${name}` });
            switch (name) {
              case "Energy Per Question Upgrade":
                this.energyPerQuestion += 200;
                break;
              case "Speed Upgrade":
                api.stores.me.movementSpeed += 46.5;
                break;
              case "Efficiency Upgrade":
                this.energyUsage -= 7;
                break;
              case "Endurance Upgrade":
                this.tagMaxEnergy += 5e3;
                break;
              case "Energy Generator":
                this.energyFrames.push(7 * 12);
                break;
            }
            this.setEnergy(this.getEnergy() - device.options.amountOfRequiredItem);
            return () => {
              updateDeviceState(device, "GLOBAL_active", true);
            };
          },
          true
        ]);
      } else {
        api.UI.notification.open({
          message: "Unable to handle what you're trying to purchase. If this is unexpected, please report it."
        });
      }
    }
  }
  updateCharacter(frame) {
    if (frame.answer) {
      if (this.tagEnergyDisplay) {
        this.setEnergy(Math.min(this.tagMaxEnergy, this.getEnergy() + this.energyPerQuestion));
      } else {
        this.setEnergy(this.getEnergy() + this.energyPerQuestion);
      }
    }
    this.energyTimeout--;
    if (frame.moving && this.energyTimeout <= 0) {
      if (this.energyTimeout === 0) this.setEnergy(Math.max(0, this.getEnergy() - this.energyUsage));
      const prevFrame = this.frames[this.currentFrame - 1];
      if (prevFrame?.moving) {
        this.energyTimeout = 6;
      } else {
        this.energyTimeout = 3;
      }
    }
    for (let i = 0; i < this.energyFrames.length; i++) {
      this.energyFrames[i]--;
      if (this.energyFrames[i] <= 0) {
        this.energyFrames[i] = 7 * 12;
        this.setEnergy(this.getEnergy() + 120);
      }
    }
    const devices = api.stores.phaser.scene.worldManager.devices;
    const teleporters = devices.devicesInView.filter((d) => d.deviceOption?.id === "teleporter");
    const body = api.stores.phaser.mainCharacter.body;
    for (const teleporter of teleporters) {
      if (teleporter.x > body.x - 90 && teleporter.x < body.x + 90 && teleporter.y > body.y - 85 && teleporter.y < body.y + 100) {
        const target = teleporter.options.targetGroup;
        if (!target) continue;
        const targetTeleporter = devices.allDevices.find((d) => d.options?.group === target && d.deviceOption?.id === "teleporter");
        if (!targetTeleporter) continue;
        this.rb.setTranslation({ x: targetTeleporter.x / 100, y: targetTeleporter.y / 100 }, true);
        break;
      }
    }
  }
  updateUI() {
    const frame = this.frames[this.currentFrame];
    if (frame.answer) {
      api.stores.phaser.scene.worldManager.devices.allDevices.find((d) => d.options?.openWhenReceivingOn === "answer questions")?.openDeviceUI();
    } else {
      api.stores.me.currentAction = "none";
    }
    if (frame.purchase) {
      api.stores.gui.none.screen = "inventory";
    } else {
      api.stores.gui.none.screen = "home";
    }
  }
  getPhysicsInput(index2 = this.currentFrame) {
    const frame = this.frames[index2];
    const prevFrame = this.frames[index2 - 1];
    let angle = frame.moving ? frame.angle : null;
    for (const [countdown, _, stopMotion] of this.purchaseTimeouts) {
      if (countdown <= 1 && stopMotion) angle = null;
    }
    if (this.getEnergy() <= 0) angle = null;
    this.purchaseTimeouts = this.purchaseTimeouts.map(([c, p, s]) => [c - 1, p, s]);
    this.purchaseTimeouts = this.purchaseTimeouts.filter(([c]) => c >= 0);
    if (frame.answer || prevFrame?.answer) {
      angle = null;
    }
    return { angle, jump: false, _jumpKeyPressed: false };
  }
  getState() {
    return {
      position: this.rb.translation(),
      state: makeFrameState(),
      energy: this.getEnergy(),
      speed: api.stores.me.movementSpeed,
      epq: this.energyPerQuestion,
      energyUsage: this.energyUsage,
      energyTimeout: this.energyTimeout,
      maxEnergy: this.tagMaxEnergy,
      purchaseTimeouts: [...this.purchaseTimeouts],
      energyFrames: [...this.energyFrames]
    };
  }
  startPlayback() {
    this.physicsManager.physicsStep = (delta) => {
      const frame = this.frames[this.currentFrame];
      const save = this.getState();
      this.prevFrameStates[this.currentFrame] = save;
      this.updateDevices(frame);
      this.updateCharacter(frame);
      this.inputManager.getPhysicsInput = () => this.getPhysicsInput();
      this.updateUI();
      this.nativeStep(delta);
      this.currentFrame++;
    };
  }
  stopPlayback() {
    const mc = api.stores.phaser.mainCharacter;
    this.physicsManager.physicsStep = (delta) => {
      mc.physics.postUpdate(delta);
    };
    this.hideUI();
  }
  save() {
    const val = { startPos: this.startPos, frames: this.frames };
    api.storage.setValue("save", val);
    return val;
  }
  download() {
    downloadFile(JSON.stringify(this.save()), "2D TAS.json");
  }
  load() {
    uploadFile().then((file) => {
      const data = JSON.parse(file);
      this.goBackToFrame(0);
      this.startPos = data.startPos;
      this.frames = data.frames;
      this.setFrames(data.frames);
    }).catch(() => {
    });
  }
};

// external-svelte:svelte/reactivity/window
var innerHeight = /* @__PURE__ */ (() => GL.svelte_5_43_0.WindowReactivity.innerHeight)();

// plugins/2dMovementTAS/src/ui/UI.svelte
var root_1 = from_html(`<tr><td class="frame svelte-me8h17"> </td><td class="svelte-me8h17"><input type="checkbox"/></td><td class="svelte-me8h17"><input type="checkbox"/></td><td class="svelte-me8h17"><input type="checkbox"/></td><td><div class="number svelte-me8h17"><div>&uArr;</div> </div> <div class="drag svelte-me8h17">&updownarrow;</div></td></tr>`);
var root2 = from_html(`<div class="UI svelte-me8h17"><div class="controls svelte-me8h17"><button>&larr;</button> <button> </button> <button>&rarr;</button> <button>&#11123;</button> <button>&#11121;</button></div> <table class="svelte-me8h17"><thead><tr class="svelte-me8h17"><th class="svelte-me8h17">Frame #</th><th class="svelte-me8h17">Answer</th><th class="svelte-me8h17">Purchase</th><th class="svelte-me8h17">Move</th><th class="svelte-me8h17">Angle</th></tr></thead><tbody></tbody></table></div>`);
var $$css2 = {
  hash: "svelte-me8h17",
  code: '.UI.svelte-me8h17 {position:absolute;background-color:rgba(255, 255, 255, 0.6);top:0;left:0;height:100%;z-index:9999999;}.controls.svelte-me8h17 {height:50px;display:flex;align-items:center;justify-content:center;gap:5px;}table.svelte-me8h17 {min-width:100%;}tr.svelte-me8h17 {height:22px;}td.dragged.svelte-me8h17 {background-color:rgba(0, 138, 197, 0.5) !important;}tr.active.svelte-me8h17 {background-color:rgba(0, 138, 197, 0.892) !important;}tr.svelte-me8h17:nth-child(even) {background-color:rgba(0, 0, 0, 0.1);}th.svelte-me8h17:first-child, td.svelte-me8h17:first-child {width:100px;}input[type="checkbox"].disabled.svelte-me8h17, input[type="checkbox"].svelte-me8h17:disabled {opacity:0.5;}th.svelte-me8h17, td.svelte-me8h17 {height:22px;width:60px;text-align:center;user-select:none;}.angle.svelte-me8h17 {width:130px;padding:0 10px;display:flex;align-items:center;gap:5px;cursor:pointer;}.angle.svelte-me8h17 .number:where(.svelte-me8h17) {flex-grow:1;display:flex;align-items:center;gap:5px;}.drag.svelte-me8h17 {cursor:ns-resize;}'
};
function UI($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css2);
  let frames = prop($$props, "frames", 7);
  let rows = derived(() => Math.floor(innerHeight.current / 26) - 1);
  let offset = state(0);
  function addBlankFrames() {
    for (let i = get(offset); i < get(offset) + get(rows); i++) {
      if (!frames()[i]) frames()[i] = { ...blankFrame };
    }
  }
  addBlankFrames();
  function setFrames(newFrames) {
    frames(newFrames);
  }
  let tools = new TASTools(frames(), setFrames, $$props.startPos);
  function onScroll(e) {
    if (e.deltaY > 0) set(offset, get(offset) + 1);
    if (e.deltaY < 0) set(offset, get(offset) - 1);
    set(offset, Math.max(0, get(offset)), true);
    addBlankFrames();
  }
  let dragging = false;
  let dragFill;
  let dragKey;
  let dragStart;
  function onClick(index2, key) {
    if (tools.currentFrame > index2) tools.goBackToFrame(index2);
    dragFill = !frames()[index2][key];
    frames()[index2][key] = dragFill;
    dragStart = index2;
    dragKey = key;
    dragging = true;
  }
  let draggingMovement = state(false);
  let draggingMovementStart = state(0);
  let draggingMovementEnd = state(0);
  let draggingMovementAngle = 0;
  function onMouseover(index2) {
    if (dragging) {
      if (tools.currentFrame > index2) tools.goBackToFrame(index2);
      let delta = dragStart < index2 ? 1 : -1;
      for (let i = dragStart; i !== index2 + delta; i += delta) {
        frames()[i][dragKey] = dragFill;
      }
    }
    if (get(draggingMovement)) {
      if (tools.currentFrame > index2) tools.goBackToFrame(index2);
      set(draggingMovementEnd, index2, true);
      let delta = get(draggingMovementStart) < index2 ? 1 : -1;
      for (let i = get(draggingMovementStart); i !== index2 + delta; i += delta) {
        frames()[i].angle = draggingMovementAngle;
      }
    }
  }
  function onArrowClick(index2) {
    set(draggingMovement, true);
    set(draggingMovementStart, index2, true);
    draggingMovementAngle = frames()[index2].angle;
    set(draggingMovementEnd, index2, true);
  }
  let pickingAngle = false;
  function updateAngle(index2) {
    pickingAngle = true;
    if (tools.currentFrame > index2) tools.goBackToFrame(index2);
    showAnglePicker(frames()[index2].angle).then((angle) => {
      pickingAngle = false;
      frames()[index2].angle = angle;
    });
  }
  let playing = state(false);
  function onKeydown(e) {
    if (get(playing) || pickingAngle) return;
    if (e.key === "ArrowRight") {
      if (e.shiftKey) {
        for (let i = 0; i < 5; i++) tools.advanceFrame();
      } else tools.advanceFrame();
    } else if (e.key === "ArrowLeft") {
      if (e.shiftKey) tools.goBackToFrame(Math.max(0, tools.currentFrame - 5));
      else if (tools.currentFrame >= 1) tools.backFrame();
    }
  }
  function keepActiveVisible() {
    console.log("Keep active visilbe?");
    if (tools.currentFrame - 2 < get(offset)) set(offset, Math.max(0, tools.currentFrame - 2), true);
    if (tools.currentFrame + 3 > get(offset) + get(rows)) set(offset, tools.currentFrame - get(rows) + 3);
    addBlankFrames();
  }
  user_effect(() => {
    tools.currentFrame;
    untrack(() => keepActiveVisible());
  });
  function togglePlaying() {
    if (pickingAngle) return;
    set(playing, !get(playing));
    if (get(playing)) tools.startPlayback();
    else tools.stopPlayback();
  }
  function toggleBlockingAction(index2, key) {
    if (tools.currentFrame > index2) tools.goBackToFrame(index2);
    frames()[index2][key] = !frames()[index2][key];
    if (key === "answer") frames()[index2].moving = false;
    if (key === "answer") frames()[index2].purchase = false;
    else frames()[index2].answer = false;
    if (frames()[index2 + 1]) {
      if (key === "answer") frames()[index2 + 1].moving = false;
      frames()[index2 + 1].answer = false;
      frames()[index2 + 1].purchase = false;
    }
    if (frames()[index2 + 2]) {
      frames()[index2 + 2].answer = false;
      frames()[index2 + 2].purchase = false;
    }
  }
  var div = root2();
  event("pointerup", window2, () => {
    dragging = false;
    set(draggingMovement, false);
  });
  event("keydown", window2, onKeydown);
  var div_1 = child(div);
  var button = child(div_1);
  button.__click = () => tools.backFrame();
  var button_1 = sibling(button, 2);
  button_1.__click = togglePlaying;
  var text = child(button_1, true);
  reset(button_1);
  var button_2 = sibling(button_1, 2);
  button_2.__click = () => tools.advanceFrame();
  var button_3 = sibling(button_2, 2);
  button_3.__click = () => tools.download();
  var button_4 = sibling(button_3, 2);
  button_4.__click = () => tools.load();
  reset(div_1);
  var table = sibling(div_1, 2);
  var tbody = sibling(child(table));
  each(tbody, 21, () => ({ length: get(rows) }), index, ($$anchor2, _, i) => {
    const index2 = derived(() => get(offset) + i);
    const answerDisabled = derived(() => frames()[get(index2)].purchase || frames()[get(index2) - 1]?.answer || frames()[get(index2) - 2]?.answer || frames()[get(index2) - 1]?.purchase || frames()[get(index2) - 2]?.purchase);
    const purchaseDisabled = derived(() => frames()[get(index2)].answer || frames()[get(index2) - 1]?.answer || frames()[get(index2) - 2]?.answer || frames()[get(index2) - 1]?.purchase || frames()[get(index2) - 2]?.purchase);
    const moveDisabled = derived(() => frames()[get(index2)].answer || frames()[get(index2) - 1]?.answer);
    var tr = root_1();
    tr.__pointerover = () => onMouseover(get(index2));
    let classes;
    var td = child(tr);
    var text_1 = child(td, true);
    reset(td);
    var td_1 = sibling(td);
    td_1.__mousedown = () => get(answerDisabled) || toggleBlockingAction(get(index2), "answer");
    var input = child(td_1);
    remove_input_defaults(input);
    let classes_1;
    reset(td_1);
    var td_2 = sibling(td_1);
    td_2.__mousedown = () => get(purchaseDisabled) || toggleBlockingAction(get(index2), "purchase");
    var input_1 = child(td_2);
    remove_input_defaults(input_1);
    let classes_2;
    reset(td_2);
    var td_3 = sibling(td_2);
    td_3.__mousedown = () => get(moveDisabled) || onClick(get(index2), "moving");
    var input_2 = child(td_3);
    remove_input_defaults(input_2);
    let classes_3;
    reset(td_3);
    var td_4 = sibling(td_3);
    let classes_4;
    var div_2 = child(td_4);
    div_2.__pointerdown = () => updateAngle(get(index2));
    var div_3 = child(div_2);
    var text_2 = sibling(div_3);
    reset(div_2);
    var div_4 = sibling(div_2, 2);
    div_4.__pointerdown = () => onArrowClick(get(index2));
    reset(td_4);
    reset(tr);
    template_effect(
      ($0, $1) => {
        classes = set_class(tr, 1, "svelte-me8h17", null, classes, { active: tools.currentFrame === get(index2) });
        set_text(text_1, get(index2));
        classes_1 = set_class(input, 1, "svelte-me8h17", null, classes_1, { disabled: get(answerDisabled) });
        classes_2 = set_class(input_1, 1, "svelte-me8h17", null, classes_2, { disabled: get(purchaseDisabled) });
        classes_3 = set_class(input_2, 1, "svelte-me8h17", null, classes_3, { disabled: get(moveDisabled) });
        classes_4 = set_class(td_4, 1, "angle svelte-me8h17", null, classes_4, $0);
        set_style(div_3, `transform: rotate(${frames()[get(index2)].angle + 90}deg)`);
        set_text(text_2, ` ${$1 ?? ""}\xB0`);
      },
      [
        () => ({
          dragged: get(draggingMovement) && between(get(index2), get(draggingMovementStart), get(draggingMovementEnd))
        }),
        () => Math.round(frames()[get(index2)].angle * 100) / 100
      ]
    );
    bind_checked(input, () => frames()[get(index2)].answer, ($$value) => frames()[get(index2)].answer = $$value);
    bind_checked(input_1, () => frames()[get(index2)].purchase, ($$value) => frames()[get(index2)].purchase = $$value);
    bind_checked(input_2, () => frames()[get(index2)].moving, ($$value) => frames()[get(index2)].moving = $$value);
    append($$anchor2, tr);
  });
  reset(tbody);
  reset(table);
  reset(div);
  template_effect(() => set_text(text, get(playing) ? "\u23F9" : "\u25B6"));
  event("wheel", div, onScroll);
  append($$anchor, div);
  pop();
}
delegate(["click", "pointerover", "mousedown", "pointerdown"]);

// plugins/2dMovementTAS/src/ui/Start.svelte
var root_3 = from_html(`<button class="svelte-mahvf1">Continue TAS</button>`);
var root_2 = from_html(`<div class="svelte-mahvf1"><!> <button class="svelte-mahvf1">New TAS at current position</button> <button class="svelte-mahvf1">Load TAS from file</button></div>`);
var $$css3 = {
  hash: "svelte-mahvf1",
  code: "div.svelte-mahvf1 {position:absolute;top:0;left:0;z-index:999999;display:flex;flex-direction:column;gap:10px;padding:10px;}button.svelte-mahvf1 {padding:5px 20px;border-radius:100px;background-color:rgba(0, 0, 0, 0.5);color:white;border:1px solid black;transition:transform 0.2s ease;}button.svelte-mahvf1:hover {transform:scale(1.05);}button.svelte-mahvf1:active {transform:scale(0.95);}"
};
function Start($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css3);
  let begun = state(false);
  let save = api.storage.getValue("save");
  let frames = state(proxy([]));
  let startPos = state(void 0);
  function continueTAS() {
    set(frames, save.frames, true);
    set(startPos, save.startPos, true);
    set(begun, true);
  }
  function newTAS() {
    if (save) {
      let conf = confirm("Are you sure you want to start a new TAS? Your current TAS will be lost.");
      if (!conf) return;
    }
    set(frames, [], true);
    set(begun, true);
  }
  async function loadTAS() {
    if (save) {
      let conf = confirm("Are you sure you want to load a new TAS? Your current TAS will be lost.");
      if (!conf) return;
    }
    try {
      let data = await uploadFile();
      let json = JSON.parse(data);
      set(frames, json.frames, true);
      set(startPos, json.startPos, true);
      set(begun, true);
    } catch {
    }
  }
  var fragment = comment();
  var node = first_child(fragment);
  {
    var consequent = ($$anchor2) => {
      UI($$anchor2, {
        get frames() {
          return get(frames);
        },
        get startPos() {
          return get(startPos);
        }
      });
    };
    var alternate = ($$anchor2) => {
      var div = root_2();
      var node_1 = child(div);
      {
        var consequent_1 = ($$anchor3) => {
          var button = root_3();
          button.__click = continueTAS;
          append($$anchor3, button);
        };
        if_export(node_1, ($$render) => {
          if (save) $$render(consequent_1);
        });
      }
      var button_1 = sibling(node_1, 2);
      button_1.__click = newTAS;
      var button_2 = sibling(button_1, 2);
      button_2.__click = loadTAS;
      reset(div);
      append($$anchor2, div);
    };
    if_export(node, ($$render) => {
      if (get(begun)) $$render(consequent);
      else $$render(alternate, false);
    });
  }
  append($$anchor, fragment);
  pop();
}
delegate(["click"]);

// plugins/2dMovementTAS/src/index.ts
api.net.onLoad(() => {
  const ui = mount(Start, { target: document.body });
  api.onStop(() => unmount(ui));
});
