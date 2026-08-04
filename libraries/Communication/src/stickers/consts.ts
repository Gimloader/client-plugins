export const sizes = ["Small", "Normal", "Large", "Extra Large"] as const;
export const placements = ["Below", "Exact", "Above"] as const;
export type Size = typeof sizes[number];
export type Placement = typeof placements[number];

export interface StickerData {
    placement: Placement;
    size: Size;
}

export enum StickerMessageType {
    PositiveInt24,
    NegativeInt24,
    Float,
    Boolean,
    String,
    Object,
    Bytes
}
