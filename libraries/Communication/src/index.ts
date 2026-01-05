import { Type } from "./consts";
import Runtime from "./core";
import { encodeCharacters, encodeStringMessage, getIdentifier, isUint16, splitUint16 } from "./encoding";
import type { Message, OnMessageCallback } from "./types";

let runtime: Runtime;

const onEnabledCallbacks = new Map<string, (() => void)[]>();
const onDisabledCallbacks = new Map<string, (() => void)[]>();

api.net.onLoad(() => {
    runtime = new Runtime(api.stores.network.authId);

    api.onStop(api.net.room.state.characters.onAdd((char: any) => {
        api.onStop(
            char.projectiles.listen("aimAngle", (angle: number) => {
                runtime.handleAngle(char, angle);
            })
        );
    }));
});

export default class Communication<T extends Message = Message> {
    readonly #identifier: number[];
    readonly #identifierString: string;
    readonly #onDisabledCallbacks: (() => void)[] = [];

    constructor(name: string) {
        this.#identifier = getIdentifier(name);
        this.#identifierString = this.#identifier.join(",");
    }

    get #onMessageCallbacks() {
        if(!runtime.callbacks.has(this.#identifierString)) {
            runtime.callbacks.set(this.#identifierString, []);
        }
        return runtime.callbacks.get(this.#identifierString)!;
    }

    static get enabled() {
        return api.net.room?.state.session.phase === "game";
    }

    onEnabledChanged(callback: () => void) {
        const unsub: () => void = api.net.room.state.session.listen("phase", () => callback(), false);
        this.#onDisabledCallbacks.push(unsub);
        return unsub;
    }

    async send(message: T) {
        if(!Communication.enabled) {
            throw new Error("Communication can only be used after the game is started");
        }

        switch (typeof message) {
            case "number": {
                if(isUint16(message)) {
                    return await runtime.sendBytes([
                        ...this.#identifier,
                        Type.Uint16,
                        ...splitUint16(message)
                    ]);
                }
                const messages = encodeStringMessage(this.#identifier, Type.Number, String(message));
                return await runtime.sendMessages(messages);
            }
            case "string": {
                if(message.length <= 2) {
                    return await runtime.sendBytes([
                        ...this.#identifier,
                        Type.TwoCharacters,
                        ...encodeCharacters(message)
                    ]);
                }
                const messages = encodeStringMessage(this.#identifier, Type.String, message);
                return await runtime.sendMessages(messages);
            }
            case "boolean": {
                return await runtime.sendBytes([
                    ...this.#identifier,
                    Type.Boolean,
                    message ? 1 : 0
                ]);
            }
            case "object": {
                const messages = encodeStringMessage(this.#identifier, Type.Object, JSON.stringify(message));
                return await runtime.sendMessages(messages);
            }
        }
    }

    onMessage(callback: OnMessageCallback<T>) {
        const cb = callback as OnMessageCallback<Message>;
        this.#onMessageCallbacks.push(cb);

        return () => {
            const index = this.#onMessageCallbacks.indexOf(cb);
            if(index !== -1) this.#onMessageCallbacks.slice(index, 1);
        };
    }

    destroy() {
        runtime.callbacks.delete(this.#identifierString);
        this.#onDisabledCallbacks.forEach(cb => cb());
    }
}
