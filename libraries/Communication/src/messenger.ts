import { Type } from "./consts";
import { bytesToFloat, encodeCharacters, floatToBytes, joinUint24, splitUint24 } from "./encoding";
import type { Message, MessageState, OnMessageCallback, PendingAngle } from "./types";

export default class Messenger {
    private static pendingAngle = 0;
    private static angleChangeRes: (() => void) | null = null;
    private static angleChangeRej: (() => void) | null = null;
    private static readonly messageStates = new Map<string, MessageState>();
    private static readonly angleQueue: PendingAngle[] = [];
    static readonly callbacks = new Map<string, OnMessageCallback[]>();
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
        api.net.room.state.session.listen("phase", (phase: string) => {
            if(phase === "game") return;
            this.angleQueue.forEach((pending) => pending.reject());
            this.angleQueue.length = 0;
            this.angleChangeRej?.();
            this.messageStates.clear();
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

    async sendSmallObject(obj: object) {
        const string = JSON.stringify(obj);
        await this.sendHeader(Type.SmallObject, ...encodeCharacters(string));
    }

    async sendObject(obj: object) {
        const string = JSON.stringify(obj);
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

    static handleAngle(char: any, angle: number) {
        if(!angle) return;

        if(char.id === api.stores.network.authId) return this.angleChangeRes?.();

        const bytes = floatToBytes(angle);
        const state = this.messageStates.get(char);

        if(state) {
            const callbacksForState = this.callbacks.get(state.identifierString);
            if(!callbacksForState) return;

            const payload = bytes.slice(0, 7);
            const flag = bytes[7];

            const gotValue = (value: Message) => {
                this.messageStates.delete(char);

                callbacksForState.forEach(callback => {
                    callback(value, char);
                });
            };

            if(flag < 2) {
                state.recieved.push(...payload);
                return;
            }

            state.recieved.push(...payload.slice(0, flag - 1));

            if(state.type === Type.Float) {
                return gotValue(bytesToFloat(state.recieved));
            } else if(state.type === Type.SeveralBytes) {
                return gotValue(state.recieved);
            }

            const string = String.fromCharCode(...state.recieved);

            if(state.type === Type.String) {
                gotValue(string);
            } else if(state.type === Type.Object) {
                try {
                    const obj = JSON.parse(string);
                    gotValue(obj);
                } catch {
                    this.messageStates.delete(char);
                }
            }
        } else {
            const identifierBytes = bytes.slice(0, 4);
            const payload = bytes.slice(4, 7) as [number, number, number];
            const type = bytes[7] & 0x7F;

            const identifierString = identifierBytes.join(",");
            const callbacksForIdentifier = this.callbacks.get(identifierString);
            if(!callbacksForIdentifier) return;

            const gotValue = (value: Message) => {
                callbacksForIdentifier.forEach(callback => {
                    callback(value, char);
                });
            };

            if(type === Type.Boolean) {
                gotValue(payload[0] === 1);
            } else if(type === Type.PositiveInt24) {
                gotValue(joinUint24(...payload));
            } else if(type === Type.NegativeInt24) {
                gotValue(-joinUint24(...payload));
            } else if(type === Type.Byte) {
                gotValue([payload[0]]);
            } else if(type === Type.TwoBytes) {
                gotValue(payload.slice(0, 2));
            } else if(type === Type.ThreeBytes) {
                gotValue(payload);
            } else if(type === Type.ThreeCharacters) {
                const codes = payload.filter(b => b !== 0);
                gotValue(String.fromCharCode(...codes));
            } else if(type === Type.SmallObject) {
                const codes = payload.filter(b => b !== 0);
                gotValue(JSON.parse(String.fromCharCode(...codes)));
            } else if(type === Type.String || type === Type.Object || type === Type.SeveralBytes || type === Type.Float) {
                this.messageStates.set(char, {
                    type,
                    identifierString,
                    recieved: payload
                });
            }
        }
    }
}
