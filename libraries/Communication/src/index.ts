import { Op } from "./consts";
import Runtime from "./core";
import { encodeStringMessage, getIdentifier, isUint8 } from "./encoding";
import type { EnabledStateCallback, Message, OnMessageCallback } from "./types";

let runtime: Runtime;

const onEnabledCallbacks = new Map<string, (() => void)[]>();
const onDisabledCallbacks = new Map<string, (() => void)[]>();

api.net.onLoad(() => {
    runtime = new Runtime(api.stores.network.authId);

    api.onStop(api.net.room.state.session.listen("phase", (phase: string) => {
        if(phase === "game") {
            for(const callbacks of onEnabledCallbacks.values()) {
                callbacks.forEach(cb => cb());
            }
        } else {
            for(const callbacks of onDisabledCallbacks.values()) {
                callbacks.forEach(cb => cb());
            }
        }
    }, false));

    api.onStop(api.net.room.state.characters.onAdd((char: any) => {
        api.onStop(
            char.projectiles.listen("aimAngle", (angle: number) => {
                runtime.handleAngle(char, angle);
            })
        );
    }));
});

export default class Communication<T extends Message = Message> {
    private readonly identifier: number[];
    private readonly identifierString: string;

    constructor(name: string) {
        this.identifier = getIdentifier(name);
        this.identifierString = this.identifier.join(",");
    }

    private get scriptCallbacks() {
        return runtime.callbacks.get(this.identifierString);
    }

    static get enabled() {
        return api.net.room?.state.session.phase === "game";
    }

    private get onEnabledCallbacks() {
        if(!onEnabledCallbacks.has(this.identifierString)) {
            onEnabledCallbacks.set(this.identifierString, []);
        }

        return onEnabledCallbacks.get(this.identifierString)!;
    }

    private get onDisabledCallbacks() {
        if(!onDisabledCallbacks.has(this.identifierString)) {
            onDisabledCallbacks.set(this.identifierString, []);
        }

        return onDisabledCallbacks.get(this.identifierString)!;
    }

    onEnabled(callback: EnabledStateCallback, immediate = true) {
        if(Communication.enabled && immediate) callback(true);

        const listenerCallback = () => callback(false);
        this.onEnabledCallbacks.push(listenerCallback);

        return () => {
            onEnabledCallbacks.set(
                this.identifierString,
                this.onEnabledCallbacks.filter(cb => cb !== listenerCallback)
            );
        };
    }

    onDisabled(callback: EnabledStateCallback, immediate = true) {
        if(!Communication.enabled && immediate) callback(true);

        const listenerCallback = () => callback(false);
        this.onDisabledCallbacks.push(listenerCallback);

        return () => {
            onDisabledCallbacks.set(
                this.identifierString,
                this.onDisabledCallbacks.filter(cb => cb !== listenerCallback)
            );
        };
    }

    async send(message: T) {
        if(!Communication.enabled) {
            throw new Error("Communication can only be used after the game is started");
        }

        switch (typeof message) {
            case "number": {
                if(isUint8(message)) {
                    await runtime.sendBytes([
                        ...this.identifier,
                        Op.TransmittingByteInteger,
                        message
                    ]);
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
                await runtime.sendBytes([
                    ...this.identifier,
                    Op.TransmittingBoolean,
                    message ? 1 : 0
                ]);
                break;
            }
            case "object": {
                const messages = encodeStringMessage(this.identifier, Op.TransmittingObject, JSON.stringify(message));
                await runtime.sendMessages(messages);
            }
        }
    }

    onMessage(callback: OnMessageCallback<T>) {
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
        onEnabledCallbacks.delete(this.identifierString);
        onDisabledCallbacks.delete(this.identifierString);
    }
}
