import type { Vector } from "@dimforge/rapier2d-compat";

export interface Recording {
    startPos: Vector;
    startState: string;
    platformerPhysics: string;
    frames: Gimloader.Stores.TickInput[];
}
