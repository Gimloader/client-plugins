/**
 * @name ClickTP
 * @description Ctrl+Click to teleport anywhere client-side
 * @author TheLazySquid
 * @version 0.1.3
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/ClickTP.js
 * @webpage https://gimloader.github.io/plugins/clicktp
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js
 * @gamemode 2d
 */

// plugins/ClickTP/src/index.ts
api.net.onLoad(() => {
  const onClick = (e) => {
    if (!e.ctrlKey) return;
    const pos = api.stores.phaser.scene.inputManager.getMouseWorldXY();
    const rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
    rb.setTranslation({ x: pos.x / 100, y: pos.y / 100 }, true);
  };
  window.addEventListener("click", onClick);
  api.onStop(() => window.removeEventListener("click", onClick));
});
