import { summitCoords } from "$shared/consts";
import type { Capsule, Vector } from "@dimforge/rapier2d-compat";
import type * as Savestates from "plugins/Savestates/src";
import type * as Desync from "libraries/Desync/src";

const respawnHeight = 621.093;
const floorHeight = 638.37;
let lastCheckpointReached = 0;
let canRespawn = false;

api.net.onLoad(() => {
    const savestates = api.plugin("Savestates") as typeof Savestates | null;
    if(savestates) {
        savestates.onStateLoaded((summit: string | number) => {
            if(typeof summit !== "number") return;

            lastCheckpointReached = summit;
            if(summit <= 1) canRespawn = false;
        });
    }

    api.net.room.state.session.gameSession.listen("phase", (phase: string) => {
        if(phase !== "results") return;

        canRespawn = false;
        lastCheckpointReached = 0;
    });
});

export function cancelRespawn() {
    canRespawn = false;
}

let doLaserRespawn = true;

export function setLaserRespawnEnabled(enabled: boolean) {
    doLaserRespawn = enabled;
}

// for backwards compatibility
export function setLaserWarningEnabled(enabled: boolean) {
    doLaserRespawn = enabled;
}

const enable = () => {
    const states = api.stores.world.devices.states;
    const body = api.stores.phaser.mainCharacter.physics.getBody();
    const shape = body.collider.shape as Capsule;

    let hurtFrames = 0;
    const maxHurtFrames = 1;

    // override the physics update to manually check for laser collisions
    const physics = api.stores.phaser.scene.worldManager.physics;
    api.patcher.before(physics, "physicsStep", () => {
        // Ignore running out of energy
        if(api.stores.me.movementSpeed === 0) api.stores.me.movementSpeed = 310;
    });

    let wasOnLastFrame = false;
    let startImmunityActive = false;

    api.patcher.after(physics, "physicsStep", () => {
        if(api.net.room.state.session.gameSession.phase === "results") return;
        if(!doLaserRespawn || startImmunityActive) return;

        const devicesInView = api.stores.phaser.scene.worldManager.devices.devicesInView;
        const lasers = devicesInView.filter(d => d.laser);
        if(lasers.length === 0) return;

        // all the lasers always have the same state
        const lasersOn = states.get(lasers[0].id)?.properties.get("GLOBAL_active");

        // some leniency between lasers turning on and doing damage
        if(!wasOnLastFrame && lasersOn) {
            startImmunityActive = true;
            setTimeout(() => startImmunityActive = false, 360);
        }
        wasOnLastFrame = lasersOn;

        if(!lasersOn || startImmunityActive) return;
        const translation = body.rigidBody.translation();

        // calculate the bounding box of the player
        const topLeft = {
            x: (translation.x - shape.radius) * 100,
            y: (translation.y - shape.halfHeight - shape.radius) * 100
        };
        const bottomRight = {
            x: (translation.x + shape.radius) * 100,
            y: (translation.y + shape.halfHeight + shape.radius) * 100
        };

        let hitLaser = false;

        // check collision with lasers
        for(const laser of lasers) {
            // make sure the laser is active
            if(laser.dots.length <= 1) continue;

            const start = {
                x: laser.dots[0].options.x + laser.x,
                y: laser.dots[0].options.y + laser.y
            };
            const end = {
                x: laser.dots.at(-1).options.x + laser.x,
                y: laser.dots.at(-1).options.y + laser.y
            };

            // check whether the player bounding box overlaps the laser line
            if(boundingBoxOverlap(start, end, topLeft, bottomRight)) {
                hitLaser = true;
                break;
            }
        }

        if(hitLaser) {
            hurtFrames++;
            if(hurtFrames >= maxHurtFrames) {
                hurtFrames = 0;
                body.rigidBody.setTranslation(summitCoords[lastCheckpointReached], true);
                api.stores.me.isRespawning = true;
                setTimeout(() => api.stores.me.isRespawning = false, 1000);
            }
        } else {
            hurtFrames = 0;
        }

        // check if we've reached a checkpoint
        for(let i = lastCheckpointReached + 1; i < summitCoords.length; i++) {
            const checkpoint = summitCoords[i];

            const summitStart: Vector = {
                x: checkpoint.x * 100,
                y: checkpoint.y * 100 + 100
            };
            const summitEnd: Vector = {
                x: checkpoint.x * 100 + 100,
                y: checkpoint.y * 100
            };

            if(boundingBoxOverlap(summitStart, summitEnd, topLeft, bottomRight)) {
                console.log("Reached Checkpoint", i);
                lastCheckpointReached = i;
                break;
            }
        }

        // check for respawning
        if(translation.y < respawnHeight) {
            canRespawn = true;
        }

        if(canRespawn && translation.y > floorHeight) {
            canRespawn = false;
            setTimeout(() => {
                body.rigidBody.setTranslation(summitCoords[lastCheckpointReached], true);
                api.stores.me.isRespawning = true;
                setTimeout(() => api.stores.me.isRespawning = false, 1000);
            }, 300);
        }
    });

    // move the player to the initial position
    body.rigidBody.setTranslation({ x: 33.87, y: 638.38 }, true);

    // make the physics deterministic
    for(const id of physics.bodies.staticBodies) {
        physics.bodies.activeBodies.enableBody(id);
    }

    // ignore attempts to disable bodies
    physics.bodies.activeBodies.disableBody = () => {};
};

api.net.onLoad(() => {
    enable();
    const desync = GL.lib("Desync") as typeof Desync;
    desync.enable();
});

function boundingBoxOverlap(start: Vector, end: Vector, topLeft: Vector, bottomRight: Vector) {
    // check if the line intersects with any of the bounding box sides
    return lineIntersects(start, end, topLeft, { x: bottomRight.x, y: topLeft.y })
        || lineIntersects(start, end, topLeft, { x: topLeft.x, y: bottomRight.y })
        || lineIntersects(start, end, { x: bottomRight.x, y: topLeft.y }, bottomRight)
        || lineIntersects(start, end, { x: topLeft.x, y: bottomRight.y }, bottomRight);
}

function lineIntersects(start1: Vector, end1: Vector, start2: Vector, end2: Vector) {
    const denominator = ((end1.x - start1.x) * (end2.y - start2.y)) - ((end1.y - start1.y) * (end2.x - start2.x));
    const numerator1 = ((start1.y - start2.y) * (end2.x - start2.x)) - ((start1.x - start2.x) * (end2.y - start2.y));
    const numerator2 = ((start1.y - start2.y) * (end1.x - start1.x)) - ((start1.x - start2.x) * (end1.y - start1.y));

    if(denominator === 0) return numerator1 === 0 && numerator2 === 0;

    const r = numerator1 / denominator;
    const s = numerator2 / denominator;

    return (r >= 0 && r <= 1) && (s >= 0 && s <= 1);
}
