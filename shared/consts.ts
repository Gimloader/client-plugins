import type { Vector } from "@dimforge/rapier2d-compat";

export const summitCoords: Vector[] = [
    { x: 38.2555427551269, y: 638.38995361328 },
    { x: 90.2299728393554, y: 638.37768554687 },
    { x: 285.440002441406, y: 532.7800292968 },
    { x: 217.550003051757, y: 500.77999877929 },
    { x: 400.339996337890, y: 413.73999023437 },
    { x: 356.540008544921, y: 351.66000366210 },
    { x: 401.269989013671, y: 285.73999023437 }
];

export const defaultState =
    '{"actualMovement":{"x":0,"y":0},"movement":{"direction":"none","xVelocity":0,"accelerationTicks":0},"jump":{"isJumping":false,"jumpsLeft":2,"jumpCounter":0,"jumpTicks":291,"xVelocityAtJumpStart":0,"lastJumpGravityMultiplier":1},"wallJump":{"ticks":-1,"transitionTicks":-1,"forceInputTicks":0,"slidingTicks":0,"jumpBuffer":[],"inputVelocityX":0},"forces":[],"gravityZones":[],"inertia":{"x":0,"y":0},"velocity":{"x":0,"y":0.001},"cancelInertiaOnNextGrounded":false,"inputVelocityControlFactor":1,"lastUsedVelocityToCalculateMovement":{"x":0,"y":0.001},"grounded":true,"sliding":false,"groundedTicks":0,"lastGroundedAngle":0}';
