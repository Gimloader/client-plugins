import type { Character, Message } from "./types";
import { bytesToFloat, encodeCharacters, floatToBytes, joinUint24, splitUint24 } from "./encoding";
import Receiver from "./streamer";
import { splitArrayByLength } from "./util";

enum AimingMessageType {
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

export interface PendingAngle {
    angle: number;
    resolvers: PromiseWithResolvers<void>;
}

export default class Messenger {
    private static realAngle = 0;
    static angleChangeRes: (() => void) | null = null;
    private static angleChangeRej: (() => void) | null = null;
    private static readonly angleQueue: PendingAngle[] = [];
    private static alternate = false;
    private static ignoreNextAngle = false;

    static init() {
        api.net.on("send:AIMING", (message, editFn) => {
            if(this.ignoreNextAngle) {
                this.ignoreNextAngle = false;
                return;
            }

            this.realAngle = message.angle;

            // Cancel it if we still have messages to send
            if(this.angleQueue.length > 0) editFn(null);
        });

        // Purge the queue once the game ends
        api.net.state.session.listen("phase", (phase) => {
            if(phase === "game") return;
            this.angleQueue.forEach((pending) => pending.resolvers.reject());
            this.angleQueue.length = 0;
            this.angleChangeRej?.();
            Receiver.updatePromises.clear();
            Receiver.updateResolvers.clear();
        }, false);
    }

    static get pendingAngle() {
        return this.angleQueue[0]?.angle;
    }

    constructor(private readonly identifier: number[]) {}

    async sendBoolean(value: boolean) {
        await this.sendHeader(AimingMessageType.Boolean, value ? 1 : 0);
    }

    async sendPositiveInt24(value: number) {
        const bytes = splitUint24(value);
        await this.sendHeader(AimingMessageType.PositiveInt24, ...bytes);
    }

    async sendNegativeInt24(value: number) {
        const bytes = splitUint24(-value);
        await this.sendHeader(AimingMessageType.NegativeInt24, ...bytes);
    }

    async sendNumber(value: number) {
        const bytes = floatToBytes(value);
        await this.sendSpreadBytes(AimingMessageType.Float, bytes);
    }

    async sendByte(byte: number) {
        await this.sendHeader(AimingMessageType.Byte, byte);
    }

    async sendBytes(bytes: number[]) {
        switch (bytes.length) {
            case 1: {
                await this.sendHeader(AimingMessageType.Byte, bytes[0]);
                break;
            }
            case 2: {
                await this.sendHeader(AimingMessageType.TwoBytes, ...bytes);
                break;
            }
            case 3: {
                await this.sendHeader(AimingMessageType.ThreeBytes, ...bytes);
                break;
            }
            default: {
                await this.sendSpreadBytes(AimingMessageType.SeveralBytes, bytes);
                break;
            }
        }
    }

    async sendString(string: string) {
        if(string.length <= 3) {
            return await this.sendHeader(AimingMessageType.ThreeCharacters, ...encodeCharacters(string));
        }
        await this.sendStringOfType(string, AimingMessageType.String);
    }

    async sendObject(obj: object) {
        const str = JSON.stringify(obj);
        if(str.length <= 3) {
            return await this.sendHeader(AimingMessageType.SmallObject, ...encodeCharacters(str));
        }
        await this.sendStringOfType(str, AimingMessageType.Object);
    }

    private async sendStringOfType(string: string, type: AimingMessageType) {
        const codes = encodeCharacters(string);
        await this.sendSpreadBytes(type, codes);
    }

    private async sendSpreadBytes(type: AimingMessageType, bytes: number[]) {
        const messages = splitArrayByLength(bytes, 7);

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
    private async sendHeader(type: AimingMessageType, ...free: number[]) {
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
        const resolvers = Promise.withResolvers<void>();
        this.angleQueue.push({
            angle,
            resolvers
        });

        if(this.angleQueue.length > 1) return;
        this.processQueue();
        await resolvers.promise;
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

            queuedAngle.resolvers.resolve();
            this.angleQueue.shift();
        }

        // Send the real angle afterwards (we don't care about this being dropped)
        if(!this.realAngle) return;
        api.net.send("AIMING", { angle: this.realAngle });
    }

