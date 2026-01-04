import { Op } from "./consts";
import { bytesToFloat, floatToBytes } from "./encoding";
import type { Message, MessageState, OnMessageCallback, PendingAngle } from "./types";

export default class Runtime {
    private pendingAngle = 0;
    private ignoreNextAngle = false;
    private angleChangeRes: (() => void) | null = null;
    private readonly messageStates = new Map<string, MessageState>();
    private messageSendingAmount = 0;
    private readonly angleQueue: PendingAngle[] = [];
    private sendingAngle = false;
    readonly callbacks = new Map<string, OnMessageCallback[]>();
    private alternation: 0 | 1 = 0;

    constructor(private myId: string) {
        api.net.on("send:AIMING", (message, editFn) => {
            if(!this.messageSendingAmount) return;

            if(this.ignoreNextAngle) {
                this.ignoreNextAngle = false;
                return;
            }

            this.pendingAngle = message.angle;
            editFn(null);
        });
    }

    // Make sure single-angle messages aren't dropped
    async sendBytes(bytes: number[]) {
        await this.sendAngle(bytesToFloat([...bytes, this.alternation]));
        this.alternation === 0 ? this.alternation = 1 : this.alternation = 0;
    }

    async sendAngle(angle: number) {
        if(this.sendingAngle) {
            return new Promise<void>(res => {
                this.angleQueue.push({
                    angle,
                    resolve: res
                });
            });
        }

        this.sendingAngle = true;
        this.angleQueue.unshift({ angle });

        while(this.angleQueue.length) {
            const pendingAngle = this.angleQueue.shift()!;

            this.ignoreNextAngle = true;
            api.net.send("AIMING", { angle: pendingAngle.angle });
            await new Promise<void>(res => this.angleChangeRes = res);
            this.ignoreNextAngle = false;

            pendingAngle.resolve?.();
        }

        this.sendingAngle = false;
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

    async sendMessages(messages: number[]) {
        this.messageSendingAmount++;
        await Promise.all([
            ...messages.map(message => this.sendAngle(message)),
            this.sendRealAngle
        ]);
        this.messageSendingAmount--;
    }
}
