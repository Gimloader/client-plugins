/**
 * @name BringBackBoosts
 * @description Restores boosts in Don't Look Down. Will cause you to desync, so others cannot see you move.
 * @author TheLazySquid
 * @version 0.6.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/BringBackBoosts.js
 * @webpage https://gimloader.github.io/plugins/BringBackBoosts
 * @reloadRequired ingame
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Desynchronize.js
 * @hasSettings true
 * @gamemode dontLookDown
 * @changelog Updated webpage url
 */

// plugins/BringBackBoosts/src/index.ts
var settings = api.settings.create([
  {
    type: "toggle",
    id: "useOriginalPhysics",
    title: "Use Release Physics",
    description: "Modifies air movement to more closely match the physics from the original launch of platforming",
    default: false
  }
]);
settings.listen("useOriginalPhysics", (value) => {
  console.log("Updated to", value);
  if (!GL.platformerPhysics) return;
  if (value) {
    GL.platformerPhysics.movement.air = originalAirMovement;
  } else {
    GL.platformerPhysics.movement.air = defaultAirMovement;
  }
});
var defaultAirMovement = {
  accelerationSpeed: 0.08125,
  decelerationSpeed: 0.08125,
  maxAccelerationSpeed: 0.14130434782608697
};
var originalAirMovement = {
  accelerationSpeed: 0.121875,
  decelerationSpeed: 0.08125,
  maxAccelerationSpeed: 0.155
};
api.net.onLoad(() => {
  if (settings.useOriginalPhysics) {
    GL.platformerPhysics.movement.air = originalAirMovement;
  }
});
var calcGravity = null;
var calcGravCb = api.rewriter.createShared("CalculateGravity", (func) => {
  calcGravity = func;
});
api.rewriter.addParseHook("App", (code) => {
  const index = code.indexOf("physics.state.forces.some");
  if (index === -1) return code;
  const start = code.lastIndexOf(",", index) + 1;
  const end = code.indexOf("=", start);
  const name = code.slice(start, end);
  code += `${calcGravCb}?.(${name});`;
  return code;
});
var wrapCalcMovementVelocity = api.rewriter.createShared("WrapCalcMovmentVel", (func) => {
  var n = { default: api.stores }, a = { default: { normal: 310 } }, I = {
    PhysicsConstants: {
      tickRate: 12,
      debug: false,
      skipTilesDebug: false
    }
  };
  const h = (A, t) => {
    let e = 0, i = 0;
    const s = null == t ? void 0 : t.angle, g = null !== s && (s < 90 || s > 270) ? "right" : null !== s && s > 90 && s < 270 ? "left" : "none", C = n.default.me.movementSpeed / a.default.normal;
    let h2 = GL.platformerPhysics.platformerGroundSpeed * C;
    if (A.physics.state.jump.isJumping) {
      const t2 = Math.min(GL.platformerPhysics.jump.airSpeedMinimum.maxSpeed, h2 * GL.platformerPhysics.jump.airSpeedMinimum.multiplier);
      h2 = Math.max(t2, A.physics.state.jump.xVelocityAtJumpStart);
    }
    let l = 0;
    "left" === g ? l = -h2 : "right" === g && (l = h2);
    const B = 0 !== l;
    if (g !== A.physics.state.movement.direction && (B && 0 !== A.physics.state.movement.xVelocity && (A.physics.state.movement.xVelocity = 0), A.physics.state.movement.accelerationTicks = 0, A.physics.state.movement.direction = g), A.physics.state.movement.xVelocity !== l) {
      A.physics.state.movement.accelerationTicks += 1;
      let t2 = 0, i2 = 0;
      A.physics.state.grounded ? B ? (t2 = GL.platformerPhysics.movement.ground.accelerationSpeed, i2 = GL.platformerPhysics.movement.ground.maxAccelerationSpeed) : t2 = GL.platformerPhysics.movement.ground.decelerationSpeed : B ? (t2 = GL.platformerPhysics.movement.air.accelerationSpeed, i2 = GL.platformerPhysics.movement.air.maxAccelerationSpeed) : t2 = GL.platformerPhysics.movement.air.decelerationSpeed;
      const s2 = 20 / I.PhysicsConstants.tickRate;
      t2 *= A.physics.state.movement.accelerationTicks * s2, i2 && (t2 = Math.min(i2, t2)), e = l > A.physics.state.movement.xVelocity ? Phaser.Math.Clamp(A.physics.state.movement.xVelocity + t2, A.physics.state.movement.xVelocity, l) : Phaser.Math.Clamp(A.physics.state.movement.xVelocity - t2, l, A.physics.state.movement.xVelocity);
    } else e = l;
    return A.physics.state.grounded && A.physics.state.velocity.y > GL.platformerPhysics.platformerGroundSpeed * C && Math.sign(e) === Math.sign(A.physics.state.velocity.x) && (e = A.physics.state.velocity.x), A.physics.state.movement.xVelocity = e, A.physics.state.gravity = calcGravity?.(A.id), i += A.physics.state.gravity, A.physics.state.forces.forEach((A2, _t) => {
      const s2 = A2.ticks[0];
      s2 && (e += s2.x, i += s2.y), A2.ticks.shift();
    }), {
      x: e,
      y: i
    };
  };
  return function() {
    if (GL.platformerPhysics && calcGravity && GL.plugins.isEnabled("BringBackBoosts")) {
      return h(arguments[0], arguments[1]);
    } else {
      return func.apply(this, arguments);
    }
  };
});
api.rewriter.addParseHook("App", (code) => {
  const index = code.indexOf("g.physics.state.jump.xVelocityAtJumpStart),");
  if (index === -1) return code;
  const start = code.lastIndexOf("(", code.lastIndexOf("=>", index));
  const end = code.indexOf("}}", code.indexOf("y:", index)) + 2;
  const func = code.slice(start, end);
  code = code.slice(0, start) + `(${wrapCalcMovementVelocity} ?? (v => v))(${func})` + code.slice(end);
  return code;
});
