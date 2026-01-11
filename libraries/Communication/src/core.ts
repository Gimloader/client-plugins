import { Type } from "./consts";
import { bytesToFloat, encodeCharacters, floatToBytes, joinUint24, splitUint24 } from "./encoding";
import type { Message, MessageState, OnMessageCallback, PendingAngle } from "./types";

export default class Runtime {
    private static pendingAngle = 0;
    private static sending = false;
    private static angleChangeRes: (() => void) | null = null;
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
            if(this.sending) editFn(null);
        });

        // Purge the queue once the game ends
        api.net.room.state.session.listen("phase", (phase: string) => {
            if(phase === "game") return;
            this.angleQueue.length = 0;
            this.angleChangeRes?.();
        }, false);
    }

    static async sendBoolean(identifier: number[], value: boolean) {
        await this.sendHeader(identifier, Type.Boolean, value ? 1 : 0);
    }

    static async sendPositiveUint24(identifier: number[], value: number) {
        const bytes = splitUint24(value);
        await this.sendHeader(identifier, Type.PositiveInt24, ...bytes);
    }

    static async sendNegativeUint24(identifier: number[], value: number) {
        const bytes = splitUint24(-value);
        await this.sendHeader(identifier, Type.NegativeInt24, ...bytes);
    }

    static async sendNumber(identifier: number[], value: number) {
        const bytes = floatToBytes(value);
        await this.sendHeader(identifier, Type.Float, ...bytes.slice(0, 3));
        await this.sendBytes(bytes.slice(3, 8));
    }

    static async sendThreeCharacters(identifier: number[], string: string) {
        const codes = encodeCharacters(string);
        await this.sendHeader(identifier, Type.ThreeCharacters, ...codes);
    }

    private static async sendStringOfType(identifier: number[], string: string, type: Type) {
        const codes = encodeCharacters(string);
        codes.push(0); // Null terminator

        await this.sendHeader(identifier, type, ...codes.slice(0, 3));

        // Send the string 7 bytes at a time
        for(let i = 3; i < codes.length; i += 7) {
            const msg = [];
            for(let j = 0; j < 7; j++) {
                if(i + j >= codes.length) break;
                msg[j] = codes[i + j];
            }

            await this.sendBytes(msg);
        }
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
    private static async sendBytes(bytes: number[]) {
        this.alternate = !this.alternate;
        if(this.alternate) bytes[7] = 1;

        await this.sendAngle(bytesToFloat(bytes));
    }

    private static async sendAngle(angle: number) {
        if(this.sending) {
            return new Promise<void>(res => {
                this.angleQueue.push({
                    angle,
                    resolve: res
                });
            });
        }

        this.angleQueue.unshift({ angle });
        this.sending = true;

        while(this.angleQueue.length) {
            const queuedAngle = this.angleQueue.shift()!;

            this.ignoreNextAngle = true;
            api.net.send("AIMING", { angle: queuedAngle.angle });
            await new Promise<void>(res => this.angleChangeRes = res);

            queuedAngle.resolve?.();
        }

        this.sending = false;

        // Send the real angle afterwards (we don't care about this being dropped)
        if(!this.pendingAngle) return;
        api.net.send("AIMING", { angle: this.pendingAngle });
    }

    static handleAngle(char: any, angle: number) {
        if(!angle) return;

        if(char.id === api.stores.network.authId) return this.angleChangeRes?.();

        const bytes = floatToBytes(angle);
        const identifierBytes = bytes.slice(0, 4);
        const identifierString = identifierBytes.join(",");
        const callbacksForIdentifier = this.callbacks.get(identifierString);

        const state = this.messageStates.get(char);

        if(callbacksForIdentifier) {
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
        } else if(state) {
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

            // Null-terminated strings
            let ended = false;

            for(let i = 0; i < 7; i++) {
                const byte = bytes[i];
                if(byte === 0) {
                    ended = true;
                    break;
                }

                state.recieved.push(byte);
            }

            if(!ended) return;
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
        }
    }
}
