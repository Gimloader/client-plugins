// biome-ignore-all lint: This file includes minified code

import { getSection, replaceSection } from "$shared/rewritingUtils";

const settings = api.settings.create([
    {
        type: "toggle",
        id: "useOriginalPhysics",
        title: "Use Release Physics",
        description: "Modifies air movement to more closely match the physics from the original launch of platforming",
        default: false
    }
]);

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
    settings.listen("useOriginalPhysics", (usingOriginalPhysics) => {
        if(!GL.platformerPhysics) return;
        GL.platformerPhysics.movement.air = usingOriginalPhysics ? originalAirMovement : defaultAirMovement;
    }, true);
});

type CalcGravity = (id: string) => number;
let calcGravity: CalcGravity | null = null;

const calcMovementVelocity = api.rewriter.createShared("CalcMovmentVel", (A: any, t: any) => {
    var n = { default: api.stores },
        a = { default: { normal: 310 } },
        I = {
            PhysicsConstants: {
                tickRate: 12,
                debug: !1,
                skipTilesDebug: !1
            }
        };

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
});

function getMovementVelocityCode(code: string) {
    const startIdentifier = ".physics.state.gravity+=";
    const start = code.indexOf(
        "=",
        code.indexOf(startIdentifier) + startIdentifier.length
    ) + 1;

    const end = code.indexOf(
        ",",
        code.indexOf("y:", start) + 2
    );

    return code.slice(start, end);
}

function getApplyPhysicsInputCode(code: string) {
    const startIdentifier = ".me.classDesigner.lastActivatedClassDeviceId)},";
    const start = code.indexOf(
        "=",
        code.indexOf(startIdentifier) + startIdentifier.length
    ) + 1;
    const end = code.indexOf("})}},", start) + 4;
    return code.slice(start, end);
}

api.rewriter.runInScope("App", (code, run) => {
    if(!code.includes(".physics.state.jump.xVelocityAtJumpStart),")) return;

    const name = getSection(code, ".overrideYTravelUntilMaxGravity?#coyoteJumpLimitMS#,@=");
    calcGravity = run(name) as unknown as CalcGravity;

    let padMovementVelocityCode = getMovementVelocityCode(code);
    padMovementVelocityCode = replaceSection(padMovementVelocityCode, "()?@(", calcMovementVelocity);

    let applyPhysicsInputCode = getApplyPhysicsInputCode(code);
    applyPhysicsInputCode = replaceSection(applyPhysicsInputCode, "jumpKeyPressed#.jump#=@(", `(${padMovementVelocityCode})`);

    let preUpdateCode = getSection(code, "this.preUpdate=@,this.postUpdate");
    preUpdateCode = replaceSection(preUpdateCode, "+=1,@(", `(${applyPhysicsInputCode})`);
    preUpdateCode = preUpdateCode.replace("()=>", "function()");
    const preUpdate = run(`(${preUpdateCode})`) as unknown as () => void;

    api.net.onLoad(() => {
        const physics = api.stores.phaser.mainCharacter.physics;
        const originalPreUpdate = physics.preUpdate;

        physics.preUpdate = preUpdate;

        api.onStop(() => {
            physics.preUpdate = originalPreUpdate;
        });
    });

    return true;
});
