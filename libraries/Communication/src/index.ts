import type { ByteStreamCallback, Message, OnMessageCallback, StringStreamCallback } from "./types";
import AimingMessenger from "./aiming";
import { getIdentifier, isUint24, isUint8 } from "./encoding";
import Streamer from "./streamer";
import StickerSender from "./stickers/stickerSending";
import { splicer } from "./util";

function listenToCharacter(character: Gimloader.Stores.Character) {
    if(character.id === api.stores.network.authId) return;
    api.patcher.before(character.aimingAndLookingAround, "setTargetAngle", (_, [angle]) => {
        const netChar = api.net.state.characters.get(character.id)!;
        const bytes = AimingMessenger.getBytes(netChar, angle);
        if(!bytes) return;

        AimingMessenger.handleBytes(netChar, bytes);
        return true;
    });
}

class EnabledManager {
    private static readonly onEnabledCallbacks = new Set<OnEnabledCallback>();
    private static lastEnabled = false;
    static ownedSticker: string | null = null;
    static stickerResolved = false;

    static init() {
        StickerSender.ownedStickerRes.then(() => this.handlePotentialEnabledChange());
        api.net.state.session.listen("phase", () => this.handlePotentialEnabledChange());
    }

    static handlePotentialEnabledChange = () => {
        const enabled = this.enabled;
        const lastEnabled = this.lastEnabled;
        if(enabled === lastEnabled) return;
        this.lastEnabled = enabled;

        for(const cb of this.onEnabledCallbacks) {
            cb(enabled);
        }
    };

    static get enabled() {
        return api.net.type === "Colyseus" && (api.net.state.session.phase === "game" || Boolean(this.ownedSticker));
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
    StickerSender.init();
    EnabledManager.init();

    const scene = api.stores.phaser.scene;

    api.patcher.after(scene.characterManager, "addCharacter", (_, __, character) => {
        listenToCharacter(character);
    });

    for(const character of scene.characterManager.characters.values()) {
        listenToCharacter(character);
    }

    api.net.state.characters.get(api.stores.network.authId)!.projectiles.listen("aimAngle", (angle) => {
        if(!angle || angle !== AimingMessenger.pendingAngle) return;
        AimingMessenger.angleChangeRes?.();
    }, false);

    api.net.on("WORLD_CHANGES", (data, editFn) => {
        StickerSender.receiver.handleAddedDevices(data.devices.addedDevices, editFn);
    });
});

type OnEnabledCallback = (enabled: boolean) => void;

StickerSender.ownedStickerRes.then(sticker => {
    EnabledManager.ownedSticker = sticker;
    EnabledManager.stickerResolved = true;
    EnabledManager.handlePotentialEnabledChange();
});

export default class Communication<T extends Message = Message> {
    readonly #identifierString: string;
    readonly #identifier: number[];
    readonly #onDisabledCallbacks: (() => void)[] = [];
    readonly #aimingMessenger: AimingMessenger;
    readonly #streamer: Streamer;

    static get enabled() {
        return EnabledManager.enabled;
    }

    constructor(name: string) {
        this.#identifier = getIdentifier(name);
        this.#identifierString = this.#identifier.join(",");
        this.#aimingMessenger = new AimingMessenger(this.#identifier);
        this.#streamer = new Streamer(this.#identifierString);
    }

    onEnabledChanged(callback: OnEnabledCallback) {
        return EnabledManager.onEnabledChanged(callback);
    }

    async send(message: T) {
        // Don't send messages if nobody else is in the server
        const players = [...api.net.state.characters.values()].filter(char => char.type === "player");
        if(players.length <= 1) return;

        let messenger: StickerSender | AimingMessenger;
        if(api.net.state.session.phase === "preGame") {
            if(!EnabledManager.ownedSticker) throw new Error("Cannot send messages when in lobby without owned stickers");
            messenger = new StickerSender(EnabledManager.ownedSticker, this.#identifier);
        } else {
            messenger = this.#aimingMessenger;
        }

        switch (typeof message) {
            case "number": {
                if(isUint24(message)) {
                    return await messenger.sendPositiveInt24(message);
                } else if(isUint24(-message)) {
                    return await messenger.sendNegativeInt24(message);
                } else {
                    return await messenger.sendNumber(message);
                }
            }
            case "string": {
                return await messenger.sendString(message);
            }
            case "boolean": {
                return await messenger.sendBoolean(message);
            }
            case "object": {
                if(
                    Array.isArray(message)
                    && message.every(element => typeof element === "number")
                    && message.every(isUint8)
                    && message.length > 0
                ) {
                    return await messenger.sendBytes(message);
                } else {
                    return await messenger.sendObject(message);
                }
            }
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
