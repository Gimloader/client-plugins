/**
 * @name Savestates
 * @description Allows you to save and load states/summits in Don't Look Down. Only client side, nobody else can see you move.
 * @author TheLazySquid
 * @version 0.5.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Savestates.js
 * @webpage https://gimloader.github.io/plugins/Savestates
 * @optionalLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Desynchronize.js
 * @gamemode dontLookDown
 * @changelog Updated webpage url
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

// plugins/Savestates/src/states.ts
var defaultName = "Main";
function upgradeFromLegacy() {
  const legacyLastPos = api.storage.getValue("lastPos");
  const legacyLastState = api.storage.getValue("lastState");
  if (legacyLastPos) {
    api.storage.deleteValue("lastPos");
    api.storage.deleteValue("lastState");
    api.storage.setValue("savedStates", [{
      name: defaultName,
      pos: legacyLastPos,
      state: legacyLastState
    }]);
    api.storage.setValue("selectedState", defaultName);
  }
}
var storage = () => ({
  savedStates: api.storage.getValue("savedStates", []),
  selectedState: api.storage.getValue("selectedState", null)
});
function getSelectedState() {
  const { savedStates, selectedState } = storage();
  return savedStates.find((s) => s.name === selectedState);
}
function updateState(pos, state) {
  const { savedStates, selectedState } = storage();
  if (selectedState === null) {
    api.storage.setValue("savedStates", [{ name: defaultName, pos, state }]);
    api.storage.setValue("selectedState", defaultName);
    return defaultName;
  }
  const selected = savedStates.find((s) => s.name === selectedState);
  selected.pos = pos;
  selected.state = state;
  api.storage.setValue("savedStates", savedStates);
  return selected.name;
}
function setSelected(name) {
  api.storage.setValue("selectedState", name);
}
function createState(name, pos, state) {
  const { savedStates } = storage();
  savedStates.push({ name, pos, state });
  api.storage.setValue("savedStates", savedStates);
  api.storage.setValue("selectedState", name);
}
function deleteState(name) {
  const { savedStates } = storage();
  api.storage.setValue("savedStates", savedStates.filter((s) => s.name !== name));
}
function renameState(name, newName) {
  const { savedStates, selectedState } = storage();
  const state = savedStates.find((s) => s.name === name);
  state.name = newName;
  api.storage.setValue("savedStates", savedStates);
  if (selectedState === name) {
    api.storage.setValue("selectedState", newName);
  }
}

// plugins/Savestates/src/index.ts
var desync = api.plugin("Desynchronize");
var defaultState = '{"gravity":0.001,"velocity":{"x":0,"y":0},"movement":{"direction":"none","xVelocity":0,"accelerationTicks":0},"jump":{"isJumping":false,"jumpsLeft":2,"jumpCounter":0,"jumpTicks":118,"xVelocityAtJumpStart":0},"forces":[],"grounded":true,"groundedTicks":0,"lastGroundedAngle":0}';
var stateLoadCallbacks = [];
upgradeFromLegacy();
var tp = (summit) => {
  if (!gameLoaded) return;
  const physics = api.stores.phaser.mainCharacter.physics;
  const rb = physics.getBody().rigidBody;
  desync.DLD.cancelRespawn();
  rb.setTranslation(summitCoords[summit], true);
  physics.state = JSON.parse(defaultState);
  stateLoadCallbacks.forEach((cb) => cb(summit));
  desync.DLD.onSummitTeleport(summit);
};
function getPhysics() {
  const { physics } = api.stores.phaser.mainCharacter;
  return { physics, rb: physics.getBody().rigidBody };
}
function getPhysicsState() {
  const { physics, rb } = getPhysics();
  return { pos: rb.translation(), state: JSON.stringify(physics.state) };
}
var gameLoaded = false;
var saveState = () => {
  if (!gameLoaded) return;
  const { pos, state } = getPhysicsState();
  const name = updateState(pos, state);
  api.UI.notification.open({ message: `State Saved to ${name}`, duration: 0.75 });
};
var loadState = () => {
  if (!gameLoaded) return;
  const selectedState = getSelectedState();
  if (!selectedState) {
    api.UI.notification.error({ message: "You don't have any states, create a state with Gimloader commands", duration: 2 });
    return;
  }
  const { rb, physics } = getPhysics();
  desync.DLD.cancelRespawn();
  rb.setTranslation(selectedState.pos, true);
  physics.state = JSON.parse(selectedState.state);
  api.UI.notification.open({ message: `State Loaded: ${selectedState.name}`, duration: 0.75 });
  stateLoadCallbacks.forEach((cb) => cb("custom"));
};
async function getNewName(context, initial) {
  let name = await context.string({ title: initial });
  while (true) {
    const { savedStates } = storage();
    if (savedStates.every((s) => s.name !== name)) break;
    name = await context.string({ title: `"${name}" is already taken!` });
  }
  return name;
}
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
  api.commands.addCommand({ text: "Savestates: Create State" }, async (context) => {
    const name = await getNewName(context, "Name");
    const { pos, state } = getPhysicsState();
    createState(name, pos, state);
    api.UI.notification.open({ message: `State Created and Selected: ${name}`, duration: 0.75 });
  });
  api.commands.addCommand({
    text() {
      const { selectedState } = storage();
      return `Savestates: Select State (Currently Selected: ${selectedState})`;
    },
    hidden() {
      const { savedStates } = storage();
      return savedStates.length < 2;
    }
  }, async (context) => {
    const { savedStates, selectedState } = storage();
    const selected = await context.select({
      title: `State (${selectedState} is currently selected)`,
      options: savedStates.map(({ name }) => ({ label: name, value: name }))
    });
    setSelected(selected);
    loadState();
    api.UI.notification.open({ message: `Switched to State: ${selected}` });
  });
  api.commands.addCommand({
    text: "Savestates: Delete State",
    hidden() {
      const { savedStates } = storage();
      return savedStates.length === 0;
    }
  }, async (context) => {
    const { savedStates, selectedState } = storage();
    const selected = await context.select({
      title: "State",
      options: savedStates.filter((state) => state.name !== selectedState).map(({ name }) => ({ label: name, value: name }))
    });
    deleteState(selected);
    api.UI.notification.open({ message: `Deleted State ${selected}` });
  });
  api.commands.addCommand({
    text: "Savestates: Rename State",
    hidden() {
      const { savedStates } = storage();
      return savedStates.length === 0;
    }
  }, async (context) => {
    const { savedStates, selectedState } = storage();
    const selected = await context.select({
      title: "State",
      options: savedStates.map(({ name }) => ({
        label: name === selectedState ? `${name} (selected state)` : name,
        value: name
      }))
    });
    const newName = await getNewName(context, "New Name");
    renameState(selected, newName);
  });
  api.commands.addCommand({
    text() {
      const { selectedState } = storage();
      return `Savestates: Save Selected State${selectedState && ` (${selectedState})`}`;
    }
  }, saveState);
  api.commands.addCommand({
    text() {
      const { selectedState } = storage();
      return `Savestates: Load Selected State${selectedState && ` (${selectedState})`}`;
    }
  }, loadState);
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
    title: `Savestates: Teleport to Summit ${i}`,
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
