export const isUint8 = (n: number) => Number.isInteger(n) && n >= 0 && n <= 255;
export const isUint24 = (n: number) => Number.isInteger(n) && n >= 0 && n <= 0xFFFFFF;
export const splitUint24 = (int: number) => [
    (int >> 16) & 0xFF,
    (int >> 8) & 0xFF,
    int & 0xFF
];
export const joinUint24 = (int1: number, int2: number, int3: number) => (int1 << 16) | (int2 << 8) | int3;

export function bytesToFloat(bytes: number[]) {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);

    for(let i = 0; i < 8; i++) {
        view[i] = bytes[i] ?? 0;
    }

    return new Float64Array(buffer)[0];
}

export function floatToBytes(float: number) {
    const buffer = new ArrayBuffer(8);
    const floatView = new Float64Array(buffer);
    floatView[0] = float;
    const byteView = new Uint8Array(buffer);
    return Array.from(byteView);
}

export function getIdentifier(str: string) {
    let hash = 0;

    for(let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        hash = hash * 31 + charCode | 0;
    }

    const uInt32Hash = hash >>> 0;

    return [
        uInt32Hash >>> 24 & 255,
        uInt32Hash >>> 16 & 255,
        uInt32Hash >>> 8 & 255,
        uInt32Hash & 255
    ];
}

export function encodeCharacters(characters: string) {
    return characters
        .split("")
        .map((c) => c.charCodeAt(0))
        .filter((c) => c < 256 && c > 0);
}
