import Runtime from "./core";
import { getIdentifier, isUint24 } from "./encoding";
import type { Message, OnMessageCallback } from "./types";

api.net.onLoad(() => {
    Runtime.init(api.stores.network.authId);

    api.onStop(api.net.room.state.characters.onAdd((char: any) => {
        api.onStop(
            char.projectiles.listen("aimAngle", (angle: number) => {
                Runtime.handleAngle(char, angle);
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
        if(!Runtime.callbacks.has(this.#identifierString)) {
            Runtime.callbacks.set(this.#identifierString, []);
        }
        return Runtime.callbacks.get(this.#identifierString)!;
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
                if(isUint24(message)) {
                    return await Runtime.sendPositiveUint24(this.#identifier, message);
                } else if(isUint24(-message)) {
                    return await Runtime.sendNegativeUint24(this.#identifier, message);
                } else {
                    return await Runtime.sendNumber(this.#identifier, message);
                }
            }
            case "string": {
                if(message.length <= 3) {
                    return await Runtime.sendThreeCharacters(this.#identifier, message);
                } else {
                    return await Runtime.sendString(this.#identifier, message);
                }
            }
            case "boolean": {
                return await Runtime.sendBoolean(this.#identifier, message);
            }
            case "object": {
                return await Runtime.sendObject(this.#identifier, message);
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
        Runtime.callbacks.delete(this.#identifierString);
        this.#onDisabledCallbacks.forEach(cb => cb());
    }
}
