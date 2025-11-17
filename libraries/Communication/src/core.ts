import { Op } from "./consts";
import { floatToBytes } from "./encoding";
import type { Message, MessageState, OnMessageCallback } from "./types";

export default class Runtime {
    private sending = false;
    private pendingAngle = 0;
    private ignoreNextAngle = false;
    private angleChangeRes: (() => void) | null = null;
    private messageStates = new Map<string, MessageState>();
    private messageQue: {
        messages: number[];
        resolve?: () => void;
    }[] = [];

    callbacks = new Map<string, OnMessageCallback[]>();

    constructor(private myId: string) {
        api.net.on("send:AIMING", (message, editFn) => {
            if(!this.sending) return;

            if(this.ignoreNextAngle) {
                this.ignoreNextAngle = false;
                return;
            }

            this.pendingAngle = message.angle;
            editFn(null);
        });
    }

    private async sendRealAngle() {
        await this.sendAngle(this.pendingAngle);
    }

    handleAngle(char: any, angle: number) {
        if(!angle) return;

        if(char.id === this.myId) {
            return this.angleChangeRes?.();
        }

        const bytes = floatToBytes(angle);
        const identifierBytes = bytes.slice(0, 4);
        const identifierString = identifierBytes.join(",");
        const callbacksForIdentifier = this.callbacks.get(identifierString);

        const state = this.messageStates.get(char);

        if(callbacksForIdentifier) {
            const op = bytes[4];

            if(op === Op.TransmittingBoolean) {
                callbacksForIdentifier.forEach(callback => {
                    callback(bytes[5] === 1, char);
                });
            } else if(op === Op.TransmittingByteInteger) {
                callbacksForIdentifier.forEach(callback => {
                    callback(bytes[5], char);
                });
            } else {
                const high = bytes[5];
                const low = bytes[6];

                this.messageStates.set(char, {
                    message: "",
                    charsRemaining: Math.min(1e3, (high << 8) + low),
                    identifierString,
                    op
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
                switch (state.op) {
                    case Op.TransmittingNumber:
                        message = Number(state.message);
                        break;
                    case Op.TransmittingObject:
                        message = JSON.parse(state.message);
                        break;
                    case Op.TransmittingString:
                        message = state.message;
                        break;
                }

                stateCallbacks.forEach(callback => callback(message, char));
            }
        }
    }

    async sendAngle(angle: number) {
        api.net.send("AIMING", { angle });
        await new Promise<void>(res => this.angleChangeRes = res);
    }

    async sendMessages(messages: number[]) {
        if(this.sending) {
            return new Promise<void>(res =>
                this.messageQue.push({
                    messages,
                    resolve: res
                })
            );
        }

        this.sending = true;

        this.messageQue.unshift({ messages });

        while(this.messageQue.length) {
            const pendingMessage = this.messageQue.shift()!;

            for(const message of pendingMessage.messages) {
                this.ignoreNextAngle = true;
                await this.sendAngle(message);
            }

            pendingMessage.resolve?.();

            this.ignoreNextAngle = true;
            await this.sendRealAngle();
        }

        this.sending = false;
    }
}
