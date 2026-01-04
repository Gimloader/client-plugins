/**
 * @name InstantUse
 * @description Instantly use nearby devices without any wait
 * @author TheLazySquid
 * @version 0.2.5
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/InstantUse.js
 * @webpage https://gimloader.github.io/plugins/instantuse
 * @changelog Fixed using devices after the game has ended
 */

// plugins/InstantUse/src/index.ts
api.hotkeys.addConfigurableHotkey({
  category: "InstantUse",
  title: "Use Device",
  default: {
    key: "Enter"
  },
  preventDefault: false
}, () => {
  if (api.stores?.session?.gameSession?.phase !== "game") return;
  const devices = api.stores?.phaser?.scene?.worldManager?.devices;
  const body = api.stores?.phaser?.mainCharacter?.body;
  if (!devices || !body) return;
  const device = devices.interactives.findClosestInteractiveDevice(devices.devicesInView, body.x, body.y);
  device?.interactiveZones?.onInteraction?.();
});
