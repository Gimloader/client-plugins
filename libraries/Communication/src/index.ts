import Messenger from "./messenger";
import { getIdentifier, isUint24, isUint8 } from "./encoding";
import type { Message, OnMessageCallback } from "./types";

api.net.onLoad(() => {
    Messenger.init();

    api.onStop(api.net.room.state.characters.onAdd((char: any) => {
        api.onStop(
            char.projectiles.listen("aimAngle", (angle: number) => {
                Messenger.handleAngle(char, angle);
            })
        );
    }));
});

export default class Communication<T extends Message = Message> {
    readonly #identifierString: string;
    readonly #onDisabledCallbacks: (() => void)[] = [];
    readonly #messenger: Messenger;

    constructor(name: string) {
        const identifier = getIdentifier(name);
        this.#identifierString = identifier.join(",");
        this.#messenger = new Messenger(identifier);
    }

    get #onMessageCallbacks() {
        if(!Messenger.callbacks.has(this.#identifierString)) {
            Messenger.callbacks.set(this.#identifierString, []);
        }
        return Messenger.callbacks.get(this.#identifierString)!;
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

        // Don't send messages if nobody else is in the server
        const players = [...api.net.room.state.characters.values()].filter(char => char.type === "player");
        if(players.length <= 1) return;

        switch (typeof message) {
            case "number": {
                if(isUint24(message)) {
                    return await this.#messenger.sendPositiveInt24(message);
                } else if(isUint24(-message)) {
                    return await this.#messenger.sendNegativeInt24(message);
                } else {
                    return await this.#messenger.sendNumber(message);
                }
            }
            case "string": {
                if(message.length <= 3) {
                    return await this.#messenger.sendThreeCharacters(message);
                } else {
                    return await this.#messenger.sendString(message);
                }
            }
            case "boolean": {
                return await this.#messenger.sendBoolean(message);
            }
            case "object": {
                if(
                    Array.isArray(message)
                    && message.every(element => typeof element === "number")
                    && message.every(isUint8)
                    && message.length > 0
                ) {
                    if(message.length === 1) {
                        return await this.#messenger.sendByte(message[0]);
                    } else if(message.length === 2) {
                        return await this.#messenger.sendTwoBytes(message);
                    } else if(message.length === 3) {
                        return await this.#messenger.sendThreeBytes(message);
                    } else if(message.length > 3) {
                        return await this.#messenger.sendSeveralBytes(message);
                    }
                } else {
                    if(JSON.stringify(message).length <= 3) {
                        return await this.#messenger.sendSmallObject(message);
                    }
                    return await this.#messenger.sendObject(message);
                }
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
        Messenger.callbacks.delete(this.#identifierString);
        this.#onDisabledCallbacks.forEach(cb => cb());
    }
}
