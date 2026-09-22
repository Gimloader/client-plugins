export const stickerIdentifierLength = 9;
export const stickerMessageSizeLength = 5;
export const sizeNumbers = [0.1, 0.15, 0.2, 0.25];
export const sizes = ["Small", "Normal", "Large", "Extra Large"] as const;
export const placements = ["Below", "Exact", "Above"] as const;
export const maxStickersBeforeWait = 500;
export const stickerWait = 200;
export const maxStickerMessageLength = 12 ** stickerMessageSizeLength;
export const maxDozensInt = 12 ** 11;

export enum StickerMessageType {
    PositiveDozen,
    PositiveTwoDozen,
    PositiveInt,
    NegativeInt,
    Float,
    Boolean,
    String,
    Object,
    Bytes
}

export enum AimingMessageType {
    Boolean,
    PositiveInt24,
    NegativeInt24,
    Float,
    ThreeCharacters,
    String,
    Object,
    SmallObject,
    Byte,
    TwoBytes,
    ThreeBytes,
    SeveralBytes
}
