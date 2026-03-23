import type { Callbacks, Character, Message, OnStreamCallback, PendingAngle, StateUpdate } from "./types";
import { Type } from "./consts";
import { bytesToFloat, encodeCharacters, floatToBytes, joinUint24, splitUint24 } from "./encoding";

export default class Messenger {
    private static pendingAngle = 0;
    private static angleChangeRes: (() => void) | null = null;
    private static angleChangeRej: (() => void) | null = null;
    private static readonly angleQueue: PendingAngle[] = [];
    static readonly callbacks = new Map<string, Callbacks>();
    private static alternate = false;
    private static ignoreNextAngle = false;

    static init() {
        api.net.on("send:AIMING", (message, editFn) => {
            if(this.ignoreNextAngle) {
                this.ignoreNextAngle = false;
                return;
            }

            this.pendingAngle = message.angle;

            // Cancel it if we still have messages to send
            if(this.angleQueue.length > 0) editFn(null);
        });

        // Purge the queue once the game ends
        api.net.state.session.listen("phase", (phase) => {
            if(phase === "game") return;
            this.angleQueue.forEach((pending) => pending.reject());
            this.angleQueue.length = 0;
            this.angleChangeRej?.();
            this.updatePromises.clear();
            this.updateResolvers.clear();
        }, false);
    }

    constructor(private readonly identifier: number[]) {}

    async sendBoolean(value: boolean) {
        await this.sendHeader(Type.Boolean, value ? 1 : 0);
    }

    async sendPositiveInt24(value: number) {
        const bytes = splitUint24(value);
        await this.sendHeader(Type.PositiveInt24, ...bytes);
    }

    async sendNegativeInt24(value: number) {
        const bytes = splitUint24(-value);
        await this.sendHeader(Type.NegativeInt24, ...bytes);
    }

    async sendNumber(value: number) {
        const bytes = floatToBytes(value);
        await this.sendSpreadBytes(Type.Float, bytes);
    }

    async sendByte(byte: number) {
        await this.sendHeader(Type.Byte, byte);
    }

    async sendTwoBytes(bytes: number[]) {
        await this.sendHeader(Type.TwoBytes, ...bytes);
    }

    async sendThreeBytes(bytes: number[]) {
        await this.sendHeader(Type.ThreeBytes, ...bytes);
    }

    async sendSeveralBytes(bytes: number[]) {
        await this.sendSpreadBytes(Type.SeveralBytes, bytes);
    }

    async sendThreeCharacters(string: string) {
        const codes = encodeCharacters(string);
        await this.sendHeader(Type.ThreeCharacters, ...codes);
    }

    async sendString(string: string) {
        await this.sendStringOfType(string, Type.String);
    }

    async sendSmallObject(string: string) {
        await this.sendHeader(Type.SmallObject, ...encodeCharacters(string));
    }

    async sendObject(string: string) {
        await this.sendStringOfType(string, Type.Object);
    }

    private async sendStringOfType(string: string, type: Type) {
        const codes = encodeCharacters(string);
        await this.sendSpreadBytes(type, codes);
    }

    private async sendSpreadBytes(type: Type, bytes: number[]) {
        const messages: number[][] = [];

        for(let i = 3; i < bytes.length; i += 7) {
            messages.push(bytes.slice(i, i + 7));
        }

        const lastMessage = messages.at(-1)!;
        // Send the index of the last byte, plus 2 to differentiate from the 0/1 alternation
        const lastIndex = lastMessage.length + 1;

        await Promise.all([
            this.sendHeader(type, ...bytes.slice(0, 3)),
            ...messages.slice(0, -1).map(msg => Messenger.sendAlternatedBytes(msg)),
            Messenger.sendAlternatedBytes(lastMessage, lastIndex)
        ]);
    }

    // Maxmium of 3 free bytes
    private async sendHeader(type: Type, ...free: number[]) {
        const header = [...this.identifier, ...free];

        // Vary the float to avoid dropping due to repeat angle
        header[7] = type;
        Messenger.alternate = !Messenger.alternate;
        if(Messenger.alternate) header[7] |= 0x80;

        await Messenger.sendBytes(header);
    }

    // Maxmium of 7 bytes
    private static async sendAlternatedBytes(bytes: number[], overrideLast?: number) {
        if(overrideLast) {
            bytes[7] = overrideLast;
        } else {
            this.alternate = !this.alternate;
            if(this.alternate) bytes[7] = 1;
        }

        await this.sendBytes(bytes);
    }

    private static async sendBytes(bytes: number[]) {
        await this.sendAngle(bytesToFloat(bytes));
    }

    private static async sendAngle(angle: number) {
        return new Promise<void>((res, rej) => {
            this.angleQueue.push({
                angle,
                resolve: res,
                reject: rej
            });

            if(this.angleQueue.length > 1) return;
            this.processQueue();
        });
    }

    private static async processQueue() {
        while(this.angleQueue.length > 0) {
            const queuedAngle = this.angleQueue[0];

            this.ignoreNextAngle = true;
            api.net.send("AIMING", { angle: queuedAngle.angle });

            try {
                await this.awaitAngleChange();
            } catch {
                break;
            }

            queuedAngle.resolve();
            this.angleQueue.shift();
        }

        // Send the real angle afterwards (we don't care about this being dropped)
        if(!this.pendingAngle) return;
        api.net.send("AIMING", { angle: this.pendingAngle });
    }

