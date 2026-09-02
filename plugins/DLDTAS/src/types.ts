import type { Vector } from "@dimforge/rapier2d-compat";

export interface FrameInfo {
    right: boolean;
    left: boolean;
    up: boolean;
    translation?: Vector;
    state?: string;
}

export interface SharedValues {
    frames: FrameInfo[];
    currentFrame: number;
}

export interface TAS {
    frames: FrameInfo[];
    laserOffset: number;
    startPos?: Vector;
    startState?: string;
}
