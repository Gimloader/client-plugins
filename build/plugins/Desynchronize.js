/**
 * @name Desynchronize
 * @description Disables the client being snapped back by the server, others cannot see you move. Breaks most gamemodes.
 * @author TheLazySquid
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js
 * @webpage https://gimloader.github.io/plugins/desynchronize
 * @optionalLib Communication | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/Communication.js
 * @gamemode 2d
 * @changelog Added plugin sync setting to sync your position with other Desynchronize users
 */
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// plugins/Desynchronize/src/sync.ts
var offset = 2048;
var scale = 10;
function encodeOffset(x, y) {
  const xInt = Math.round(x * scale) + offset;
  const yInt = Math.round(y * scale) + offset;
  const cX = Math.max(0, Math.min(4095, xInt));
  const cY = Math.max(0, Math.min(4095, yInt));
  return cX << 12 | cY;
}
function decodeOffset(uint24) {
  const xInt = uint24 >> 12 & 4095;
  const yInt = uint24 & 4095;
  const x = (xInt - offset) / scale;
  const y = (yInt - offset) / scale;
  return { x, y };
}
var Sync = class {
  Comms = api.lib("Communication");
  comms = new this.Comms("Desynchronize");
  publicPosition = null;
  playerPositions = /* @__PURE__ */ new Map();
  rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
  sending = false;
  unsub;
  constructor() {
    this.unsub = api.patcher.after(api.stores.phaser.scene.worldManager.physics, "physicsStep", () => {
      if (!this.Comms.enabled || this.sending || !this.publicPosition) return;
      const translation = this.rb.translation();
      const xOffset = +(translation.x - this.publicPosition.x).toFixed(1);
      const yOffset = +(this.publicPosition.y - translation.y).toFixed(1);
      if (!xOffset && !yOffset) return;
      this.sending = true;
      this.publicPosition.x += xOffset;
      this.publicPosition.y -= yOffset;
      if (Math.abs(xOffset) > 204.7 || Math.abs(yOffset) > 204.7) {
        this.updatePublicPosition().then(() => this.sending = false);
      } else {
        this.comms.send(encodeOffset(xOffset, yOffset)).then(() => this.sending = false);
      }
    });
    if (this.Comms.enabled) {
      this.updatePublicPosition();
    }
    this.comms.onEnabledChanged(() => {
      if (!this.Comms.enabled) return;
      this.updatePublicPosition();
    });
    this.comms.onMessage((message, char) => {
      if (typeof message === "string") {
        const [x, y] = message.split(" ");
        if (!this.playerPositions.has(char.id)) this.updatePublicPosition();
        this.playerPositions.set(char.id, { x: +x / 100, y: +y / 100 });
      } else {
        const { x, y } = decodeOffset(message);
        const player2 = this.playerPositions.get(char.id);
        if (!player2) return;
        player2.x += x;
        player2.y -= y;
      }
      const player = this.playerPositions.get(char.id);
      if (!player) return;
      const movement = api.stores.phaser.scene.characterManager.characters.get(char.id)?.movement;
      if (!movement) return;
      movement.setTargetX(player.x * 100);
      movement.setTargetY(player.y * 100);
    });
  }
  async updatePublicPosition() {
    const translation = this.rb.translation();
    const publicX = +translation.x.toFixed(2);
    const publicY = +translation.y.toFixed(2);
    this.publicPosition = { x: publicX, y: publicY };
    await this.comms.send(`${this.publicPosition.x * 100} ${this.publicPosition.y * 100}`);
  }
  stop() {
    this.unsub();
    this.comms.destroy();
  }
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
  },
  {
    id: "pluginSync",
    type: "toggle",
    title: "Plugin Sync",
    description: "Syncs your position (nothing else) to other players with this plugin and setting on. This requires the optional Communication library to be installed."
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
var sync = null;
function stopSync() {
  sync?.stop();
  sync = null;
}
api.settings.listen("pluginSync", (enabled) => {
  if (enabled) {
    if (api.libs.isEnabled("Communication")) {
      api.net.onLoad(() => {
        sync ??= new Sync();
      });
    } else {
      api.settings.pluginSync = false;
      api.UI.showModal(
        document.createElement("div"),
        {
          title: "The Communication library is required for plugin sync.",
          closeOnBackgroundClick: true,
          style: "color: red"
        }
      );
    }
  } else {
    stopSync();
  }
}, true);
api.onStop(stopSync);
export {
  dld_exports as DLD
};
