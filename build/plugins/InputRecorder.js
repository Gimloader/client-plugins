/**
 * @name InputRecorder
 * @description Records your inputs in Don't Look Down
 * @author TheLazySquid
 * @version 0.3.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InputRecorder.js
 * @webpage https://gimloader.github.io/plugins/inputrecorder
 * @reloadRequired ingame
 * @needsLib DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/DLDUtils.js
 * @gamemode dontLookDown
 */

// plugins/InputRecorder/src/updateLasers.ts
var lasers = [];
api.net.on("DEVICES_STATES_CHANGES", (packet) => {
  for (let i = 0; i < packet.changes.length; i++) {
    let device = packet.changes[i];
    if (lasers.some((l) => l.id === device[0])) {
      packet.changes.splice(i, 1);
      i -= 1;
    }
  }
});
function stopUpdatingLasers() {
  lasers = [];
}
function updateLasers(frame) {
  if (lasers.length === 0) {
    lasers = api.stores.phaser.scene.worldManager.devices.allDevices.filter((d) => d.laser);
  }
  let states = api.stores.world.devices.states;
  let devices = api.stores.phaser.scene.worldManager.devices;
  let active = frame % 66 < 36;
  if (!states.has(lasers[0].id)) {
    lasers = api.stores.phaser.scene.worldManager.devices.allDevices.filter((d) => d.laser);
  }
  for (let laser of lasers) {
    if (!states.has(laser.id)) {
      let propsMap = /* @__PURE__ */ new Map();
      propsMap.set("GLOBAL_active", active);
      states.set(laser.id, { deviceId: laser.id, properties: propsMap });
    } else {
      states.get(laser.id).properties.set("GLOBAL_active", active);
    }
    devices.getDeviceById(laser.id).onStateUpdateFromServer("GLOBAL_active", active);
  }
}

// plugins/InputRecorder/src/recorder.ts
var Recorder = class {
  physicsManager;
  nativeStep;
  physics;
  rb;
  inputManager;
  getPhysicsInput;
  startPos = { x: 0, y: 0 };
  startState = "";
  platformerPhysics = "";
  frames = [];
  recording = false;
  playing = false;
  constructor(physicsManager) {
    this.physicsManager = physicsManager;
    this.nativeStep = physicsManager.physicsStep;
    for (let id of physicsManager.bodies.staticBodies) {
      physicsManager.bodies.activeBodies.enableBody(id);
    }
    physicsManager.bodies.activeBodies.disableBody = () => {
    };
    this.physics = api.stores.phaser.mainCharacter.physics;
    this.rb = this.physics.getBody().rigidBody;
    this.inputManager = api.stores.phaser.scene.inputManager;
    this.getPhysicsInput = this.inputManager.getPhysicsInput;
  }
  toggleRecording() {
    if (this.recording) {
      let conf = window.confirm("Do you want to save the recording?");
      this.stopRecording(conf);
    } else this.startRecording();
  }
  startRecording() {
    this.recording = true;
    this.startPos = this.rb.translation();
    this.startState = JSON.stringify(this.physics.state);
    this.platformerPhysics = JSON.stringify(GL.platformerPhysics);
    this.frames = [];
    api.notification.open({ message: "Started Recording" });
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
    let json = {
      startPos: this.startPos,
      startState: this.startState,
      platformerPhysics: this.platformerPhysics,
      frames: this.frames
    };
    let blob = new Blob([JSON.stringify(json)], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let name = api.stores.phaser.mainCharacter.nametag.name;
    let a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? `recording-${name}.json`;
    a.click();
  }
  async playback(data) {
    api.lib("DLDUtils").cancelRespawn();
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
      let frame = data.frames[currentFrame];
      if (!frame) {
        this.stopPlayback();
        api.notification.open({ message: "Playback finished" });
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
api.hotkeys.addConfigurableHotkey({
  category: "Input Recorder",
  title: "Start Recording",
  default: {
    key: "KeyR",
    alt: true
  }
}, () => {
  if (!recorder) return;
  if (recorder.playing) {
    api.notification.open({ message: "Cannot record while playing", type: "error" });
    return;
  }
  if (recorder.recording) {
    api.hotkeys.releaseAll();
  }
  recorder.toggleRecording();
});
api.hotkeys.addConfigurableHotkey({
  category: "Input Recorder",
  title: "Play Back Recording",
  default: {
    key: "KeyB",
    alt: true
  }
}, () => {
  if (!recorder) return;
  if (recorder.recording) {
    api.notification.open({ message: "Cannot playback while recording", type: "error" });
    return;
  }
  if (recorder.playing) {
    recorder.stopPlayback();
    api.notification.open({ message: "Playback canceled" });
  } else {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      api.hotkeys.releaseAll();
      let file = input.files?.[0];
      if (!file) return;
      let json = await file.text();
      let data = JSON.parse(json);
      api.notification.open({ message: "Starting Playback" });
      recorder.playback(data);
    };
    input.click();
  }
});
api.net.onLoad(() => {
  recorder = new Recorder(api.stores.phaser.scene.worldManager.physics);
});
function getRecorder() {
  return recorder;
}
export {
  getRecorder
};
