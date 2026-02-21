import type { Vector } from "@dimforge/rapier2d-compat";

export interface IFrame {
    angle: number;
    moving: boolean;
    answer: boolean;
    purchase: boolean;
}

export interface IPreviousFrame {
    position: Vector;
    state: string;
    energy: number;
    speed: number;
    epq: number;
    energyUsage: number;
    energyTimeout: number;
    purchaseTimeouts: [number, () => Function, boolean?][];
    energyFrames: number[];
    maxEnergy: number;
    undoDeviceChanges?: Function;
}
