import type { ByteStreamCallback, Message, OnMessageCallback, StringStreamCallback } from "./types";
import Messenger from "./messenger";
import { getIdentifier, isUint24, isUint8 } from "./encoding";

api.net.onLoad(() => {
    Messenger.init();

    api.onStop(api.net.state.characters.onAdd((char) => {
        api.onStop(
            char.projectiles.listen("aimAngle", (angle) => {
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

    get #callbacks() {
        if(!Messenger.callbacks.has(this.#identifierString)) {
            Messenger.callbacks.set(this.#identifierString, {
                message: [],
                stringStream: [],
                byteStream: []
            });
        }
        return Messenger.callbacks.get(this.#identifierString)!;
    }

    static get enabled() {
        return api.net.state?.session.phase === "game";
    }

    onEnabledChanged(callback: (enabled: boolean) => void) {
        const unsub = api.net.state.session.listen("phase", (phase) => {
            callback(phase === "game");
        }, false);

        this.#onDisabledCallbacks.push(unsub);
        return unsub;
    }

    async send(message: T) {
        if(!Communication.enabled) {
            throw new Error("Communication can only be used after the game is started");
        }

        // Don't send messages if nobody else is in the server
        const players = [...api.net.state.characters.values()].filter(char => char.type === "player");
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
                    const stringified = JSON.stringify(message);
                    if(stringified.length <= 3) {
                        return await this.#messenger.sendSmallObject(stringified);
                    }
                    return await this.#messenger.sendObject(stringified);
                }
            }
        }
    }

    onMessage(callback: OnMessageCallback<T>) {
        const cb = callback as OnMessageCallback<Message>;
        this.#callbacks.message.push(cb);

        return () => {
            const index = this.#callbacks.message.indexOf(cb);
            if(index !== -1) this.#callbacks.message.slice(index, 1);
        };
    }

    onStringStream(callback: StringStreamCallback) {
        this.#callbacks.stringStream.push(callback);

        return () => {
            const index = this.#callbacks.stringStream.indexOf(callback);
            if(index !== -1) this.#callbacks.stringStream.slice(index, 1);
        };
    }

    onByteStream(callback: ByteStreamCallback) {
        this.#callbacks.byteStream.push(callback);

        return () => {
            const index = this.#callbacks.byteStream.indexOf(callback);
            if(index !== -1) this.#callbacks.byteStream.slice(index, 1);
        };
    }

    destroy() {
        Messenger.callbacks.delete(this.#identifierString);
        this.#onDisabledCallbacks.forEach(cb => cb());
    }
}
