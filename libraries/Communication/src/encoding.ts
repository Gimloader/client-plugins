import { stickerIdentifierLength } from "./consts";

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

// dozens -> number -> bytes -> float
export function dozensToFloat(dozens: number[]) {
    let number = 0n;
    for(const dozen of dozens) {
        number *= 12n;
        number += BigInt(dozen);
    }

    const bytes: number[] = new Array(8).fill(0);
    for(let i = bytes.length - 1; i >= 0; i--) {
        bytes[i] = Number(number & 0xFFn);
        number >>= 8n;
    }

    return bytesToFloat(bytes);
}

export function floatToDozens(float: number) {
    const bytes = floatToBytes(float);
    let number = 0n;

    for(const byte of bytes) {
        number <<= 8n;
        number |= BigInt(byte);
    }

    const dozens: number[] = new Array(18).fill(0);
    for(let i = dozens.length - 1; i >= 0; i--) {
        dozens[i] = Number(number % 12n);
        number /= 12n;
    }

    return dozens;
}

export function getIdentifier(str: string): number {
    let hash = 0;

    for(let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        hash = hash * 31 + charCode | 0;
    }

    return hash >>> 0;
}

export function identifierToBytes(identifier: number): number[] {
    return [
        identifier >>> 24 & 255,
        identifier >>> 16 & 255,
        identifier >>> 8 & 255,
        identifier & 255
    ];
}

export function identifierToDozens(identifier: number): number[] {
    return numberToDozens(identifier, stickerIdentifierLength);
}

export function joinUint32(bytes: number[]) {
    return (
        bytes[0] << 24
        | bytes[1] << 16
        | bytes[2] << 8
        | bytes[3]
    );
}

export function numberToBytes(number: number, size: number) {
    const dozens = new Array(size).fill(0);

    for(let i = size - 1; i >= 0; i--) {
        dozens[i] = number & 0xFF;
        number >>= 8;
    }

    return dozens;
}

export function bytesToNumber(bytes: number[]) {
    let result = 0;

    for(let i = 0; i < bytes.length; i++) {
        result <<= 8;
        result |= bytes[i];
    }

    return result;
}

export function numberToDozens(number: number, size: number) {
    const dozens = new Array(size).fill(0);

    for(let i = size - 1; i >= 0; i--) {
        dozens[i] = number % 12;
        number = Math.floor(number / 12);
    }

    return dozens;
}

export function dozensToNumber(dozens: number[]) {
    let result = 0;

    for(let i = 0; i < dozens.length; i++) {
        result *= 12;
        result += dozens[i];
    }

    return result;
}

export function encodeCharacters(characters: string) {
    return characters
        .split("")
        .map((c) => c.charCodeAt(0))
        .filter((c) => c < 256 && c > 0);
}

export function bytesToDozens(bytes: number[]): number[] {
    const output: number[] = [];
    let accum = 0;
    let bitLength = 0;

    for(const byte of bytes) {
        accum |= byte << bitLength;
        bitLength += 8;

        while(bitLength > ((accum & 1) ? 3 : 4)) {
            if(accum & 1) {
                output.push(((accum & 0b110) >> 1) + 8);
                bitLength -= 3;
                accum >>= 3;
            } else {
                output.push((accum & 0b1110) >> 1);
                bitLength -= 4;
                accum >>= 4;
            }
        }
    }

    if(bitLength > 0) {
        if(accum & 1) {
            output.push(((accum & 0b110) >> 1) + 8);
        } else {
            output.push((accum & 0b1110) >> 1);
        }
    }

    return output;
}

export type DozensDecodeState = [number, number];

interface DozensDecodeResult {
    result: number[];
    state: DozensDecodeState;
}

export function dozensToBytes(dozens: number[], state?: DozensDecodeState): DozensDecodeResult {
    const output: number[] = [];
    let accum = state?.[0] ?? 0;
    let bitLength = state?.[1] ?? 0;

    for(const number of dozens) {
        if(number < 8) {
            accum |= number << (bitLength + 1);
            bitLength += 4;
        } else {
            accum |= (((number - 8) << 1) + 1) << bitLength;
            bitLength += 3;
        }

        if(bitLength >= 8) {
            bitLength -= 8;
            const byte = accum & 0xFF;
            accum >>= 8;
            output.push(byte);
        }
    }

    return { result: output, state: [accum, bitLength] };
}
