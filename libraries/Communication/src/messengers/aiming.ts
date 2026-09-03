import type { Character, Message } from "../types";
import { bytesToFloat, encodeCharacters, floatToBytes, isUint24, isUint8, joinUint24, joinUint32, splitUint24 } from "../encoding";
import Streamer from "../streamer";
import { AimingMessageType } from "../consts";

interface PendingAngle {
    angle: number;
    resolvers: PromiseWithResolvers<void>;
}

interface MessageState {
    type: AimingMessageType;
    bytes: number[];
    identifier: number;
}

export default class AimingMessenger {
    private static realAngle = 0;
    private static angleChangeRes: (() => void) | null = null;
    private static angleChangeRej: (() => void) | null = null;
    private static angleQueue: PendingAngle[] = [];
    private static messageState = new WeakMap<Character, MessageState>();
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

        api.onStop(
            api.net.state.characters.get(api.stores.network.authId)!.projectiles.listen("aimAngle", (angle) => {
                if(!angle || angle !== this.angleQueue[0]?.angle) return;
                this.angleChangeRes?.();
            }, false)
        );

        const scene = api.stores.phaser.scene;
        api.patcher.after(scene.characterManager, "addCharacter", (_, __, character) => {
            this.listenToCharacter(character);
        });

        for(const character of scene.characterManager.characters.values()) {
            this.listenToCharacter(character);
        }
    }

    static listenToCharacter(character: Gimloader.Stores.Character) {
        if(character.id === api.stores.network.authId) return;

        api.patcher.before(character.aimingAndLookingAround, "setTargetAngle", (_, [angle]) => {
            const netChar = api.net.state.characters.get(character.id)!;
            AimingMessenger.handleBytes(netChar, floatToBytes(angle));
            return true;
        });
    }

    static reset() {
        this.angleQueue.forEach((pending) => pending.resolvers.reject());
        this.angleQueue.length = 0;
        this.angleChangeRej?.();
    }

    constructor(private readonly identifierBytes: number[]) {}

    async send(message: Message) {
        switch (typeof message) {
            case "number":
                if(isUint24(message)) {
                    return await this.sendPositiveInt24(message);
                } else if(isUint24(-message)) {
                    return await this.sendNegativeInt24(message);
                } else {
                    return await this.sendFloat(message);
                }
            case "string":
                return await this.sendString(message);
            case "boolean":
                return await this.sendBoolean(message);
            case "object":
                if(
                    Array.isArray(message)
                    && message.every(element => typeof element === "number")
                    && message.every(isUint8)
                    && message.length > 0
                ) {
                    return await this.sendBytes(message);
                } else {
                    return await this.sendObject(message);
                }
            default:
                throw new Error(`Cannot send message of type ${typeof message}`);
        }
    }

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

    async sendFloat(value: number) {
        const bytes = floatToBytes(value);
        await this.sendSpreadBytes(AimingMessageType.Float, bytes);
    }

    async sendByte(byte: number) {
        await this.sendHeader(AimingMessageType.Byte, byte);
    }

    async sendBytes(bytes: number[]) {
        if(bytes.length === 1) await this.sendHeader(AimingMessageType.Byte, bytes[0]);
        else if(bytes.length === 2) await this.sendHeader(AimingMessageType.TwoBytes, ...bytes);
        else if(bytes.length === 3) await this.sendHeader(AimingMessageType.ThreeBytes, ...bytes);
        else await this.sendSpreadBytes(AimingMessageType.SeveralBytes, bytes);
    }

    async sendString(string: string) {
        if(string.length <= 3) {
            return await this.sendHeader(AimingMessageType.ThreeCharacters, ...encodeCharacters(string));
        }
        await this.sendStringOfType(AimingMessageType.String, string);
    }

    async sendObject(obj: object) {
        const str = JSON.stringify(obj);
        if(str.length <= 3) {
            return await this.sendHeader(AimingMessageType.SmallObject, ...encodeCharacters(str));
        }
        await this.sendStringOfType(AimingMessageType.Object, str);
    }

    private async sendStringOfType(type: AimingMessageType, string: string) {
        const codes = encodeCharacters(string);
        await this.sendSpreadBytes(type, codes);
    }

    private async sendSpreadBytes(type: AimingMessageType, bytes: number[]) {
        const messages = [];
        for(let i = 3; i < bytes.length; i += 7) {
            messages.push(bytes.slice(i, i + 7));
        }

        const lastMessage = messages.at(-1)!;
        // Send the index of the last byte, plus 2 to differentiate from the 0/1 alternation
        const lastIndex = lastMessage.length + 1;

        await Promise.all([
            this.sendHeader(type, ...bytes.slice(0, 3)),
            ...messages.slice(0, -1).map(msg => AimingMessenger.sendAlternatedBytes(msg)),
            AimingMessenger.sendAlternatedBytes(lastMessage, lastIndex)
        ]);
    }

    // Maxmium of 3 free bytes
    private async sendHeader(type: AimingMessageType, ...free: number[]) {
        const header = [...this.identifierBytes, ...free];

        header[7] = type;

        // Vary the float to avoid dropping due to repeat angle
        AimingMessenger.alternate = !AimingMessenger.alternate;
        if(AimingMessenger.alternate) header[7] |= 0x80;

        await AimingMessenger.sendBytes(header);
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

    private static sendAngle(angle: number) {
        const resolvers = Promise.withResolvers<void>();
        this.angleQueue.push({
            angle,
            resolvers
        });

        if(this.angleQueue.length === 1) this.processQueue();
        return resolvers.promise;
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

    static handleBytes(char: Character, bytes: number[]) {
        const state = this.messageState.get(char);
        if(state) {
            const payload = bytes.slice(0, 7);
            const flag = bytes[7];

            // The flag will usually alternate between 0 and 1 to prevent repetition
            // But if it is the last message the flag will be set to the index of the last byte + 2
            // so we can determine how many bytes to read
            const done = flag >= 2;
            const data = done ? payload.slice(0, flag - 1) : payload;
            state.bytes.push(...data);

            if(Streamer.updateCallbacks.has(char)) {
                Streamer.onStreamData(char, data, done);
            }

            if(!done) return;

            if(state.type === AimingMessageType.Float) {
                Streamer.onMessage(state.identifier, bytesToFloat(state.bytes), char);
            } else if(state.type === AimingMessageType.String) {
                Streamer.onMessage(state.identifier, String.fromCharCode(...state.bytes), char);
            } else if(state.type === AimingMessageType.SeveralBytes) {
                Streamer.onMessage(state.identifier, state.bytes, char);
            } else if(state.type === AimingMessageType.Object) {
                try {
                    const value = JSON.parse(String.fromCharCode(...state.bytes));
                    Streamer.onMessage(state.identifier, value, char);
                } catch (e) {
                    api.logger.error("Failed to parse JSON object", e);
                }
            }

            this.messageState.delete(char);
            return;
        }

        const payload = bytes.slice(4, 7) as [number, number, number];
        const type = bytes[7] & 0x7F;

        const identifier = joinUint32(bytes.slice(0, 4));
        const callbacks = Streamer.callbacks.get(identifier);
        if(!callbacks) return;

        const gotValue = (value: Message) => {
            Streamer.onMessage(identifier, value, char);
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
                Streamer.startStream(callbacks.byteStream, char, bytes, true);
                gotValue(bytes);
                return;
            }

            case AimingMessageType.TwoBytes: {
                const bytes = payload.slice(0, 2);
                Streamer.startStream(callbacks.byteStream, char, bytes, true);
                gotValue(bytes);
                return;
            }

            case AimingMessageType.ThreeBytes: {
                Streamer.startStream(callbacks.byteStream, char, payload, true);
                gotValue(payload);
                return;
            }

            case AimingMessageType.ThreeCharacters: {
                const codes = payload.filter(b => b !== 0);
                Streamer.startStream(callbacks.stringStream, char, codes, true, String.fromCharCode);
                gotValue(String.fromCharCode(...codes));
                return;
            }

            case AimingMessageType.SmallObject: {
                const codes = payload.filter(b => b !== 0);
                gotValue(JSON.parse(String.fromCharCode(...codes)));
                return;
            }

            case AimingMessageType.Float:
            case AimingMessageType.Object: {
                this.messageState.set(char, { identifier, type, bytes: payload });
                return;
            }

            case AimingMessageType.SeveralBytes: {
                Streamer.startStream(callbacks.byteStream, char, payload, false);
                this.messageState.set(char, { identifier, type, bytes: payload });
                return;
            }

            case AimingMessageType.String: {
                Streamer.startStream(callbacks.stringStream, char, payload, false, String.fromCharCode);
                this.messageState.set(char, { identifier, type, bytes: payload });
                return;
            }
        }
    }
}
