import type { Vector } from "@dimforge/rapier2d-compat";

export interface IRecording {
    startPos: Vector;
    startState: string;
    platformerPhysics: string;
    frames: Gimloader.Stores.TickInput[];
}
