import type { ByteStreamCallback, Message, OnMessageCallback, StringStreamCallback } from "./types";
import AimingMessenger from "./messengers/aiming";
import { getIdentifier, identifierToBytes, identifierToDozens } from "./encoding";
import Streamer from "./streamer";
import StickerMessenger from "./messengers/stickers";
import { splicer } from "./util";

class EnabledManager {
    private static onEnabledCallbacks = new Set<OnEnabledCallback>();
    private static lastEnabled = false;
    static stickerResolved = false;
    static ready = StickerMessenger.ownedStickerPromise.then(() => {}, () => {});

    static init() {
        api.net.state.session.listen("phase", () => this.handlePotentialEnabledChange(false));
        this.ready.then(() => this.handlePotentialEnabledChange(true));
    }

    static handlePotentialEnabledChange(afterReady: boolean) {
        const enabled = this.enabled;
        const lastEnabled = this.lastEnabled;
        if(enabled === lastEnabled) return;

        this.lastEnabled = enabled;

        for(const cb of this.onEnabledCallbacks) {
            cb(enabled, afterReady);
        }
    }

    static get enabled() {
        if(api.net.type !== "Colyseus") return false;
        return api.net.state.session.phase === "game" || Boolean(StickerMessenger.ownedSticker);
    }

    static onEnabledChanged(callback: OnEnabledCallback) {
        this.onEnabledCallbacks.add(callback);

        return () => {
            this.onEnabledCallbacks.delete(callback);
        };
    }
}

api.net.onLoad(() => {
    AimingMessenger.init();
    StickerMessenger.init();
    EnabledManager.init();

    api.net.state.session.listen("phase", (phase) => {
        if(phase === "game") StickerMessenger.reset();
        else AimingMessenger.reset();

        Streamer.updateCallbacks.clear();
    }, false);
});

type OnEnabledCallback = (enabled: boolean, enabledAfterReady: boolean) => void;

interface QueuedMessage {
    message: Message;
    resolvers: PromiseWithResolvers<void>;
    aimingMessenger: AimingMessenger;
    stickerMessenger: StickerMessenger;
    retried?: boolean;
}

export default class Communication<T extends Message = Message> {
    static readonly #queue: QueuedMessage[] = [];
    readonly #aimingMessenger: AimingMessenger;
    readonly #stickerMessenger: StickerMessenger;
    readonly #streamer: Streamer;
    readonly #onDisabledCallbacks: (() => void)[] = [];

    static get enabled() {
        return EnabledManager.enabled;
    }

    get enabled() {
        return EnabledManager.enabled;
    }

    constructor(name: string) {
        const identifier = getIdentifier(name);
        this.#streamer = new Streamer(identifier);
        this.#aimingMessenger = new AimingMessenger(identifierToBytes(identifier));
        this.#stickerMessenger = new StickerMessenger(identifierToDozens(identifier));
    }

    onEnabledChanged(callback: OnEnabledCallback) {
        return EnabledManager.onEnabledChanged(callback);
    }

    send(message: T) {
        const resolvers = Promise.withResolvers<void>();
        Communication.#queue.push({
            aimingMessenger: this.#aimingMessenger,
            stickerMessenger: this.#stickerMessenger,
            message,
            resolvers
        });

        if(Communication.#queue.length === 1) Communication.#processQueue();
        return resolvers.promise;
    }

    static async #processQueue() {
        while(this.#queue.length > 0) {
            // Don't send messages if nobody else is in the server
            const players = [...api.net.state.characters.values()].filter(char => char.type === "player");
            if(players.length === 0) {
                for(const item of this.#queue) item.resolvers.resolve();
                this.#queue.length = 0;
                return;
            }

            const queued = this.#queue[0];
            if(!queued) return;

            try {
                if(api.net.state.session.phase === "preGame") {
                    await queued.stickerMessenger.send(queued.message);
                } else {
                    await queued.aimingMessenger.send(queued.message);
                }
            } catch {
                if(queued.retried) {
                    api.logger.error("Failed to send", queued.message, "after retry, giving up");
                    queued.resolvers.reject();
                    this.#queue.shift();
                } else {
                    api.logger.error("Failed to send", queued.message, "retrying...");
                    queued.retried = true;

                    // Wait a sec for gimkit to switch modes
                    await new Promise((res) => setTimeout(res, 500));
                }

                continue;
            }

            queued.resolvers.resolve();
            this.#queue.shift();
        }
    }

    onMessage(callback: OnMessageCallback<T>) {
        return splicer(this.#streamer.callbacks.message, callback);
    }

    onStringStream(callback: StringStreamCallback) {
        return splicer(this.#streamer.callbacks.stringStream, callback);
    }

    onByteStream(callback: ByteStreamCallback) {
        return splicer(this.#streamer.callbacks.byteStream, callback);
    }

    destroy() {
        this.#streamer.destroy();
        this.#onDisabledCallbacks.forEach(cb => cb());
    }
}
