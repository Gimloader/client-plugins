/**
 * @name Savestates
 * @description Allows you to save and load states/summits in Don't Look Down. Only client side, nobody else can see you move.
 * @author TheLazySquid
 * @version 0.4.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Savestates.js
 * @webpage https://gimloader.github.io/plugins/savestates
 * @needsLib DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/DLDUtils.js
 * @optionalLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
 * @gamemode dontLookDown
 */

// shared/consts.ts
var summitCoords = [
  { x: 38.2555427551269, y: 638.38995361328 },
  { x: 90.2299728393554, y: 638.37768554687 },
  { x: 285.440002441406, y: 532.7800292968 },
  { x: 217.550003051757, y: 500.77999877929 },
  { x: 400.33999633789, y: 413.73999023437 },
  { x: 356.540008544921, y: 351.6600036621 },
  { x: 401.269989013671, y: 285.73999023437 }
];

// plugins/Savestates/src/index.ts
var dldUtils = api.lib("DLDUtils");
var defaultState = '{"gravity":0.001,"velocity":{"x":0,"y":0},"movement":{"direction":"none","xVelocity":0,"accelerationTicks":0},"jump":{"isJumping":false,"jumpsLeft":2,"jumpCounter":0,"jumpTicks":118,"xVelocityAtJumpStart":0},"forces":[],"grounded":true,"groundedTicks":0,"lastGroundedAngle":0}';
var stateLoadCallbacks = [];
var tp = (summit) => {
  if (!gameLoaded) return;
  const physics = api.stores.phaser.mainCharacter.physics;
  const rb = physics.getBody().rigidBody;
  dldUtils.cancelRespawn();
  rb.setTranslation(summitCoords[summit], true);
  physics.state = JSON.parse(defaultState);
  stateLoadCallbacks.forEach((cb) => cb(summit));
};
var lastPos = api.storage.getValue("lastPos", null);
var lastState = api.storage.getValue("lastState", null);
var gameLoaded = false;
var saveState = () => {
  if (!gameLoaded) return;
  const physics = api.stores.phaser.mainCharacter.physics;
  const rb = physics.getBody().rigidBody;
  lastPos = rb.translation();
  lastState = JSON.stringify(physics.state);
  api.storage.setValue("lastPos", lastPos);
  api.storage.setValue("lastState", lastState);
  api.notification.open({ message: "State Saved", duration: 0.75 });
};
var loadState = () => {
  if (!gameLoaded) return;
  const physics = api.stores.phaser.mainCharacter.physics;
  const rb = physics.getBody().rigidBody;
  if (!lastPos || !lastState) return;
  dldUtils.cancelRespawn();
  rb.setTranslation(lastPos, true);
  physics.state = JSON.parse(lastState);
  api.notification.open({ message: "State Loaded", duration: 0.75 });
  stateLoadCallbacks.forEach((cb) => cb("custom"));
};
api.net.onLoad(() => {
  gameLoaded = true;
  const commandLine = api.lib("CommandLine");
  if (commandLine) {
    commandLine.addCommand("summit", [
      { "number": ["0", "1", "2", "3", "4", "5", "6"] }
    ], (summit) => {
      tp(parseInt(summit, 10));
    });
    commandLine.addCommand("save", [], saveState);
    commandLine.addCommand("load", [], loadState);
    api.onStop(() => {
      commandLine.removeCommand("summit");
      commandLine.removeCommand("save");
      commandLine.removeCommand("load");
    });
  }
});
api.hotkeys.addConfigurableHotkey({
  category: "Savestates",
  title: "Save Current State",
  default: {
    key: "Comma",
    alt: true
  }
}, saveState);
api.hotkeys.addConfigurableHotkey({
  category: "Savestates",
  title: "Load Last State",
  default: {
    key: "Period",
    alt: true
  }
}, loadState);
for (let i = 0; i <= 6; i++) {
  api.hotkeys.addConfigurableHotkey({
    category: "Savestates",
    title: `Teleport to Summit ${i}`,
    default: {
      key: `Digit${i}`,
      shift: true,
      alt: true
    }
  }, () => tp(i));
}
function onStateLoaded(callback) {
  stateLoadCallbacks.push(callback);
}
function offStateLoaded(callback) {
  stateLoadCallbacks = stateLoadCallbacks.filter((cb) => cb !== callback);
}
export {
  offStateLoaded,
  onStateLoaded
};
