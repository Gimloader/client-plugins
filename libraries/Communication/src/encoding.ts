import type { Type } from "./consts";

export const isUint16 = (n: number) => Number.isInteger(n) && n >= 0 && n <= 65535;
export const splitUint16 = (int: number) => [
    (int >> 8) & 0xFF,
    int & 0xFF
];
export const getUint16 = (int1: number, int2: number) => (int1 << 8) | int2;

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

export const encodeCharacters = (characters: string) =>
    characters
        .split("")
        .map((c) => c.charCodeAt(0))
        .filter((c) => c < 256);

export function encodeStringMessage(identifier: number[], type: Type, message: string) {
    const codes = encodeCharacters(message);

    const charsLow = codes.length & 255;
    const charsHigh = (codes.length & 65280) >> 8;

    const header = [...identifier, type, charsHigh, charsLow];
    const messages = [header];

    while(codes.length % 7 !== 0) codes.push(0);

    for(let i = 0; i < codes.length; i += 7) {
        const msg = [];
        for(let j = 0; j < 7; j++) {
            msg[j] = codes[i + j];
        }
        messages.push(msg);
    }

    return messages;
}