    private static async awaitAngleChange() {
        return new Promise<void>((res, rej) => {
            this.angleChangeRes = res;
            this.angleChangeRej = rej;
        });
    }

    static getBytes(char: Character, angle: number): number[] | null {
        if(!angle) return null;

        const bytes = floatToBytes(angle);

        if(Receiver.updateResolvers.has(char) || Receiver.callbacks.has(bytes.slice(0, 4).join(","))) {
            return bytes;
        }

        return null;
    }

    static async handleBytes(char: Character, bytes: number[]) {
        const resolve = Receiver.updateResolvers.get(char);
        if(resolve) {
            const payload = bytes.slice(0, 7);
            const flag = bytes[7];

            // The flag will usually alternate between 0 and 1 to prevent repetition
            // But if it is the last message the flag will be set to the index of the last byte + 2
            // so we can determine how many bytes to read
            const done = flag >= 2;

            if(done) resolve({ done, data: payload.slice(0, flag - 1) });
            else resolve({ done, data: payload });

            Receiver.updatePromises.delete(char);
            Receiver.updateResolvers.delete(char);
            return;
        }

        const identifierBytes = bytes.slice(0, 4);
        const payload = bytes.slice(4, 7) as [number, number, number];
        const type = bytes[7] & 0x7F;

        const identifierString = identifierBytes.join(",");
        const callbacks = Receiver.callbacks.get(identifierString);
        if(!callbacks) return;

        const gotValue = (value: Message) => {
            callbacks.message.forEach(callback => {
                callback(value, char);
            });
        };

        switch (type) {
            case AimingMessageType.Boolean:
                gotValue(payload[0] === 1);
                return;

            case AimingMessageType.PositiveInt24:
                gotValue(joinUint24(...payload));
                return;

            case AimingMessageType.NegativeInt24:
                gotValue(-joinUint24(...payload));
                return;

            case AimingMessageType.Byte: {
                const bytes = [payload[0]];
                Receiver.startCompletedStream(callbacks.byteStream, char, bytes);
                gotValue(bytes);
                return;
            }

            case AimingMessageType.TwoBytes: {
                const bytes = payload.slice(0, 2);
                Receiver.startCompletedStream(callbacks.byteStream, char, bytes);
                gotValue(bytes);
                return;
            }

            case AimingMessageType.ThreeBytes: {
                Receiver.startCompletedStream(callbacks.byteStream, char, payload);
                gotValue(payload);
                return;
            }

            case AimingMessageType.ThreeCharacters: {
                const codes = payload.filter(b => b !== 0);
                const string = String.fromCharCode(...codes);
                Receiver.startCompletedStream(callbacks.stringStream, char, string);
                gotValue(string);
                return;
            }

            case AimingMessageType.SmallObject: {
                const codes = payload.filter(b => b !== 0);
                gotValue(JSON.parse(String.fromCharCode(...codes)));
                return;
            }

            case AimingMessageType.Float: {
                const bytes = await Receiver.getMessageBytes(char, payload);
                gotValue(bytesToFloat(bytes));
                return;
            }

            case AimingMessageType.SeveralBytes: {
                Receiver.startStream(callbacks.byteStream, char, payload);
                const bytes = await Receiver.getMessageBytes(char, payload);
                gotValue(bytes);
                return;
            }

            case AimingMessageType.String: {
                Receiver.startStream(callbacks.stringStream, char, payload, String.fromCharCode);
                const bytes = await Receiver.getMessageBytes(char, payload);
                gotValue(String.fromCharCode(...bytes));
                return;
            }

            case AimingMessageType.Object: {
                const bytes = await Receiver.getMessageBytes(char, payload);
                const string = String.fromCharCode(...bytes);
                try {
                    gotValue(JSON.parse(string));
                } catch (e) {
                    api.logger.error("Failed to parse object message:", e);
                }
                return;
            }
        }
    }
}