    private static async awaitAngleChange() {
        return new Promise<void>((res, rej) => {
            this.angleChangeRes = res;
            this.angleChangeRej = rej;
        });
    }

    static updatePromises = new Map<Character, Promise<StateUpdate>>();
    static updateResolvers = new Map<Character, (data: StateUpdate) => void>();

    static async *restOfBytes(char: Character) {
        while(true) {
            const update = await Messenger.nextBytes(char);
            yield update.data;
            if(update.done) break;
        }
    }

    static async getMessageBytes(char: Character, initial: number[]) {
        const array = [...initial];

        // dprint-ignore-start
        for await (const chunk of Messenger.restOfBytes(char)) {
        // dprint-ignore-end
            array.push(...chunk);
        }

        return array;
    }

    static nextBytes(char: Character) {
        const existing = this.updatePromises.get(char);
        if(existing) return existing;

        const { promise, resolve } = Promise.withResolvers<StateUpdate>();
        this.updatePromises.set(char, promise);
        this.updateResolvers.set(char, resolve);

        return promise;
    }

    static async handleAngle(char: Character, angle: number) {
        if(!angle) return;
        if(char.id === api.stores.network.authId) return this.angleChangeRes?.();

        const bytes = floatToBytes(angle);

        const resolve = this.updateResolvers.get(char);
        if(resolve) {
            const payload = bytes.slice(0, 7);
            const flag = bytes[7];

            // The flag will usually alternate between 0 and 1 to prevent repetition
            // But if it is the last message the flag will be set to the index of the last byte + 2
            // so we can determine how many bytes to read
            const done = flag >= 2;

            if(done) resolve({ done, data: payload.slice(0, flag - 1) });
            else resolve({ done, data: payload });

            this.updatePromises.delete(char);
            this.updateResolvers.delete(char);
            return;
        }

        const identifierBytes = bytes.slice(0, 4);
        const payload = bytes.slice(4, 7) as [number, number, number];
        const type = bytes[7] & 0x7F;

        const identifierString = identifierBytes.join(",");
        const callbacks = this.callbacks.get(identifierString);
        if(!callbacks) return;

        const gotValue = (value: Message) => {
            callbacks.message.forEach(callback => {
                callback(value, char);
            });
        };

        switch (type) {
            case Type.Boolean:
                gotValue(payload[0] === 1);
                return;

            case Type.PositiveInt24:
                gotValue(joinUint24(...payload));
                return;

            case Type.NegativeInt24:
                gotValue(-joinUint24(...payload));
                return;

            case Type.Byte: {
                const bytes = [payload[0]];
                this.startCompletedStream(callbacks.byteStream, char, bytes);
                gotValue(bytes);
                return;
            }

            case Type.TwoBytes: {
                const bytes = payload.slice(0, 2);
                this.startCompletedStream(callbacks.byteStream, char, bytes);
                gotValue(bytes);
                return;
            }

            case Type.ThreeBytes: {
                this.startCompletedStream(callbacks.byteStream, char, payload);
                gotValue(payload);
                return;
            }

            case Type.ThreeCharacters: {
                const codes = payload.filter(b => b !== 0);
                const string = String.fromCharCode(...codes);
                this.startCompletedStream(callbacks.stringStream, char, string);
                gotValue(string);
                return;
            }

            case Type.SmallObject: {
                const codes = payload.filter(b => b !== 0);
                gotValue(JSON.parse(String.fromCharCode(...codes)));
                return;
            }

            case Type.Float: {
                const bytes = await this.getMessageBytes(char, payload);
                gotValue(bytesToFloat(bytes));
                return;
            }

            case Type.SeveralBytes: {
                this.startStream(callbacks.byteStream, char, payload);
                const bytes = await this.getMessageBytes(char, payload);
                gotValue(bytes);
                return;
            }

            case Type.String: {
                this.startStream(callbacks.stringStream, char, payload, String.fromCharCode);
                const bytes = await this.getMessageBytes(char, payload);
                gotValue(String.fromCharCode(...bytes));
                return;
            }

            case Type.Object: {
                const bytes = await this.getMessageBytes(char, payload);
                const string = String.fromCharCode(...bytes);
                try {
                    gotValue(JSON.parse(string));
                } catch (e) {
                    console.error("Failed to parse object message:", e);
                }
                return;
            }
        }
    }

    static startCompletedStream<T>(callbacks: OnStreamCallback<T>[], char: Character, initial: T) {
        const generator = async function*() {
            yield initial;
        };

        for(const cb of callbacks) {
            cb(generator(), char);
        }
    }

    static startStream<T>(callbacks: OnStreamCallback<T>[], char: Character, initial: number[], map?: (...bytes: number[]) => T) {
        const generator = async function*() {
            yield map ? map(...initial) : initial;

            // dprint-ignore-start
            for await (const chunk of Messenger.restOfBytes(char)) {
            // dprint-ignore-start
                yield map ? map(...chunk) : chunk;
            }
        };

        for(const cb of callbacks) {
            cb(generator(), char);
        }
    }
}
