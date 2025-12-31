/**
 * @name ToggleTerrainType
 * @description Quickly toggle whether you are placing terrain as walls or as floor. Allows you to place tiles as floors in platformer mode.
 * @author TheLazySquid
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/ToggleTerrainType.js
 * @webpage https://gimloader.github.io/plugins/toggleterraintype
 */

// plugins/ToggleTerrainType/src/index.ts
api.hotkeys.addConfigurableHotkey({
  category: "ToggleTerrainType",
  title: "Switch between placing walls/floors",
  default: {
    key: "KeyT",
    alt: true
  }
}, () => {
  const terrain = api.stores?.me?.adding?.terrain;
  if (!terrain) return;
  terrain.buildTerrainAsWall = !terrain.buildTerrainAsWall;
  api.notification.open({
    message: `Placing terrain as a ${terrain.buildTerrainAsWall ? "wall" : "floor"}`
  });
});
