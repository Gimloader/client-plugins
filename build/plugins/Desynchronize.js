/**
 * @name Desynchronize
 * @description Disables the client being snapped back by the server, others cannot see you move. Breaks most gamemodes.
 * @author TheLazySquid
 * @version 0.1.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js
 * @webpage https://gimloader.github.io/plugins/desynchronize
 * @gamemode 2d
 * @changelog Added gamemode header for 2d
 */
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// plugins/Desynchronize/src/dld.ts
var dld_exports = {};
__export(dld_exports, {
  cancelRespawn: () => cancelRespawn,
  onSummitTeleport: () => onSummitTeleport
});

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

// plugins/Desynchronize/src/dld.ts
var respawnHeight = 621.093;
var floorHeight = 638.37;
var lastCheckpointReached = 0;
var canRespawn = false;
api.net.onLoad(() => {
  api.net.room.state.session.gameSession.listen("phase", (phase) => {
    if (phase !== "results") return;
    canRespawn = false;
    lastCheckpointReached = 0;
  });
});
function onSummitTeleport(summit) {
  lastCheckpointReached = summit;
  if (summit <= 1) canRespawn = false;
}
function cancelRespawn() {
  canRespawn = false;
}
var enable = () => {
  const states = api.stores.world.devices.states;
  const body = api.stores.phaser.mainCharacter.physics.getBody();
  const shape = body.collider.shape;
  let hurtFrames = 0;
  const maxHurtFrames = 1;
  const physics = api.stores.phaser.scene.worldManager.physics;
  api.patcher.before(physics, "physicsStep", () => {
    if (api.stores.me.movementSpeed === 0) api.stores.me.movementSpeed = 310;
  });
  let wasOnLastFrame = false;
  let startImmunityActive = false;
  api.patcher.after(physics, "physicsStep", () => {
    if (api.net.room.state.session.gameSession.phase === "results") return;
    if (startImmunityActive) return;
    const devicesInView = api.stores.phaser.scene.worldManager.devices.devicesInView;
    const lasers = devicesInView.filter((d) => d.laser);
    if (lasers.length === 0) return;
    const lasersOn = states.get(lasers[0].id)?.properties.get("GLOBAL_active");
    if (!wasOnLastFrame && lasersOn) {
      startImmunityActive = true;
      setTimeout(() => startImmunityActive = false, 360);
    }
    wasOnLastFrame = lasersOn;
    if (!lasersOn || startImmunityActive) return;
    const translation = body.rigidBody.translation();
    const topLeft = {
      x: (translation.x - shape.radius) * 100,
      y: (translation.y - shape.halfHeight - shape.radius) * 100
    };
    const bottomRight = {
      x: (translation.x + shape.radius) * 100,
      y: (translation.y + shape.halfHeight + shape.radius) * 100
    };
    let hitLaser = false;
    for (const laser of lasers) {
      if (laser.dots.length <= 1) continue;
      const start = {
        x: laser.dots[0].options.x + laser.x,
        y: laser.dots[0].options.y + laser.y
      };
      const end = {
        x: laser.dots.at(-1).options.x + laser.x,
        y: laser.dots.at(-1).options.y + laser.y
      };
      if (boundingBoxOverlap(start, end, topLeft, bottomRight)) {
        hitLaser = true;
        break;
      }
    }
    if (hitLaser) {
      hurtFrames++;
      if (hurtFrames >= maxHurtFrames) {
        hurtFrames = 0;
        onLaserHit(body.rigidBody);
      }
    } else {
      hurtFrames = 0;
    }
    for (let i = lastCheckpointReached + 1; i < summitCoords.length; i++) {
      const checkpoint = summitCoords[i];
      const summitStart = {
        x: checkpoint.x * 100,
        y: checkpoint.y * 100 + 100
      };
      const summitEnd = {
        x: checkpoint.x * 100 + 100,
        y: checkpoint.y * 100
      };
      if (boundingBoxOverlap(summitStart, summitEnd, topLeft, bottomRight)) {
        console.log("Reached Checkpoint", i);
        lastCheckpointReached = i;
        break;
      }
    }
    if (translation.y < respawnHeight) {
      canRespawn = true;
    }
    if (canRespawn && translation.y > floorHeight) {
      canRespawn = false;
      setTimeout(() => {
        body.rigidBody.setTranslation(summitCoords[lastCheckpointReached], true);
        api.stores.me.isRespawning = true;
        setTimeout(() => api.stores.me.isRespawning = false, 1e3);
      }, 300);
    }
  });
  body.rigidBody.setTranslation({ x: 33.87, y: 638.38 }, true);
  for (const id of physics.bodies.staticBodies) {
    physics.bodies.activeBodies.enableBody(id);
  }
  physics.bodies.activeBodies.disableBody = () => {
  };
};
api.net.onLoad((_, gamemode) => {
  if (gamemode !== "dontlookdown") return;
  enable();
});
function onLaserHit(rb) {
  switch (api.settings.dldLaserAction) {
    case "respawn":
      rb.setTranslation(summitCoords[lastCheckpointReached], true);
      api.stores.me.isRespawning = true;
      setTimeout(() => api.stores.me.isRespawning = false, 1e3);
      break;
    case "warn":
      api.notification.warning({
        message: "Character ran into laser"
      });
      break;
  }
}
function boundingBoxOverlap(start, end, topLeft, bottomRight) {
  return lineIntersects(start, end, topLeft, { x: bottomRight.x, y: topLeft.y }) || lineIntersects(start, end, topLeft, { x: topLeft.x, y: bottomRight.y }) || lineIntersects(start, end, { x: bottomRight.x, y: topLeft.y }, bottomRight) || lineIntersects(start, end, { x: topLeft.x, y: bottomRight.y }, bottomRight);
}
function lineIntersects(start1, end1, start2, end2) {
  const denominator = (end1.x - start1.x) * (end2.y - start2.y) - (end1.y - start1.y) * (end2.x - start2.x);
  const numerator1 = (start1.y - start2.y) * (end2.x - start2.x) - (start1.x - start2.x) * (end2.y - start2.y);
  const numerator2 = (start1.y - start2.y) * (end1.x - start1.x) - (start1.x - start2.x) * (end1.y - start1.y);
  if (denominator === 0) return numerator1 === 0 && numerator2 === 0;
  const r = numerator1 / denominator;
  const s = numerator2 / denominator;
  return r >= 0 && r <= 1 && (s >= 0 && s <= 1);
}

// plugins/Desynchronize/src/index.ts
api.settings.create([
  {
    id: "dldLaserAction",
    type: "dropdown",
    options: [
      { label: "Respawn Character", value: "respawn" },
      { label: "Show Warning", value: "warn" },
      { label: "Ignore", value: "ignore" }
    ],
    title: "On hitting a laser in DLD",
    description: "What action should be taken when touching a laser in DLD?",
    default: "warn"
  }
]);
api.net.onLoad(() => {
  let allowNext = false;
  let firstPhase = true;
  api.onStop(api.net.room.state.session.listen("phase", () => {
    if (firstPhase) {
      firstPhase = false;
      return;
    }
    allowNext = true;
  }));
  api.net.on("PHYSICS_STATE", (_, editFn) => {
    if (allowNext) {
      allowNext = false;
      return;
    }
    editFn(null);
  });
  api.net.on("send:INPUT", (_, editFn) => editFn(null));
});
export {
  dld_exports as DLD
};
