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

const isEnabled = () => api.net.room?.state.session === "game";

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

    static onEnabled(callback: () => void) {
        if(isEnabled()) callback();
        onEnabledCallbacks.push(callback);

        return () => {
            onEnabledCallbacks = onEnabledCallbacks.filter(cb => cb !== callback);
        };
    }

    static onDisabled(callback: () => void) {
        if(!isEnabled()) callback();
        onDisabledCallbacks.push(callback);

        return () => {
            onDisabledCallbacks = onDisabledCallbacks.filter(cb => cb !== callback);
        };
    }

    async send(message: Message) {
        if(!isEnabled()) {
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

    onMessage(callback: OnMessageCallback) {
        if(!this.scriptCallbacks) {
            runtime.callbacks.set(this.identifierString, []);
        }

        this.scriptCallbacks!.push(callback);

        return () => {
            runtime.callbacks.set(this.identifierString, this.scriptCallbacks!.filter(cb => cb !== callback));
        };
    }

    destroy() {
        runtime.callbacks.delete(this.identifierString);
    }
}
