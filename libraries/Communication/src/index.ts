import { Op } from "./consts";
import Runtime from "./core";
import { bytesToFloat, encodeStringMessage, getIdentifier, isUint8 } from "./encoding";
import type { Message, OnMessageCallback } from "./types";

let runtime: Runtime;

let onEnabledCallbacks: (() => void)[] = [];
let onDisabledCallbacks: (() => void)[] = [];

api.net.onLoad(() => {
    runtime = new Runtime(api.stores.network.authId);

    api.net.room.state.session.listen("phase", (phase: string) => {
        if(phase === "game") {
            onEnabledCallbacks.forEach(cb => cb());
        } else {
            onDisabledCallbacks.forEach(cb => cb());
        }
    }, false);

    api.onStop(api.net.room.state.characters.onAdd((char: any) => {
        const cleanupChar = char.projectiles.listen("aimAngle", (angle: number) => {
            runtime.handleAngle(char, angle);
        });
        api.onStop(cleanupChar);
        api.onStop(char.onRemove(cleanupChar));
    }));
});

type EnabledStateCallback = (immediate: boolean) => void;

export default class Communication {
    private identifier: number[];

    private get identifierString() {
        return this.identifier.join(",");
    }

    private get scriptCallbacks() {
        return runtime.callbacks.get(this.identifierString);
    }

    constructor(name: string) {
        this.identifier = getIdentifier(name);
    }

    static get enabled() {
        return api.net.room?.state.session.phase === "game";
    }

    static onEnabled(callback: EnabledStateCallback, immediate = true) {
        if(this.enabled && immediate) callback(true);

        const listenerCallback = () => callback(false);
        onEnabledCallbacks.push(listenerCallback);

        return () => {
            onEnabledCallbacks = onEnabledCallbacks.filter(cb => cb !== listenerCallback);
        };
    }

    static onDisabled(callback: EnabledStateCallback, immediate = true) {
        if(!this.enabled && immediate) callback(true);

        const listenerCallback = () => callback(false);
        onDisabledCallbacks.push(listenerCallback);

        return () => {
            onDisabledCallbacks = onDisabledCallbacks.filter(cb => cb !== listenerCallback);
        };
    }

    async send(message: Message) {
        if(!Communication.enabled) {
            throw new Error("Communication can only be used after the game is started");
        }

        switch (typeof message) {
            case "number": {
                if(isUint8(message)) {
                    const bytes = [
                        ...this.identifier,
                        Op.TransmittingByteInteger,
                        message
                    ];
                    await runtime.sendAngle(bytesToFloat(bytes));
                } else {
                    const messages = encodeStringMessage(this.identifier, Op.TransmittingNumber, String(message));
                    await runtime.sendMessages(messages);
                }
                break;
            }
            case "string": {
                const messages = encodeStringMessage(this.identifier, Op.TransmittingString, message);
                if(messages) await runtime.sendMessages(messages);
                break;
            }
            case "boolean": {
                const bytes = [
                    ...this.identifier,
                    Op.TransmittingBoolean,
                    message ? 1 : 0
                ];
                await runtime.sendAngle(bytesToFloat(bytes));
                break;
            }
            case "object": {
                const messages = encodeStringMessage(this.identifier, Op.TransmittingObject, JSON.stringify(message));
                await runtime.sendMessages(messages);
            }
        }
    }

    onMessage<T extends Message = Message>(callback: OnMessageCallback<T>) {
        if(!this.scriptCallbacks) {
            runtime.callbacks.set(this.identifierString, []);
        }

        this.scriptCallbacks!.push(callback as OnMessageCallback<Message>);

        return () => {
            runtime.callbacks.set(this.identifierString, this.scriptCallbacks!.filter(cb => cb !== callback));
        };
    }

    destroy() {
        runtime.callbacks.delete(this.identifierString);
    }
}
