/**
 * @name DLDUtils
 * @description Allows plugins to move characters without the server's permission
 * @author TheLazySquid
 * @version 0.3.8
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/DLDUtils.js
 * @needsLib Desync | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Desync.js
 * @gamemode dontLookDown
 * @isLibrary true
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

// libraries/DLDUtils/src/index.ts
var respawnHeight = 621.093;
var floorHeight = 638.37;
var lastCheckpointReached = 0;
var canRespawn = false;
api.net.onLoad(() => {
  const savestates = api.plugin("Savestates");
  if (savestates) {
    savestates.onStateLoaded((summit) => {
      if (typeof summit !== "number") return;
      lastCheckpointReached = summit;
      if (summit <= 1) canRespawn = false;
    });
  }
  api.net.room.state.session.gameSession.listen("phase", (phase) => {
    if (phase !== "results") return;
    canRespawn = false;
    lastCheckpointReached = 0;
  });
});
function cancelRespawn() {
  canRespawn = false;
}
var doLaserRespawn = true;
function setLaserRespawnEnabled(enabled) {
  doLaserRespawn = enabled;
}
function setLaserWarningEnabled(enabled) {
  doLaserRespawn = enabled;
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
    if (!doLaserRespawn || startImmunityActive) return;
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
        body.rigidBody.setTranslation(summitCoords[lastCheckpointReached], true);
        api.stores.me.isRespawning = true;
        setTimeout(() => api.stores.me.isRespawning = false, 1e3);
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
api.net.onLoad(() => {
  enable();
  const desync = GL.lib("Desync");
  desync.enable();
});
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
export {
  cancelRespawn,
  setLaserRespawnEnabled,
  setLaserWarningEnabled
};
