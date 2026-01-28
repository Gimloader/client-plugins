/**
 * @name PlayerCollision
 * @description Makes you collide with other players in 2d gamemodes
 * @author retrozy
 * @version 0.1.3
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/PlayerCollision.js
 * @webpage https://gimloader.github.io/plugins/playercollision
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js
 * @gamemode 2d
 * @changelog Actually ixed movement issue when host
 */

// plugins/PlayerCollision/src/index.ts
api.net.onLoad(async () => {
  const rapier = await new Promise((res) => {
    api.rewriter.exposeVar("App", {
      check: "this.device.parts.destroySpecificPart",
      find: /var (\S+)=Object.freeze\({__proto__:null/,
      callback: res
    });
  });
  const physics = api.stores.phaser.scene.worldManager.physics;
  const world = physics.world;
  const colliders = /* @__PURE__ */ new Map();
  function createCollider(id) {
    if (colliders.has(id)) return;
    const collider = world.createCollider(rapier.ColliderDesc.cuboid(0.32, 0.32));
    colliders.set(id, collider);
  }
  function removeCollider(id) {
    const collider = colliders.get(id);
    if (!collider) return;
    world.removeCollider(collider, true);
    colliders.delete(id);
  }
  api.onStop(
    api.net.room.state.characters.onAdd((char) => {
      if (char.id === api.stores.network.authId) return;
      createCollider(char.id);
      api.onStop(
        char.onRemove(() => removeCollider(char.id))
      );
    })
  );
  if (!api.net.isHost) {
    const { gameOwnerId } = api.stores.session;
    api.net.room.state.session.listen("phase", (phase) => {
      if (api.net.room.state.characters.get(gameOwnerId).teamId === "__SPECTATORS_TEAM" && phase === "game") {
        removeCollider(gameOwnerId);
      } else {
        createCollider(gameOwnerId);
      }
    });
  }
  api.patcher.before(physics, "physicsStep", () => {
    for (const [id, collider] of colliders) {
      const body = api.stores.phaser.scene.characterManager.characters.get(id)?.body;
      if (!body) return;
      collider.setTranslation({
        x: body.x / 100,
        y: body.y / 100
      });
    }
  });
  api.onStop(() => {
    for (const [id] of colliders) {
      removeCollider(id);
    }
  });
});
