// biome-ignore-all lint: This file includes minified code
import type * as RapierType from "@dimforge/rapier2d-compat";
import { ce, defaultAirMovement, gi, hc, lo, mapOptions, originalAirMovement, PI, q5, se, we, Y5 } from "./consts";

const settings = api.settings.create([
    {
        type: "dropdown",
        id: "version",
        title: "Version of physics to use",
        description: "The original physics are just an approximation since the code has been lost",
        options: [
            { label: "Knockback Patch", value: "knockback" },
            { label: "Creative Patch", value: "creative" },
            { label: "Original", value: "original" }
        ]
    }
]);

settings.listen("version", (version) => {
    if(version === "original") we.movement.air = originalAirMovement;
    else we.movement.air = defaultAirMovement;
}, true);

let RAPIER: typeof RapierType;

api.rewriter.exposeVar("App", {
    check: "get RigidBodyType()",
    find: /(\w{1,3})=Object\.freeze\({__proto__:null,version/,
    callback: (rapier) => RAPIER = rapier
});

api.net.onLoad(() => {
    const scene = api.stores.phaser.scene;

    api.stores.phaser.mainCharacter.physics.state = {
        "gravity": 0.001,
        "velocity": {
            "x": 0,
            "y": 0
        },
        "movement": {
            "direction": "none",
            "xVelocity": 0,
            "accelerationTicks": 0
        },
        "jump": {
            "isJumping": false,
            "jumpsLeft": 2,
            "jumpCounter": 0,
            "jumpTicks": 118,
            "xVelocityAtJumpStart": 0
        },
        "forces": [],
        "grounded": true,
        "groundedTicks": 0,
        "lastGroundedAngle": 0
    };

    api.patcher.instead(api.stores.phaser.mainCharacter.physics, "sendToServer", () => {});

    api.patcher.instead(api.stores.phaser.mainCharacter.physics, "preUpdate", (thisVal) => {
        thisVal.prevState = {
            ...thisVal.state,
            jump: {
                ...thisVal.state.jump
            }
        },
            thisVal.tickInput = scene.inputManager.getPhysicsInput(),
            thisVal.currentPacketId += 1,
            sK({
                characterId: thisVal.character.id,
                input: thisVal.tickInput
            });
    });

    const k = api.stores;
    const WA = (id: string) => scene.characterManager.characters.get(id);
    const ee = () => api.stores.network.authId;
    const Ve = () => scene.worldManager.physics;
    const _i = (id: string) => scene.worldManager.devices.getDeviceById(id);
    const vI = () => api.stores.network.room;
    const Fe = () => api.stores.session.mapStyle === "platformer";
    const wr2 = () => api.stores.session.phase === "preGame";
    const Fr = () => api.stores.session.phase === "game";
    const vh = () => wr2() && !k.session.duringTransition || Fr() && k.session.duringTransition && !k.me.isRespawning;
    const dh = () => api.stores.session.version === "published";
    const wr = () => Fe() && !dh() && vh() && k.me.editing.preferences.topDownControlsActive;
    const Si = (n: number) => n * ce.worldScale;
    const Zg = (n: number) => n / ce.worldScale;
    const AU = () => k.session.mapStyle === "topDown";

    function sK(g: any) {
        var r;
        let t = WA(g.characterId);
        if(!t) {
            return;
        }
        let e = Fe() && !wr(),
            I = t.physics.state.grounded;
        g.reconciliation || (i9({
            characterId: t.id
        }),
            X5({
                characterId: t.id
            })),
            V5(t),
            t9({
                characterId: t.id
            }),
            A9({
                characterId: t.id
            }),
            Iy({
                character: t
            }),
            e && _5({
                characterId: t.id,
                jumpKeyPressed: (r = g.input) == null ? void 0 : r.jump
            });
        let o = P5(g),
            s = K5({
                characterId: t.id,
                velocity: o
            });
        if(s) api.stores.phaser.mainCharacter.flip.isFlipped = s.x < 0;
        if(
            t.physics.state.velocity = s ?? {
                x: 0,
                y: 0
            }, !!s
        ) {
            if(e) {
                let B = b5({
                    characterId: t.id
                });
                if(!B) {
                    return;
                }
                let { headCollisions: E, groundCollisions: n, slidingCollisions: Q, numOfAllCollisions: l } = B,
                    c = U5({
                        characterId: t.id,
                        groundCollisions: n,
                        numOfAllCollisions: l
                    }),
                    h = L5({
                        characterId: t.id,
                        groundCollisions: n,
                        isGrounded: c,
                        slideCollisions: Q
                    });
                J5({
                    characterId: t.id,
                    isGrounded: c,
                    isHittingHead: E.length > 0,
                    groundedRotation: h,
                    wasGrounded: I
                });
            }
            R5({
                characterId: t.id,
                movement: s,
                velocity: o
            });
        }
    }

    function i9(g: any) {
        let { characterId: t } = g;
        if(t !== ee()) {
            return;
        }
        let e = WA(t);
        e && e.physics.lastClassDeviceActivationId !== k.me.classDesigner.lastClassDeviceActivationId
            && (e.physics.lastClassDeviceActivationId = k.me.classDesigner.lastClassDeviceActivationId, k.me.classDesigner.activeClassDeviceId = k.me.classDesigner.lastActivatedClassDeviceId);
    }

    function X5(g: any) {
        let { characterId: t } = g,
            e = WA(t);
        if(!e || e.physics.lastTerrainUpdateId === k.world.terrain.currentTerrainUpdateId) {
            return;
        }
        let I = e.physics.getBody();
        for(let o = e.physics.lastTerrainUpdateId + 1; o <= k.world.terrain.currentTerrainUpdateId; o++) {
            let s = k.world.terrain.queuedTiles.get(o);
            s && s.removedBodyIds.forEach(r => {
                I.character.ignoredTileBodies.add(r);
            });
        }
        e.physics.lastTerrainUpdateId = k.world.terrain.currentTerrainUpdateId;
    }

    function V5(g: any) {
        g.physics.state.forces = g.physics.state.forces.filter((t: any) => {
            var e, I;
            return !(!((e = t.ticks) != null && e.length) || (I = t == null ? void 0 : t.disableFlags) != null && I.length && t.disableFlags.includes("grounded") && g.physics.state.grounded);
        });
    }

    function t9(g: any) {
        let { characterId: t } = g,
            e = WA(t);
        if(!e) {
            return;
        }
        let I = new Set(),
            o = Date.now();
        e.physics.projectileHitForcesHistory.forEach((s, r) => {
            s + 1e3 > o || I.add(r);
        }),
            I.forEach((s: any) => {
                e.physics.projectileHitForcesHistory.delete(s);
            });
    }

    function A9(g: any) {
        let { characterId: t } = g;
        if(t !== ee()) {
            return;
        }
        let e = WA(t);
        e && (e.physics.projectileHitForcesQueue.forEach(I => {
            e.physics.projectileHitForcesHistory.has(I) || z5({
                characterId: t,
                projectileId: I
            });
        }),
            e.physics.projectileHitForcesQueue.clear());
    }

    function z5(g: any) {
        let t = scene.worldManager.projectiles.projectileJSON.get(g.projectileId);
        if(!t) {
            return;
        }
        let e = WA(g.characterId);
        if(!e || e.physics.projectileHitForcesHistory.has(t.id)) {
            return;
        }
        e.physics.projectileHitForcesHistory.set(t.id, Date.now()), e.physics.justAppliedProjectileHitForces.add(t.id);
        let I = Z5({
            projectile: t,
            character: e
        });
        lJ({
            force: {
                id: t.id,
                ticks: I,
                disableFlags: ["grounded"],
                type: "hit"
            },
            character: e
        }), e.physics.state.gravity = 0;
    }

    function Z5(g: any) {
        let { projectile: t, character: e } = g,
            I = {
                x: t.end.x,
                y: t.end.y
            };
        let o = Phaser.Math.Angle.Normalize(Phaser.Math.Angle.Between(t.start.x, t.start.y, I.x, I.y));
        e.physics.state.grounded && Fe()
            && (lo.platformerGrounded.notWhenWithin.some(([E, n]) => o > E && o < n) || (o > PI / 2 && o < 3 * PI / 2 ? o = lo.platformerGrounded.leftAngle : o = lo.platformerGrounded.rightAngle));
        let s = Math.min(lo.maximumForce, lo.initialForceFactor * (t.damage + k.me.health.fragility));
        let r = [];
        for(; s > lo.minimumForce;) {
            r.push({
                x: Math.cos(o) * Math.min(lo.maximumTickForce, s),
                y: Math.sin(o) * Math.min(lo.maximumTickForce, s)
            }), s *= lo.forceTickMultiplier;
        }
        return r;
    }

    function lJ(g: any) {
        let { force: t, character: e } = g;
        hJ({
            forceId: t.id,
            character: e
        }),
            t.type && (e.physics.state.forces = e.physics.state.forces.filter((I: any) => I.type !== t.type)),
            e.physics.state.forces.push(t);
    }

    function hJ(g: any) {
        let { forceId: t, character: e } = g;
        e.physics.state.forces = e.physics.state.forces.filter((I: any) => I.id !== t);
    }

    function Iy(g: any) {
        let { character: t } = g,
            e = t.physics.getBody();
        if(!e || !e.character) {
            return;
        }
        let I = e.character.ignoredStaticBodies;
        if(!I.size && !g.reset) {
            return;
        }
        let o = new Set(),
            s = Lr(t.id),
            { bodies: r } = Ve();
        Ve().world.intersectionsWithShape(e.rigidBody.translation(), 0, new RAPIER.Capsule(s.height, s.radius), (B: any) => {
            var l;
            let E = B.parent().userData,
                n = E == null ? void 0 : E.id,
                Q = r.find(n) as any;
            return Q != null && Q.character || (l = Q == null ? void 0 : Q.terrain) != null && l.removed || n && (g.reset || I.has(n)) && o.add(n), !0;
        }), e.character.ignoredStaticBodies = o;
    }

    function Lr(g: any) {
        let t = scene.characterManager.characters.get(g),
            e = (t == null ? void 0 : t.scale.baseScale) ?? 1;
        return Fe()
            ? {
                height: we.capsule.platformer.height * e,
                radius: we.capsule.platformer.radius * e,
                angle: we.capsule.platformer.angle
            }
            : {
                height: we.capsule.topDown.height * e,
                radius: we.capsule.topDown.radius * e,
                angle: we.capsule.topDown.angle
            };
    }

    function _5(g: any) {
        let { characterId: t, jumpKeyPressed: e } = g,
            I = WA(t);
        if(!I || (I.physics.state.jump.actuallyJumped = !1, I.physics.state.jump.jumpTicks += 1, e === void 0)) {
            return;
        }
        if(I.physics.state.grounded) {
            I.physics.state.jump.isJumping = !1;
            let { maxJumps: r } = dJ({
                characterId: I.id
            });
            I.physics.state.jump.jumpsLeft = r, I.physics.state.jump.jumpCounter = 0;
        }
        let o = k.me.movementSpeed / hc.normal,
            s = we.topDownBaseSpeed * o;
        if(e && I.physics.state.jump.jumpsLeft > 0 && I.physics.state.jump.jumpTicks > q5 && s > 0) {
            let r = !I.physics.state.grounded && I.physics.state.jump.jumpCounter === 0 && I.physics.state.groundedTicks < Y5,
                B = v5(I, r);
            lJ({
                character: I,
                force: {
                    id: "jump",
                    ticks: B
                }
            }),
                I.physics.state.jump.isJumping = !0,
                I.physics.state.jump.jumpsLeft -= 1,
                I.physics.state.jump.jumpTicks = 0,
                I.physics.state.jump.actuallyJumped = !0,
                r && (I.physics.state.jump.jumpsLeft += 1),
                I.physics.state.jump.jumpCounter += 1,
                I.physics.state.jump.xVelocityAtJumpStart = Math.abs(I.physics.state.velocity.x),
                I.isMain /* && rv() PLAY JUMP SOUND */;
            return;
        }
    }

    function dJ(g: any) {
        let { characterId: t } = g,
            e = uJ({
                characterId: t
            }),
            o = e != null && e.overrideJumpHeight ? e.jumpHeight ?? mapOptions.jumpHeight : mapOptions.jumpHeight,
            s = e != null && e.overrideJumpDurationMS ? e.jumpDurationMS ?? mapOptions.jumpDurationMS : mapOptions.jumpDurationMS,
            r = e != null && e.overrideJumpHangTimeMS ? e.jumpHangTimeMS ?? mapOptions.jumpHangTimeMS : mapOptions.jumpHangTimeMS,
            B = e != null && e.overrideSubsequentJumpMultiplier ? e.subsequentJumpMultiplier ?? mapOptions.subsequentJumpMultiplier : mapOptions.subsequentJumpMultiplier,
            E = e != null && e.overrideMaxJumps ? e.maxJumps ?? mapOptions.maxJumps : mapOptions.maxJumps;
        return {
            jumpHeight: o,
            jumpDurationMS: s,
            jumpHangTimeMS: r,
            subsequentJumpMultiplier: B,
            maxJumps: E
        };
    }

    function uJ(g: any) {
        let { characterId: t } = g;
        if(t !== ee() || k.me.classDesigner.activeClassDeviceId === void 0) {
            return;
        }
        let e = _i(k.me.classDesigner.activeClassDeviceId);
        if(!e) {
            return;
        }
        let I = e.options;
        if(I) {
            return I;
        }
    }

    const xp = new Map();
    function v5(g: any, t: any) {
        let e = dJ({
                characterId: g.id
            }),
            o = g.physics.state.jump.jumpCounter === 0 && !t ? e.jumpHeight : e.jumpHeight * e.subsequentJumpMultiplier;
        if(xp.has(o)) {
            return [...xp.get(o)];
        }
        let r = Math.round(e.jumpDurationMS / (1e3 / gi.tickRate)),
            B = T5({
                count: o,
                numTicks: r,
                ease: Phaser.Math.Easing.Quadratic.Out
            }),
            E = Math.round(e.jumpHangTimeMS / (1e3 / gi.tickRate));
        for(let i = 0; i < E; i++) B.push(0);
        // lodash.times(E, () => B.push(0));
        let n = B.map(Q => ({
            x: 0,
            y: -Q
        }));
        return xp.set(o, [...n]), n;
    }

    function T5(g: any) {
        let { count: t, numTicks: e, ease: I } = g,
            o = [];
        let s = 0;
        for(let r = 0; r < e; r++) {
            let B = I((r + 1) / e),
                E = t * B - s;
            o.push(E), s += E;
        }
        return o;
    }

    function P5(g: any) {
        let t = WA(g.characterId);
        const calcVelocity = settings.version === "knockback" ? j5 : oldCalcVelocity;

        return t ? Fe() && !wr() ? calcVelocity(t, g.input) : W5(t, g.input) : {
            x: 0,
            y: 0
        };
    }

    function oldCalcVelocity(A: any, t: any) {
        let e = 0,
            i = 0;
        const s = null == t ? void 0 : t.angle,
            g = null !== s && (s < 90 || s > 270) ? "right" : null !== s && s > 90 && s < 270 ? "left" : "none",
            C = k.me.movementSpeed / hc.normal;
        let h = api.platformerPhysics.platformerGroundSpeed * C;
        if(A.physics.state.jump.isJumping) {
            const t = Math.min(api.platformerPhysics.jump.airSpeedMinimum.maxSpeed, h * api.platformerPhysics.jump.airSpeedMinimum.multiplier);
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
                ? B ? (t = api.platformerPhysics.movement.ground.accelerationSpeed, i = api.platformerPhysics.movement.ground.maxAccelerationSpeed) : t = api.platformerPhysics.movement.ground.decelerationSpeed
                : B
                ? (t = api.platformerPhysics.movement.air.accelerationSpeed, i = api.platformerPhysics.movement.air.maxAccelerationSpeed)
                : t = api.platformerPhysics.movement.air.decelerationSpeed;
            const s = 20 / gi.tickRate;
            t *= A.physics.state.movement.accelerationTicks * s,
                i && (t = Math.min(i, t)),
                e = l > A.physics.state.movement.xVelocity
                    ? Phaser.Math.Clamp(A.physics.state.movement.xVelocity + t, A.physics.state.movement.xVelocity, l)
                    : Phaser.Math.Clamp(A.physics.state.movement.xVelocity - t, l, A.physics.state.movement.xVelocity);
        } else e = l;
        return A.physics.state.grounded && A.physics.state.velocity.y > api.platformerPhysics.platformerGroundSpeed * C && Math.sign(e) === Math.sign(A.physics.state.velocity.x) && (e = A.physics.state.velocity.x),
            A.physics.state.movement.xVelocity = e,
            A.physics.state.gravity = $5(A.id),
            i += A.physics.state.gravity,
            A.physics.state.forces.forEach((A: any, _t: any) => {
                const s = A.ticks[0];
                s && (e += s.x, i += s.y), A.ticks.shift();
            }),
            {
                x: e,
                y: i
            };
    }

    function j5(g: any, t: any) {
        var h;
        let e = 0,
            I = 0;
        let o = t == null ? void 0 : t.angle,
            s = o !== null && (o < 90 || o > 270),
            r = o !== null && o > 90 && o < 270,
            B = s ? "right" : r ? "left" : "none",
            E = k.me.movementSpeed / hc.normal;
        let n = we.platformerGroundSpeed * E;
        if(g.physics.state.jump.isJumping) {
            let d = Math.min(we.jump.airSpeedMinimum.maxSpeed, n * we.jump.airSpeedMinimum.multiplier);
            n = Math.max(d, g.physics.state.jump.xVelocityAtJumpStart), n = Math.min(n, we.platformerGroundSpeed * E);
        }
        let Q = g.physics.state.forces.find((d: any) => d.type === "hit");
        if(Q) {
            let d = Math.abs((h = Q == null ? void 0 : Q.ticks[0]) == null ? void 0 : h.x);
            n = Math.max(0, n - d);
        }
        let l = 0;
        B === "left" ? l = -n : B === "right" && (l = n);
        let c = l !== 0;
        if(
            B !== g.physics.state.movement.direction
            && (c && g.physics.state.movement.xVelocity !== 0 && (g.physics.state.movement.xVelocity = 0), g.physics.state.movement.accelerationTicks = 0, g.physics.state.movement.direction = B),
                g.physics.state.movement.xVelocity !== l
        ) {
            g.physics.state.movement.accelerationTicks += 1;
            let d = 0,
                y = 0;
            g.physics.state.grounded
                ? c ? (d = we.movement.ground.accelerationSpeed, y = we.movement.ground.maxAccelerationSpeed) : d = we.movement.ground.decelerationSpeed
                : c
                ? (d = we.movement.air.accelerationSpeed, y = we.movement.air.maxAccelerationSpeed)
                : d = we.movement.air.decelerationSpeed;
            let N = 20 / gi.tickRate;
            d *= g.physics.state.movement.accelerationTicks * N,
                y && (d = Math.min(y, d)),
                l > g.physics.state.movement.xVelocity
                    ? e = Phaser.Math.Clamp(g.physics.state.movement.xVelocity + d, g.physics.state.movement.xVelocity, l)
                    : e = Phaser.Math.Clamp(g.physics.state.movement.xVelocity - d, l, g.physics.state.movement.xVelocity);
        } else {
            e = l;
        }
        return g.physics.state.grounded && g.physics.state.velocity.y > we.platformerGroundSpeed * E && Math.sign(e) === Math.sign(g.physics.state.velocity.x) && (e = g.physics.state.velocity.x),
            g.physics.state.movement.xVelocity = e,
            g.physics.state.gravity = $5(g.id),
            I += g.physics.state.gravity,
            g.physics.state.forces.forEach((d: any) => {
                let y = d.ticks[0];
                y && (e += y.x, I += y.y), d.ticks.shift();
            }),
            {
                x: e,
                y: I
            };
    }

    function $5(g: any) {
        let t = WA(g);
        if(!t) {
            return 0;
        }
        if(t.physics.state.grounded || t.physics.state.groundedTicks < q5) {
            return we.groundedGravity;
        }
        if(t.physics.state.forces.some(s => s.id === "jump")) {
            return 0;
        }
        let o = H5(g);
        return Math.min(o.maxGravity, t.physics.state.gravity += o.airGravity);
    }

    function H5(g: any) {
        let t = x5({
                characterId: g
            }),
            e = t.maxGravityPerSecond,
            I = t.timeToMaxGravityMS,
            o = e / gi.tickRate,
            s = Math.round(I / 1e3 * gi.tickRate);
        return {
            airGravity: t.yTravelUntilMaxGravity * 2 / s / (s + 1),
            maxGravity: o
        };
    }

    function x5(g: any) {
        let { characterId: t } = g,
            e = uJ({
                characterId: t
            }),
            o = e != null && e.overrideMaxGravityPerSecond ? (e == null ? void 0 : e.maxGravityPerSecond) ?? mapOptions.maxGravityPerSecond : mapOptions.maxGravityPerSecond,
            s = e != null && e.overrideTimeToMaxGravityMS ? e.timeToMaxGravityMS ?? mapOptions.timeToMaxGravityMS : mapOptions.timeToMaxGravityMS,
            r = e != null && e.overrideYTravelUntilMaxGravity ? e.yTravelUntilMaxGravity ?? mapOptions.yTravelUntilMaxGravity : mapOptions.yTravelUntilMaxGravity;
        return {
            maxGravityPerSecond: o,
            timeToMaxGravityMS: s,
            yTravelUntilMaxGravity: r
        };
    }

    function W5(g: any, t: any) {
        let e = 0,
            I = 0;
        if(t && t.angle !== null) {
            let o = k.me.movementSpeed / hc.normal;
            let s = we.topDownBaseSpeed;
            wr() && (s = we.platformerGroundSpeed);
            let r = s * o,
                B = Phaser.Math.DegToRad(t.angle);
            e = Math.cos(B) * r, I = Math.sin(B) * r;
        }
        return g.physics.state.forces.forEach((o: any) => {
            let s = o.ticks[0];
            s && (e += s.x, I += s.y), o.ticks.shift();
        }),
            e = Math.round(e * 1e3) / 1e3,
            I = Math.round(I * 1e3) / 1e3,
            {
                x: e,
                y: I
            };
    }

    function K5(g: any) {
        let { characterId: t, velocity: e } = g,
            I = WA(t);
        if(!I) {
            return;
        }
        let { collider: o, character: { controller: s } } = I.physics.getBody();
        if(!s || !o) {
            return;
        }
        if(o.setTranslation(o.parent()!.translation()), e.x === 0 && e.y === 0) {
            return {
                x: 0,
                y: 0
            };
        }
        s.computeColliderMovement(
            o,
            {
                x: e.x,
                y: e.y
            },
            /* NB.EXCLUDE_DYNAMIC */ 4,
            void 0,
            Q => M5({
                otherCollider: Q,
                character: I
            })
        );
        let r = s.computedMovement(),
            E = I.physics.getBody().rigidBody.translation().y + r.y,
            n = F5({
                characterY: Si(E)
            });
        return r.y -= E - Zg(n), r;
    }

    function M5(g: any) {
        var r, B, E, n, Q;
        let { character: t, otherCollider: e } = g,
            I = e.parent().userData,
            o = I == null ? void 0 : I.id;
        if(!o) {
            return !0;
        }
        let s = Ve().bodies.find(o) as any;
        if(
            !s || s.character || s.sensor || (B = (r = t.physics.getBody()) == null ? void 0 : r.character) != null && B.ignoredStaticBodies.has(o)
            || (Q = (n = (E = t.physics.getBody()) == null ? void 0 : E.character) == null ? void 0 : n.ignoredTileBodies) != null && Q.has(o) || N5(s)
        ) {
            return !1;
        }
        if(s.device) {
            let l = _i(s.device.id);
            if(l && !l.checkIfCollidersEnabled()) {
                return !1;
            }
        }
        return !t.physics.phase;
    }

    function F5(g: any) {
        let { characterY: t } = g;
        if(!Fe()) {
            return t;
        }
        let e = k.world.height * se.height - 2 * se.height - Si(we.capsule.platformer.height + we.capsule.platformer.radius);
        return Math.min(t, e);
    }

    function N5(g: any) {
        var e, I;
        if(!((e = g.device) != null && e.id)) {
            return !1;
        }
        let t = scene.worldManager.devices.getDeviceById((I = g.device) == null ? void 0 : I.id);
        return t ? t.parts.manuallyHiding : !1;
    }

    function b5(g: any) {
        let t = WA(g.characterId);
        if(!t) {
            return;
        }
        let e = t.physics.getBody().character.controller;
        if(!e) {
            return;
        }
        let I = e.numComputedCollisions(),
            o = [],
            s = [],
            r = [];
        for(let B = 0; B < I; B++) {
            let E = e.computedCollision(B),
                n = E == null ? void 0 : E.normal1;
            n
                && (n.y < we.normals.maxGroundCollision ? o.push(E) : n.y < 0 && s.push(E),
                    n.y > we.normals.minHeadCollision && t.physics.state.jump.isJumping && Math.abs(t.physics.getBody().character.controller.computedMovement().y) < we.jump.cancelJumpIfHitHeadCausesYMovementLessThan
                    && r.push(E));
        }
        return {
            groundCollisions: o,
            slidingCollisions: s,
            headCollisions: r,
            numOfAllCollisions: I
        };
    }

    function U5(g: any) {
        let { characterId: t, groundCollisions: e, numOfAllCollisions: I } = g,
            o = WA(t);
        if(!o) {
            return !1;
        }
        let s = o.physics.getBody().character.controller;
        if(!s) {
            return !1;
        }
        let B = e.length > 0;
        let E = s.computedGrounded();
        return E !== B && (I || (B = E)), B;
    }

    function L5(g: any) {
        var l, c;
        let { characterId: t, isGrounded: e, groundCollisions: I, slideCollisions: o } = g;
        if(!Fe() || wr()) {
            return 0;
        }
        let s = WA(t);
        if(!s || !e && !o.length) {
            return 0;
        }
        let { radius: r } = Lr(s.id);
        let B = 0;
        (I == null ? void 0 : I.length) === 1 && ((c = (l = I[0]) == null ? void 0 : l.normal1) != null && c.x) && (B = r);
        let E = {
                x: (s.body.x - B) / ce.worldScale,
                y: s.body.y / ce.worldScale
            },
            n: any[] = [];
        s.physics.getBody().character.ignoredStaticBodies.forEach(h => {
            n.push(h);
        });
        let { hit: Q } = Ia({
            start: E,
            end: {
                x: E.x,
                y: E.y + r * 3
            },
            skipCharacters: !0,
            ignoredBodyIds: n
        });
        if(Q) {
            let h = Q.normal,
                d = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(0, 0, h.x, h.y) + Math.PI / 2);
            return Math.abs(d) > we.climbAngle ? 0 : Phaser.Math.DegToRad(Math.round(d));
        }
        return 0;
    }

    function Ia(g: any) {
        let { start: t, end: e } = g,
            I = g.skipCharacters ?? !1,
            { world: o, bodies: s } = Ve();
        Ve().bodies.activeBodies.enableBodiesAlongLine({
            start: t,
            end: e
        })! && o.updateSceneQueries();
        let B = {
                x: e.x - t.x,
                y: e.y - t.y
            },
            E = new RAPIER.Ray(t, B);
        let n: any;
        return o.intersectionsWithRay(E, 1, !0, (Q: any) => {
            var h: any, d, y, N, m;
            let l = (h = Q.collider.parent()!.userData) == null ? void 0 : h.id,
                c = s.find(l) as any;
            return I && (c != null && c.character) || c != null && c.sensor || c != null && c.device && ((y = g.ignoredDevicesIds) != null && y.includes((d = c == null ? void 0 : c.device) == null ? void 0 : d.id))
                    || c != null && c.device && !_i((N = c == null ? void 0 : c.device) == null ? void 0 : N.id)!.checkIfCollidersEnabled() || g.ignoredBodyIds && g.ignoredBodyIds.includes(l)
                    || (m = c == null ? void 0 : c.terrain) != null && m.removed
                ? !0
                : n
                ? (Q.toi < n.toi && (n = Q), !0)
                : (n = Q, !0);
        }, g.skipCharacters ? /* NB.EXCLUDE_DYNAMIC */ 4 : void 0),
            {
                ray: E,
                hit: n
            };
    }

    function J5(g: any) {
        let { characterId: t, isGrounded: e, isHittingHead: I, groundedRotation: o, wasGrounded: s } = g,
            r = WA(t);
        r
            && (r.physics.state.groundedTicks += 1,
                r.physics.state.lastGroundedAngle = o ?? 0,
                s && !e && !r.physics.state.jump.isJumping && (r.physics.state.jump.jumpsLeft -= 1),
                I && r.physics.state.jump.isJumping && hJ({
                    character: r,
                    forceId: "jump"
                }),
                r.physics.state.grounded = e,
                r.physics.state.grounded && (r.physics.state.groundedTicks = 0));
    }

    function R5(g: any) {
        let { characterId: t, movement: e, velocity: I } = g,
            o = WA(t);
        if(!o) {
            return;
        }
        let { rigidBody: s } = o.physics.getBody();
        if(s) {
            if(Fe() && !wr()) {
                let r = Phaser.Math.RadToDeg(Phaser.Math.Angle.Wrap(Phaser.Math.Angle.Between(0, 0, I.x, I.y))),
                    B = Phaser.Math.RadToDeg(Phaser.Math.Angle.Wrap(Phaser.Math.Angle.Between(0, 0, e.x, e.y))),
                    E = Phaser.Math.Angle.ShortestBetween(r, B);
                if(Math.abs(E) < 90 || o.physics.state.jump.isJumping) {
                    let n = s.translation();
                    n.x += e.x, n.y += e.y, s.setNextKinematicTranslation(n);
                }
            } else if(AU() || wr()) {
                let r = s.translation();
                r.x += e.x, r.y += e.y, s.setNextKinematicTranslation(r);
            }
        }
    }
});
