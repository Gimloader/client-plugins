export const PI = Math.PI;
export const lo = {
    initialForceFactor: .003,
    maximumForce: 10,
    maximumTickForce: 3,
    forceTickMultiplier: .89,
    minimumForce: .01,
    platformerGrounded: {
        leftAngle: 7 * PI / 6,
        rightAngle: 11 * PI / 6,
        notWhenWithin: [[4 * PI / 3, 5 * PI / 3], [PI / 3, 2 * PI / 3]]
    }
}

export const defaultAirMovement = {
    accelerationSpeed: 0.08125,
    decelerationSpeed: 0.08125,
    maxAccelerationSpeed: 0.14130434782608697
};

export const originalAirMovement = {
    accelerationSpeed: 0.121875,
    decelerationSpeed: 0.08125,
    maxAccelerationSpeed: 0.155
};

export const we = {
    "capsule": {
        "topDown": {
            "radius": 0.2,
            "height": 0.1,
            "angle": 90
        },
        "platformer": {
            "radius": 0.27,
            "height": 0.06,
            "angle": 0
        }
    },
    "topDownBaseSpeed": 0.25833333333333336,
    "platformerGroundSpeed": 0.325,
    "feetSensorPosition": {
        "topDown": {
            "x": 0.2,
            "y": 0
        },
        "platformer": {
            "x": 0,
            "y": 0.3
        }
    },
    "aroundSensorPosition": {
        "topDown": {
            "x": -0.18,
            "y": 0
        },
        "platformer": {
            "x": 0,
            "y": 0
        }
    },
    "controllerOffset": 0.01,
    "climbAngle": 45,
    "slideAngle": 45,
    "groundSnapHeight": 0.3,
    "autoStep": {
        "maxHeight": 0.15,
        "minWidth": 0.3
    },
    "groundedGravity": 0.001,
    "movement": {
        "ground": {
            "accelerationSpeed": 0.0203125,
            "decelerationSpeed": 0.1625,
            "maxAccelerationSpeed": 0.14130434782608697
        },
        "air": defaultAirMovement
    },
    "jump": {
        "coyoteJumpLimitMS": 200,
        "cooldownMS": 200,
        "cancelJumpIfHitHeadCausesYMovementLessThan": 0.05999999999999999,
        "airSpeedMinimum": {
            "multiplier": 0.75,
            "maxSpeed": 0.325
        }
    },
    "normals": {
        "maxGroundCollision": -0.7071067811865475,
        "minHeadCollision": 0.6
    },
    "inputsStorageLimit": 60
}

export const gi = { tickRate: 12 }
export const hc = { normal: 310 }
export const ce = { worldScale: 100 }
export const q5 = Math.round(we.jump.cooldownMS / (1e3 / gi.tickRate));
export const Y5 = Math.round(we.jump.coyoteJumpLimitMS / (1e3 / gi.tickRate));
export const se = {
    width: 64,
    height: 64
}