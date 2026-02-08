/**
 * @name ToggleTerrainType
 * @description Quickly toggle whether you are placing terrain as walls or as floor. Allows you to place tiles as floors in platformer mode.
 * @author TheLazySquid
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/ToggleTerrainType.js
 * @webpage https://gimloader.github.io/plugins/toggleterraintype
 * @changelog Added a command to toggle the terrain type
 */

// plugins/ToggleTerrainType/src/index.ts
function toggle() {
  const terrain = api.stores?.me?.adding?.terrain;
  if (!terrain) return;
  terrain.buildTerrainAsWall = !terrain.buildTerrainAsWall;
  api.UI.notification.open({
    message: `Placing terrain as a ${terrain.buildTerrainAsWall ? "wall" : "floor"}`
  });
}
api.hotkeys.addConfigurableHotkey({
  category: "ToggleTerrainType",
  title: "Switch between placing walls/floors",
  default: {
    key: "KeyT",
    alt: true
  }
}, toggle);
api.net.onLoad(() => {
  api.commands.addCommand({ text: "Toggle Terrain Type" }, toggle);
});
