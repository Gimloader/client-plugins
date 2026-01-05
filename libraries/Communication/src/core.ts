import { Type } from "./consts";
import { bytesToFloat, floatToBytes, getUint16, splitUint16 } from "./encoding";
import type { Message, MessageState, OnMessageCallback, PendingAngle } from "./types";

export default class Runtime {
    private pendingAngle = 0;
    private sending = false;
    private angleChangeRes: (() => void) | null = null;
    private readonly messageStates = new Map<string, MessageState>();
    private messageSendingAmount = 0;
    private readonly angleQueue: PendingAngle[] = [];
    readonly callbacks = new Map<string, OnMessageCallback[]>();
    private altType = false;

    constructor(private myId: string) {
        api.net.on("send:AIMING", (message, editFn) => {
            if(this.sending) return;

            this.pendingAngle = message.angle;
            editFn(null);
        });
    }

    // Make sure messages with an Op are different from the last so they don't get dropped
    async sendBytes(bytes: number[]) {
        this.altType = !this.altType;
        if(this.altType) bytes[4] += 10;
        await this.sendAngle(bytesToFloat(bytes));
    }

    private async sendAngle(angle: number) {
        if(this.sending) {
            return new Promise<void>(res => {
                this.angleQueue.push({
                    angle,
                    resolve: res
                });
            });
        }

        this.angleQueue.unshift({ angle });

        while(this.angleQueue.length) {
            const pendingAngle = this.angleQueue.shift()!;

            this.sending = true;
            api.net.send("AIMING", { angle: pendingAngle.angle });
            await new Promise<void>(res => this.angleChangeRes = res);
            this.sending = false;

            pendingAngle.resolve?.();
        }
    }

    private async sendRealAngle() {
        if(!this.pendingAngle) return;
        await this.sendAngle(this.pendingAngle);
    }

    handleAngle(char: any, angle: number) {
        if(!angle) return;

        if(char.id === this.myId) return this.angleChangeRes?.();

        const bytes = floatToBytes(angle);
        const identifierBytes = bytes.slice(0, 4);
        const identifierString = identifierBytes.join(",");
        const callbacksForIdentifier = this.callbacks.get(identifierString);

        const state = this.messageStates.get(char);

        if(callbacksForIdentifier) {
            const type = bytes[4] >= 10 ? bytes[4] - 10 : bytes[4];

            if(type === Type.Boolean) {
                callbacksForIdentifier.forEach(callback => {
                    callback(bytes[5] === 1, char);
                });
            } else if(type === Type.Uint16) {
                callbacksForIdentifier.forEach(callback => {
                    callback(getUint16(bytes[5], bytes[6]), char);
                });
            } else if(type === Type.TwoCharacters) {
                callbacksForIdentifier.forEach(callback => {
                    callback(String.fromCharCode(bytes[5], bytes[6]), char);
                });
            } else {
                const high = bytes[5];
                const low = bytes[6];

                this.messageStates.set(char, {
                    message: "",
                    charsRemaining: Math.min(1e3, (high << 8) + low),
                    identifierString,
                    type
                });
            }
        } else if(state) {
            for(let i = 0; i < Math.min(7, state.charsRemaining); i++) {
                state.message += String.fromCharCode(bytes[i]);
            }
            state.charsRemaining -= 7;

            if(state.charsRemaining <= 0) {
                const stateCallbacks = this.callbacks.get(state.identifierString);
                if(!stateCallbacks) return;

                let message: Message;
                switch (state.type) {
                    case Type.Number:
                        message = Number(state.message);
                        break;
                    case Type.Object:
                        message = JSON.parse(state.message);
                        break;
                    case Type.String:
                        message = state.message;
                        break;
                }

                stateCallbacks.forEach(callback => callback(message, char));
            }
        }
    }

    async sendMessages(messages: number[]) {
        this.messageSendingAmount++;
        await Promise.all(messages.map(message => this.sendAngle(message)));
        this.messageSendingAmount--;
        if(!this.messageSendingAmount) this.sendRealAngle();
    }
}
