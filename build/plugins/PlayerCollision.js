/**
 * @name PlayerCollision
 * @description Makes you collide with other players in 2d gamemodes
 * @author retrozy
 * @version 0.2.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/PlayerCollision.js
 * @webpage https://gimloader.github.io/plugins/PlayerCollision
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Desynchronize.js
 * @gamemode 2d
 * @changelog Updated webpage url
 */

// plugins/PlayerCollision/src/index.ts
var settings = api.settings.create([
  {
    id: "collidePlayers",
    type: "toggle",
    title: "Collide with other players",
    default: true
  },
  {
    id: "collideSentries",
    type: "toggle",
    title: "Collide with sentries",
    default: true
  }
]);
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
  const myId = api.stores.network.authId;
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
  settings.listen("collidePlayers", (enabled) => {
    for (const [id, char] of api.stores.phaser.scene.characterManager.characters) {
      if (char.type !== "player" || char.id === myId) continue;
      if (enabled) {
        createCollider(id);
      } else {
        removeCollider(id);
      }
    }
  });
  settings.listen("collideSentries", (enabled) => {
    for (const [id, { type }] of api.stores.phaser.scene.characterManager.characters) {
      if (type !== "sentry") continue;
      if (enabled) {
        createCollider(id);
      } else {
        removeCollider(id);
      }
    }
  });
  api.onStop(
    api.net.room.state.characters.onAdd((char) => {
      if (char.id === myId) return;
      if (char.type === "player" && !settings.collidePlayers) return;
      if (char.type === "sentry" && !settings.collideSentries) return;
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
