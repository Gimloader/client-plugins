// biome-ignore-all lint: This file includes minified code
api.settings.create([
    {
        type: "toggle",
        id: "useOriginalPhysics",
        title: "Use Release Physics",
        description: "Modifies air movement to more closely match the physics from the original launch of platforming",
        default: false
    }
]);

api.settings.listen("useOriginalPhysics", (value: boolean) => {
    console.log("Updated to", value);
    if(!GL.platformerPhysics) return;
    if(value) {
        GL.platformerPhysics.movement.air = originalAirMovement;
    } else {
        GL.platformerPhysics.movement.air = defaultAirMovement;
    }
});

const defaultAirMovement = {
    accelerationSpeed: 0.08125,
    decelerationSpeed: 0.08125,
    maxAccelerationSpeed: 0.14130434782608697
};
const originalAirMovement = {
    accelerationSpeed: 0.121875,
    decelerationSpeed: 0.08125,
    maxAccelerationSpeed: 0.155
};

api.net.onLoad(() => {
    if(api.settings.useOriginalPhysics) {
        GL.platformerPhysics.movement.air = originalAirMovement;
    }
});

let calcGravity: ((id: string) => number) | null = null;
const calcGravCb = api.rewriter.createShared("CalculateGravity", (func: (id: string) => number) => {
    calcGravity = func;
});

api.rewriter.addParseHook("App", (code) => {
    const index = code.indexOf("physics.state.forces.some");
    if(index === -1) return code;

    const start = code.lastIndexOf(",", index) + 1;
    const end = code.indexOf("=", start);
    const name = code.slice(start, end);
    code += `${calcGravCb}?.(${name});`;

    return code;
});

const wrapCalcMovementVelocity = api.rewriter.createShared("WrapCalcMovmentVel", (func: Function) => {
    // The code used in this has been taken from minified Gimkit code and therefore is nearly unreadable.
    var n = { default: api.stores },
        a = { default: { normal: 310 } },
        I = {
            PhysicsConstants: {
                tickRate: 12,
                debug: !1,
                skipTilesDebug: !1
            }
        };

    const h = (A: any, t: any) => {
        let e = 0,
            i = 0;
        const s = null == t ? void 0 : t.angle,
            g = null !== s && (s < 90 || s > 270) ? "right" : null !== s && s > 90 && s < 270 ? "left" : "none",
            C = n.default.me.movementSpeed / a.default.normal;
        let h = GL.platformerPhysics.platformerGroundSpeed * C;
        if(A.physics.state.jump.isJumping) {
            const t = Math.min(GL.platformerPhysics.jump.airSpeedMinimum.maxSpeed, h * GL.platformerPhysics.jump.airSpeedMinimum.multiplier);
            h = Math.max(t, A.physics.state.jump.xVelocityAtJumpStart);
        }
        let l = 0;
        "left" === g ? l = -h : "right" === g && (l = h);
        const B = 0 !== l;
        if(
            g !== A.physics.state.movement.direction
            && (B && 0 !== A.physics.state.movement.xVelocity && (A.physics.state.movement.xVelocity = 0), A.physics.state.movement.accelerationTicks = 0, A.physics.state.movement.direction = g),
                A.physics.state.movement.xVelocity !== l
        ) {
            A.physics.state.movement.accelerationTicks += 1;
            let t = 0,
                i = 0;
            A.physics.state.grounded
                ? B ? (t = GL.platformerPhysics.movement.ground.accelerationSpeed, i = GL.platformerPhysics.movement.ground.maxAccelerationSpeed) : t = GL.platformerPhysics.movement.ground.decelerationSpeed
                : B
                ? (t = GL.platformerPhysics.movement.air.accelerationSpeed, i = GL.platformerPhysics.movement.air.maxAccelerationSpeed)
                : t = GL.platformerPhysics.movement.air.decelerationSpeed;
            const s = 20 / I.PhysicsConstants.tickRate;
            t *= A.physics.state.movement.accelerationTicks * s,
                i && (t = Math.min(i, t)),
                e = l > A.physics.state.movement.xVelocity
                    ? Phaser.Math.Clamp(A.physics.state.movement.xVelocity + t, A.physics.state.movement.xVelocity, l)
                    : Phaser.Math.Clamp(A.physics.state.movement.xVelocity - t, l, A.physics.state.movement.xVelocity);
        } else e = l;
        return A.physics.state.grounded && A.physics.state.velocity.y > GL.platformerPhysics.platformerGroundSpeed * C && Math.sign(e) === Math.sign(A.physics.state.velocity.x) && (e = A.physics.state.velocity.x),
            A.physics.state.movement.xVelocity = e,
            A.physics.state.gravity = calcGravity?.(A.id),
            i += A.physics.state.gravity,
            A.physics.state.forces.forEach((A: any, _t: any) => {
                const s = A.ticks[0];
                s && (e += s.x, i += s.y), A.ticks.shift();
            }),
            {
                x: e,
                y: i
            };
    };

    return function(this: any) {
        if(GL.platformerPhysics && calcGravity && GL.plugins.isEnabled("BringBackBoosts")) {
            return h(arguments[0], arguments[1]);
        } else {
            return func.apply(this, arguments);
        }
    };
});

api.rewriter.addParseHook("App", (code) => {
    const index = code.indexOf("g.physics.state.jump.xVelocityAtJumpStart),");
    if(index === -1) return code;

    const start = code.lastIndexOf("(", code.lastIndexOf("=>", index));
    const end = code.indexOf("}}", code.indexOf("y:", index)) + 2;
    const func = code.slice(start, end);
    code = code.slice(0, start) + `(${wrapCalcMovementVelocity} ?? (v => v))(${func})` + code.slice(end);

    return code;
});
