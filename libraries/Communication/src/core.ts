import { Type } from "./consts";
import { bytesToFloat, encodeCharacters, floatToBytes, joinUint24, splitUint24 } from "./encoding";
import type { Message, MessageState, OnMessageCallback, PendingAngle } from "./types";

export default class Runtime {
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

    static async sendBoolean(identifier: number[], value: boolean) {
        await this.sendHeader(identifier, Type.Boolean, value ? 1 : 0);
    }

    static async sendPositiveInt24(identifier: number[], value: number) {
        const bytes = splitUint24(value);
        await this.sendHeader(identifier, Type.PositiveInt24, ...bytes);
    }

    static async sendNegativeInt24(identifier: number[], value: number) {
        const bytes = splitUint24(-value);
        await this.sendHeader(identifier, Type.NegativeInt24, ...bytes);
    }

    static async sendNumber(identifier: number[], value: number) {
        const bytes = floatToBytes(value);

        await Promise.all([
            this.sendHeader(identifier, Type.Float, ...bytes.slice(0, 3)),
            this.sendBytes(bytes.slice(3, 8))
        ]);
    }

    static async sendThreeCharacters(identifier: number[], string: string) {
        const codes = encodeCharacters(string);
        await this.sendHeader(identifier, Type.ThreeCharacters, ...codes);
    }

    private static async sendStringOfType(identifier: number[], string: string, type: Type) {
        const codes = encodeCharacters(string);
        const messages: number[][] = [];

        // Send the string 7 bytes at a time
        for(let i = 3; i < codes.length; i += 7) {
            const msg = [];
            for(let j = 0; j < 7; j++) {
                if(i + j >= codes.length) break;
                msg[j] = codes[i + j];
            }

            messages.push(msg);
        }

        // Signal that the message has ended
        messages.at(-1)![7] = 2;

        await Promise.all([
            this.sendHeader(identifier, type, ...codes.slice(0, 3)),
            ...messages.map((msg, i) =>
                this.sendBytes(
                    msg,
                    i === messages.length - 1 ? 2 : undefined
                )
            )
        ]);
    }

    static async sendString(identifier: number[], string: string) {
        await this.sendStringOfType(identifier, string, Type.String);
    }

    static async sendObject(identifier: number[], obj: object) {
        const string = JSON.stringify(obj);
        await this.sendStringOfType(identifier, string, Type.Object);
    }

    // Maxmium of 3 free bytes
    private static async sendHeader(identifier: number[], type: Type, ...free: number[]) {
        const header = [...identifier, ...free];

        // Vary the float to avoid dropping due to repeat angle
        header[7] = type;
        this.alternate = !this.alternate;
        if(this.alternate) header[7] |= 0x80;

        await this.sendAngle(bytesToFloat(header));
    }

    // Maxmium of 7 bytes
    private static async sendBytes(bytes: number[], overrideLast?: number) {
        if(overrideLast) {
            bytes[7] = overrideLast;
        } else {
            this.alternate = !this.alternate;
            if(this.alternate) bytes[7] = 1;
        }

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
        const identifierBytes = bytes.slice(0, 4);
        const identifierString = identifierBytes.join(",");
        const callbacksForIdentifier = this.callbacks.get(identifierString);

        const state = this.messageStates.get(char);

        if(state) {
            const callbacksForIdentifier = this.callbacks.get(state.identifierString);
            if(!callbacksForIdentifier) return;

            const gotValue = (value: Message) => {
                this.messageStates.delete(char);

                callbacksForIdentifier.forEach(callback => {
                    callback(value, char);
                });
            };

            if(state.type === Type.Float) {
                const numberBytes = [...state.recieved, ...bytes.slice(0, 5)];
                return gotValue(bytesToFloat(numberBytes));
            }

            state.recieved.push(...bytes.slice(0, 7).filter(byte => byte !== 0));
            if(bytes[7] !== 2) return;

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
        } else if(callbacksForIdentifier) {
            const type = bytes[7] & 0x7F;

            const gotValue = (value: Message) => {
                callbacksForIdentifier.forEach(callback => {
                    callback(value, char);
                });
            };

            if(type === Type.Boolean) {
                gotValue(bytes[4] === 1);
            } else if(type === Type.PositiveInt24) {
                gotValue(joinUint24(bytes[4], bytes[5], bytes[6]));
            } else if(type === Type.NegativeInt24) {
                gotValue(-joinUint24(bytes[4], bytes[5], bytes[6]));
            } else if(type === Type.Float) {
                this.messageStates.set(char, {
                    type: Type.Float,
                    identifierString,
                    recieved: bytes.slice(4, 7)
                });
            } else if(type === Type.ThreeCharacters) {
                const codes = bytes.slice(4, 7).filter(b => b !== 0);
                gotValue(String.fromCharCode(...codes));
            } else if(type === Type.String || type === Type.Object) {
                this.messageStates.set(char, {
                    type,
                    identifierString,
                    recieved: bytes.slice(4, 7)
                });
            }
        }
    }
}
