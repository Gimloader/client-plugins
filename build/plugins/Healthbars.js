/**
 * @name Healthbars
 * @description Adds healthbars underneath players' names
 * @author TheLazySquid
 * @version 0.1.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Healthbars.js
 * @webpage https://gimloader.github.io/plugins/healthbars
 * @gamemode 2d
 */

// plugins/Healthbars/src/index.ts
api.net.onLoad(() => {
  const options = JSON.parse(api.stores.world.mapOptionsJSON);
  if (!options.showHealthAndShield || options.healthMode != "healthAndShield") return;
  const { scene } = api.stores.phaser;
  const width = 130;
  const blue = 6853868;
  const red = 16711680;
  const gray = 5592405;
  const addHealthbar = (character) => {
    const bg = scene.add.rectangle(0, 0, width, 10, gray);
    const health = scene.add.rectangle(0, 0, width, 10, red);
    const shield = scene.add.rectangle(0, 0, width, 10, blue);
    shield.setStrokeStyle(2, 16777215);
    const stateChar = api.net.room.state.characters.get(character.id);
    const hp = stateChar.health;
    const stopUpdate = api.patcher.after(character.nametag, "update", () => {
      let { x, y, depth } = character.nametag.tag;
      y += 22;
      bg.visible = health.visible = shield.visible = !stateChar.isRespawning;
      health.width = hp.health / hp.maxHealth * width;
      shield.width = hp.shield / hp.maxShield * width;
      bg.setDepth(depth);
      bg.x = x;
      bg.y = y;
      health.setDepth(depth);
      health.x = x;
      health.y = y;
      shield.setDepth(depth);
      shield.x = x;
      shield.y = y;
    });
    const stopDestroy = api.patcher.after(character, "destroy", destroy);
    api.onStop(destroy);
    function destroy() {
      bg.destroy();
      health.destroy();
      shield.destroy();
      stopUpdate();
      stopDestroy();
    }
  };
  api.patcher.after(scene.characterManager, "addCharacter", (_, __, character) => {
    addHealthbar(character);
  });
  for (const character of scene.characterManager.characters.values()) {
    addHealthbar(character);
  }
});
