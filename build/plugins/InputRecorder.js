/**
 * @name InputRecorder
 * @description Records your inputs in Don't Look Down
 * @author TheLazySquid
 * @version 0.4.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InputRecorder.js
 * @webpage https://gimloader.github.io/plugins/InputRecorder
 * @reloadRequired ingame
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Desynchronize.js
 * @gamemode dontLookDown
 * @changelog Updated webpage url
 */

// plugins/InputRecorder/src/updateLasers.ts
var lasers = [];
api.net.on("DEVICES_STATES_CHANGES", (packet) => {
  for (let i = 0; i < packet.changes.length; i++) {
    const device = packet.changes[i];
    if (lasers.some((l) => l.id === device[0])) {
      packet.changes.splice(i, 1);
      i -= 1;
    }
  }
});
function stopUpdatingLasers() {
  lasers = [];
}
var lastActive = null;
function updateLasers(frame) {
  if (lasers.length === 0) {
    lasers = api.stores.phaser.scene.worldManager.devices.allDevices.filter((d) => d.laser);
  }
  const states = api.stores.world.devices.states;
  const devices = api.stores.phaser.scene.worldManager.devices;
  const active = frame % 66 < 36;
  if (lastActive === active) return;
  lastActive = active;
  if (!states.has(lasers[0].id)) {
    lasers = api.stores.phaser.scene.worldManager.devices.allDevices.filter((d) => d.laser);
  }
  for (const laser of lasers) {
    if (!states.has(laser.id)) {
      const propsMap = /* @__PURE__ */ new Map();
      propsMap.set("GLOBAL_active", active);
      states.set(laser.id, { deviceId: laser.id, properties: propsMap });
    } else {
      states.get(laser.id)?.properties.set("GLOBAL_active", active);
    }
    devices.getDeviceById(laser.id)?.onStateUpdateFromServer("GLOBAL_active", active);
  }
}

// plugins/InputRecorder/src/recorder.ts
var Recorder = class {
  constructor(physicsManager) {
    this.physicsManager = physicsManager;
    this.physicsManager = physicsManager;
    this.nativeStep = physicsManager.physicsStep;
    for (const id of physicsManager.bodies.staticBodies) {
      physicsManager.bodies.activeBodies.enableBody(id);
    }
    physicsManager.bodies.activeBodies.disableBody = () => {
    };
  }
  nativeStep;
  physics = api.stores.phaser.mainCharacter.physics;
  rb = this.physics.getBody().rigidBody;
  inputManager = api.stores.phaser.scene.inputManager;
  getPhysicsInput = this.inputManager.getPhysicsInput;
  startPos = { x: 0, y: 0 };
  startState = "";
  platformerPhysics = "";
  frames = [];
  recording = false;
  playing = false;
  toggleRecording() {
    if (this.recording) {
      const conf = window.confirm("Do you want to save the recording?");
      this.stopRecording(conf);
    } else this.startRecording();
  }
  startRecording() {
    this.recording = true;
    this.startPos = this.rb.translation();
    this.startState = JSON.stringify(this.physics.state);
    this.platformerPhysics = JSON.stringify(GL.platformerPhysics);
    this.frames = [];
    api.UI.notification.open({ message: "Started Recording" });
    this.inputManager.getPhysicsInput = this.getPhysicsInput;
    this.physicsManager.physicsStep = (dt) => {
      this.frames.push(this.inputManager.getPhysicsInput());
      this.nativeStep(dt);
      updateLasers(this.frames.length);
    };
  }
  stopRecording(save, fileName) {
    this.recording = false;
    this.physicsManager.physicsStep = this.nativeStep;
    stopUpdatingLasers();
    if (!save) return;
    const json = {
      startPos: this.startPos,
      startState: this.startState,
      platformerPhysics: this.platformerPhysics,
      frames: this.frames
    };
    const blob = new Blob([JSON.stringify(json)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const name = api.stores.phaser.mainCharacter.nametag.name;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? `recording-${name}.json`;
    a.click();
  }
  async playback(data) {
    const desync = api.plugin("Desynchronize");
    desync.DLD.cancelRespawn();
    this.playing = true;
    this.platformerPhysics = JSON.stringify(GL.platformerPhysics);
    this.rb.setTranslation(data.startPos, true);
    this.physics.state = JSON.parse(data.startState);
    Object.assign(GL.platformerPhysics, JSON.parse(data.platformerPhysics));
    this.physicsManager.physicsStep = (dt) => {
      api.stores.phaser.mainCharacter.physics.postUpdate(dt);
    };
    await new Promise((resolve) => setTimeout(resolve, 1500));
    let currentFrame = 0;
    this.physicsManager.physicsStep = (dt) => {
      const frame = data.frames[currentFrame];
      if (!frame) {
        this.stopPlayback();
        api.UI.notification.open({ message: "Playback finished" });
        return;
      }
      this.inputManager.getPhysicsInput = () => frame;
      this.nativeStep(dt);
      currentFrame++;
      updateLasers(currentFrame);
    };
  }
  stopPlayback() {
    this.playing = false;
    Object.assign(GL.platformerPhysics, JSON.parse(this.platformerPhysics));
    stopUpdatingLasers();
    this.physicsManager.physicsStep = this.nativeStep;
    this.inputManager.getPhysicsInput = this.getPhysicsInput;
  }
};

// plugins/InputRecorder/src/index.ts
var recorder;
function startRecording() {
  if (!recorder) return;
  if (recorder.playing) {
    api.UI.notification.open({ message: "Cannot record while playing", type: "error" });
    return;
  }
  if (recorder.recording) {
    api.hotkeys.releaseAll();
  }
  recorder.toggleRecording();
}
function playBackRecording() {
  if (!recorder) return;
  if (recorder.recording) {
    api.UI.notification.open({ message: "Cannot playback while recording", type: "error" });
    return;
  }
  if (recorder.playing) {
    recorder.stopPlayback();
    api.UI.notification.open({ message: "Playback canceled" });
  } else {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      api.hotkeys.releaseAll();
      const file = input.files?.[0];
      if (!file) return;
      const json = await file.text();
      const data = JSON.parse(json);
      api.UI.notification.open({ message: "Starting Playback" });
      recorder.playback(data);
    };
    input.click();
  }
}
api.hotkeys.addConfigurableHotkey({
  category: "Input Recorder",
  title: "Start Recording",
  default: {
    key: "KeyR",
    alt: true
  }
}, startRecording);
api.hotkeys.addConfigurableHotkey({
  category: "Input Recorder",
  title: "Play Back Recording",
  default: {
    key: "KeyB",
    alt: true
  }
}, playBackRecording);
api.net.onLoad(() => {
  recorder = new Recorder(api.stores.phaser.scene.worldManager.physics);
  api.commands.addCommand({ text: () => `InputRecorder: ${recorder.recording ? "Stop Recording" : "Start Recording"}` }, startRecording);
  api.commands.addCommand({ text: "InputRecorder: Play Back Recording" }, playBackRecording);
});
function getRecorder() {
  return recorder;
}
export {
  getRecorder
};
