/**
 * @name PhysicsSettings
 * @description Allows you to configure various things about the physics in platformer modes (client-side only)
 * @author TheLazySquid
 * @version 0.2.3
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/PhysicsSettings.js
 * @webpage https://gimloader.github.io/plugins/physicssettings
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js
 * @hasSettings true
 * @gamemode 2d
 * @changelog Made settings reset to default when the plugin is disabled
 */

// plugins/PhysicsSettings/src/index.ts
var settings = api.settings.create([
  {
    type: "number",
    id: "jumps",
    title: "Number of Jumps",
    description: "How many jumps should the character get, including the one on the ground? 2 by default.",
    min: 0,
    step: 1,
    default: 2
  },
  {
    type: "number",
    id: "jumpheight",
    title: "Jump Height",
    description: "How high should the character jump? 1.92 by default.",
    default: 1.92
  },
  {
    type: "number",
    id: "speed",
    title: "Grounded Move Speed",
    description: "How fast should the character move on the ground? 310 by default.",
    default: 310
  }
]);
var updateMapOption = (key, value) => {
  const options = JSON.parse(api.stores.world.mapOptionsJSON);
  options[key] = value;
  api.stores.world.mapOptionsJSON = JSON.stringify(options);
};
var applyAll = () => {
  const options = JSON.parse(api.stores.world.mapOptionsJSON);
  options.maxJumps = settings.jumps;
  options.jumpHeight = settings.jumpheight;
  api.stores.world.mapOptionsJSON = JSON.stringify(options);
};
api.net.onLoad(() => {
  if (api.stores?.session?.mapStyle !== "platformer") return;
  api.net.room.state.listen("mapSettings", () => {
    applyAll();
  });
  const dldTas = api.plugin("DLDTAS");
  dldTas?.setMoveSpeed(settings.speed);
  api.stores.me.movementSpeed = settings.speed;
  settings.listen("jumps", (jumps) => updateMapOption("maxJumps", jumps));
  settings.listen("jumpheight", (height) => updateMapOption("jumpHeight", height));
  settings.listen("speed", (speed) => {
    dldTas?.setMoveSpeed(settings.speed);
    api.stores.me.movementSpeed = speed;
  });
  api.onStop(() => {
    const options = JSON.parse(api.stores.world.mapOptionsJSON);
    options.maxJumps = 2;
    options.jumpHeight = 1.92;
    api.stores.world.mapOptionsJSON = JSON.stringify(options);
    dldTas?.setMoveSpeed(310);
    api.stores.me.movementSpeed = 310;
  });
});
