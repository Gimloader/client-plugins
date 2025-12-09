import type { Vector } from "@dimforge/rapier2d-compat";

export interface IFrameInfo {
    right: boolean;
    left: boolean;
    up: boolean;
    translation?: Vector;
    state?: string;
}

export interface ISharedValues {
    frames: IFrameInfo[];
    currentFrame: number;
}

export interface TAS {
    frames: IFrameInfo[];
    laserOffset: number;
    startPos?: Vector;
    startState?: string;
}
