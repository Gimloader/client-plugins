import type { AddedDevices, Character, Message } from "../types";
import { bytesToDozens, dozensToBytes, dozensToFloat, dozensToNumber, encodeCharacters, floatToDozens, isUint8, numberToDozens, type DozensDecodeState } from "../encoding";
import Streamer from "../streamer";
import { maxDozensInt, maxStickerMessageLength, maxStickersBeforeWait, placements, sizeNumbers, sizes, stickerIdentifierLength, stickerMessageSizeLength, StickerMessageType, stickerWait } from "../consts";

function codeToSticker(code: number) {
    return {
        placement: placements[code % 3],
        size: sizes[Math.floor(code / 3)]
    };
}

function awaitBackToLobby() {
    return new Promise<void>((res) => {
        const unsub = api.net.colyseus.state.session.listen("loadingPhase", (loading) => {
            if(loading) return;
            unsub();
            res();
        }, false);
    });
}

interface QueuedMessage {
    stickerCodes: number[];
    resolvers: PromiseWithResolvers<void>;
}

interface PendingSendStickers {
    amount: number;
    resolvers: PromiseWithResolvers<void>;
}

async function getOwnedSticker(): Promise<string | null> {
    const res = await fetch("/api/cosmos/owned-stickers");
    if(!res.ok) return null;

    const json = await res.json();
    const sticker = json[0];
    if(!sticker) return null;

    return sticker.id;
}

interface StreamState {
    type: StickerMessageType;
    remainingDozens: number;
    decodeState: DozensDecodeState;
    bytes: number[];
    identifier: number;
}

export default class StickerMessenger {
    private static initialStickerPromise?: Promise<void>;
    private static stickerQueue: QueuedMessage[] = [];
    private static pendingStickers: PendingSendStickers[] = [];
    private static lastStickerWait = 0;
    private static stickersSentAfterLastWait = 0;
    private static characterYHistory = new WeakMap<Character, number[]>();
    private static stickerCodeBuffers = new WeakMap<Character, number[]>();
    private static streamState = new WeakMap<Character, StreamState>();
    private static resetStateTimeouts = new Map<Character, ReturnType<typeof setTimeout>>();

    static ownedStickerPromise = getOwnedSticker();
    static ownedSticker: string | null = null;

    static init() {
        this.ownedStickerPromise.then((sticker) => this.ownedSticker = sticker);

        api.onStop(
            api.net.colyseus.state.characters.onAdd((char) => {
                if(char.id === api.stores.network.authId) return;

                const history: number[] = [];
                this.characterYHistory.set(char, history);

                api.onStop(
                    char.listen("y", (y) => {
                        if(history.length >= 20) history.shift();
                        history.push(y);
                    })
                );
            })
        );

        api.net.colyseus.on("WORLD_CHANGES", (data) => {
            this.handleAddedDevices(data.devices.addedDevices);
        });
    }

    static reset() {
        for(const message of this.stickerQueue) message.resolvers.reject();
        for(const pending of this.pendingStickers) pending.resolvers.resolve();
        for(const timeout of this.resetStateTimeouts.values()) clearTimeout(timeout);

        this.resetStateTimeouts.clear();

        this.stickerQueue.length = 0;
        this.pendingStickers.length = 0;
    }

    static handleAddedDevices(addedDevices: AddedDevices) {
        if(addedDevices.devices.length === 0) return;
        const getValue = (index: number) => addedDevices.values[index];

        let stickerCount = 0;

        const incomingStickerBuffers = new Map<string, number[]>();
        for(const device of addedDevices.devices) {
            const y = device[2], deviceOptionIdIndex = device[5], optionIndexes = device[6];
            const deviceOptionId = getValue(deviceOptionIdIndex);
            if(deviceOptionId !== "placedSticker") continue;

            stickerCount++;

            const options: Record<string, any> = {};
            for(const [propertyIndex, valueIndex] of optionIndexes) {
                options[getValue(propertyIndex)] = getValue(valueIndex);
            }

            if(options.placedByCharacterId === api.stores.network.authId) {
                const firstPendingMessage = this.pendingStickers[0];
                if(!firstPendingMessage) continue;
                if(--firstPendingMessage.amount) continue;

                this.pendingStickers.shift();
                firstPendingMessage.resolvers.resolve();
                continue;
            }

            if(!incomingStickerBuffers.has(options.placedByCharacterId)) {
                incomingStickerBuffers.set(options.placedByCharacterId, []);
            }

            const placement = this.getPlacement(options.placedByCharacterId, y);
            const buffer = incomingStickerBuffers.get(options.placedByCharacterId)!;
            buffer.push(sizeNumbers.indexOf(options.scale) * 3 + placement);
        }

        for(const [characterId, buffer] of incomingStickerBuffers) {
            this.appendCharacterBuffer(characterId, buffer);
        }

        if(stickerCount > 1) {
            addedDevices.devices = addedDevices.devices.filter((d) => (
                getValue(d[5]) !== "placedSticker"
            ));
        }
    }

    static appendCharacterBuffer(characterId: string, newBuffer: number[]) {
        const char = api.net.colyseus.state.characters.get(characterId);
        if(!char) return;

        if(newBuffer.length === 1) {
            const buffer = this.stickerCodeBuffers.get(char);
            // If they sent two lone stickers, the first one was definitely not communication
            if(buffer && buffer.length <= 1) {
                this.stickerCodeBuffers.delete(char);
            }
        }

        if(!this.stickerCodeBuffers.has(char)) {
            this.stickerCodeBuffers.set(char, []);
        }

        const buffer = this.stickerCodeBuffers.get(char)!;
        buffer.push(...newBuffer);

        while(buffer.length > 0) {
            const consumed = this.readMessageFromBuffer(char, buffer);
            if(!consumed) break;

            buffer.splice(0, consumed);
        }

        const timeout = this.resetStateTimeouts.get(char);
        if(timeout) clearTimeout(timeout);

        if(buffer.length > 0) {
            this.resetStateTimeouts.set(
                char,
                setTimeout(() => {
                    this.stickerCodeBuffers.delete(char);
                    this.resetStateTimeouts.delete(char);
                    this.streamState.delete(char);
                    api.logger.warn("Reset state for", characterId, "after 2s of inactivity");
                }, 2000)
            );
        }
    }

    static readMessageFromBuffer(char: Character, buffer: number[]) {
        const streamState = this.streamState.get(char);

        if(streamState) {
            const done = buffer.length >= streamState.remainingDozens;
            const dozens = buffer.slice(0, streamState.remainingDozens);
            const { result, state } = dozensToBytes(dozens, streamState.decodeState);

            streamState.bytes.push(...result);

            if(Streamer.updateCallbacks.has(char)) {
                Streamer.onStreamData(char, result, done);
            }

            if(!done) {
                streamState.remainingDozens -= buffer.length;
                streamState.decodeState = state;
                return buffer.length;
            }

            if(streamState.type === StickerMessageType.Bytes) {
                Streamer.onMessage(streamState.identifier, streamState.bytes, char);
            } else if(streamState.type === StickerMessageType.String) {
                Streamer.onMessage(streamState.identifier, String.fromCharCode(...streamState.bytes), char);
            } else if(streamState.type === StickerMessageType.Object) {
                try {
                    const value = JSON.parse(String.fromCharCode(...streamState.bytes));
                    Streamer.onMessage(streamState.identifier, value, char);
                } catch (e) {
                    api.logger.log("Failed to parse JSON message", e);
                }
            }

            this.streamState.delete(char);
            return dozens.length;
        }

        const lengthWithId = stickerIdentifierLength + 1;
        if(buffer.length < lengthWithId + 1) return;

        const identifierDozens = buffer.slice(0, stickerIdentifierLength);
        const identifier = dozensToNumber(identifierDozens);
        const callbacks = Streamer.callbacks.get(identifier);

        const payload = buffer.slice(stickerIdentifierLength + 1);
        const gotValue = (value: Message) => {
            Streamer.onMessage(identifier, value, char);
        };

        const type = buffer[stickerIdentifierLength];
        switch (type) {
            case StickerMessageType.Boolean:
                gotValue(payload[0] === 1);
                return lengthWithId + 1;

            case StickerMessageType.Float:
                if(payload.length < 18) return;
                gotValue(dozensToFloat(payload.slice(0, 18)));
                return lengthWithId + 18;

            case StickerMessageType.PositiveDozen:
                gotValue(payload[0]);
                return lengthWithId + 1;

            case StickerMessageType.PositiveTwoDozen:
                if(payload.length < 2) return;
                gotValue(dozensToNumber(payload.slice(0, 2)));
                return lengthWithId + 2;

            case StickerMessageType.PositiveInt:
            case StickerMessageType.NegativeInt: {
                const length = payload[0];
                if(payload.length < 1 + length) return;

                const number = dozensToNumber(payload.slice(1, length + 1));
                gotValue(type === StickerMessageType.PositiveInt ? number : -number);
                return lengthWithId + length + 1;
            }
        }

        if(payload.length < stickerMessageSizeLength) return;

        const size = dozensToNumber(payload.slice(0, stickerMessageSizeLength));
        const done = size <= payload.length - stickerMessageSizeLength;
        const streamPayload = payload.slice(stickerMessageSizeLength, size + stickerMessageSizeLength);
        const decoded = dozensToBytes(streamPayload);

        if(!done) {
            this.streamState.set(char, {
                remainingDozens: size - streamPayload.length,
                decodeState: decoded.state,
                bytes: decoded.result,
                type,
                identifier
            });
        }

        if(callbacks) {
            if(type === StickerMessageType.Bytes) {
                Streamer.startStream(callbacks.byteStream, char, decoded.result, done);
            } else if(type === StickerMessageType.String) {
                Streamer.startStream(callbacks.stringStream, char, decoded.result, done, String.fromCharCode);
            }
        }

        if(!done) return buffer.length;

        switch (type) {
            case StickerMessageType.Bytes: {
                gotValue(decoded.result);
                break;
            }

            case StickerMessageType.String: {
                gotValue(String.fromCharCode(...decoded.result));
                break;
            }

            case StickerMessageType.Object: {
                const string = String.fromCharCode(...decoded.result);
                try {
                    gotValue(JSON.parse(string));
                } catch (e) {
                    api.logger.error("Failed to parse object message:", e);
                }
                break;
            }
        }

        return lengthWithId + stickerMessageSizeLength + size;
    }

    static getPlacement(characterId: string, stickerY: number) {
        const char = api.net.colyseus.state.characters.get(characterId);
        if(!char) throw new Error(`Could not find player ${characterId}`);

        const history = this.characterYHistory.get(char);
        if(!history) throw new Error("y history not found");

        for(let i = history.length - 1; i >= 0; i--) {
            const y = history[i];
            const difference = stickerY - y;

            if(difference === 50) {
                history.splice(0, i);
                return 0;
            } else if(difference === -10) {
                history.splice(0, i);
                return 1;
            } else if(difference === -60) {
                history.splice(0, i);
                return 2;
            }
        }

        throw new Error("Placement not found");
    }

    // TODO: Communicate with multiple stickers
    constructor(private readonly identifierDozens: number[]) {}

    async send(message: Message) {
        switch (typeof message) {
            case "number":
                if(Number.isInteger(message) && message < maxDozensInt && message > -maxDozensInt) {
                    if(message < 0) return await this.sendNegativeInteger(message);
                    else if(message < 12) return await this.sendIntUnderDozen(message);
                    else if(message < 12 ** 2) return await this.sendIntUnderTwoDozen(message);
                    else return await this.sendPositiveInteger(message);
                } else {
                    return await this.sendFloat(message);
                }
            case "string":
                return await this.sendString(message);
            case "boolean":
                return await this.sendBoolean(message);
            case "object":
                if(
                    Array.isArray(message)
                    && message.every(element => typeof element === "number")
                    && message.every(isUint8)
                    && message.length > 0
                ) {
                    return await this.sendBytes(message);
                } else {
                    return await this.sendObject(message);
                }
            default:
                throw new Error(`Cannot send message of type ${typeof message}`);
        }
    }

    private async sendBoolean(value: boolean) {
        await this.sendDozens(StickerMessageType.Boolean, [value ? 1 : 0]);
    }

    private async sendIntUnderDozen(value: number) {
        await this.sendDozens(StickerMessageType.PositiveDozen, [value]);
    }

    private async sendIntUnderTwoDozen(value: number) {
        const dozens = numberToDozens(value, 2);
        await this.sendDozens(StickerMessageType.PositiveTwoDozen, dozens);
    }

    private async sendPositiveInteger(value: number) {
        await this.sendIntegerOfType(value, StickerMessageType.PositiveInt);
    }

    private async sendNegativeInteger(value: number) {
        await this.sendIntegerOfType(-value, StickerMessageType.NegativeInt);
    }

    private async sendIntegerOfType(value: number, type: StickerMessageType) {
        const size = Math.ceil(Math.log(value) / Math.log(12));
        const dozens = numberToDozens(value, size);
        await this.sendDozens(type, [size, ...dozens]);
    }

    private async sendFloat(value: number) {
        await this.sendDozens(StickerMessageType.Float, floatToDozens(value));
    }

    private async sendString(value: string) {
        await this.sendStringOfType(value, StickerMessageType.String);
    }

    private async sendObject(value: object) {
        const str = JSON.stringify(value);
        await this.sendStringOfType(str, StickerMessageType.Object);
    }

    private async sendStringOfType(value: string, type: StickerMessageType) {
        const encodedCharacters = encodeCharacters(value);
        await this.sendEncodedBytes(type, encodedCharacters);
    }

    private async sendBytes(value: number[]) {
        await this.sendEncodedBytes(StickerMessageType.Bytes, value);
    }

    private async sendEncodedBytes(type: StickerMessageType, bytes: number[]) {
        const payloadDozens = bytesToDozens(bytes);
        if(payloadDozens.length > maxStickerMessageLength) {
            throw new RangeError(`Message is too long (cannot encode to over ${payloadDozens} dozens)`);
        }

        const length = numberToDozens(payloadDozens.length, stickerMessageSizeLength);
        const stickerCodes = [...this.identifierDozens, type, ...length, ...payloadDozens];

        await this.sendStickerCodes(stickerCodes);
    }

    private async sendDozens(type: StickerMessageType, dozens: number[]) {
        await this.sendStickerCodes([...this.identifierDozens, type, ...dozens]);
    }

    private async sendStickerCodes(codes: number[]) {
        if(StickerMessenger.initialStickerPromise) {
            await StickerMessenger.initialStickerPromise;
            await this.sendStickers(codes);
            return;
        }

        await this.sendStickers([codes[0]]);
        StickerMessenger.initialStickerPromise = StickerMessenger.pendingStickers.at(-1)?.resolvers.promise;
        await StickerMessenger.initialStickerPromise;
        await this.sendStickers(codes.slice(1));
    }

    private sendStickers(stickerCodes: number[]) {
        return new Promise<void>((res, rej) => {
            const resolvers = Promise.withResolvers<void>();
            StickerMessenger.stickerQueue.push({
                resolvers,
                stickerCodes
            });

            if(StickerMessenger.stickerQueue.length === 1) StickerMessenger.processQueue();
            resolvers.promise.then(res, rej);
        });
    }

    private static async processQueue() {
        const now = Date.now();
        this.lastStickerWait ||= now;
        if(now - this.lastStickerWait >= stickerWait) {
            this.stickersSentAfterLastWait = 0;
            this.lastStickerWait = now;
        }

        while(this.stickerQueue.length > 0) {
            let stickerRoom = maxStickersBeforeWait - this.stickersSentAfterLastWait;
            if(stickerRoom <= 0) {
                // This additional wait is needed to prevent stickers from being dropped
                await this.pendingStickers.at(-1)?.resolvers.promise;
                await new Promise<void>((res) => setTimeout(res, stickerWait));

                this.lastStickerWait = Date.now();
                this.stickersSentAfterLastWait = 0;
                stickerRoom = maxStickersBeforeWait;
            }

            if(api.net.colyseus.state.session.loadingPhase) {
                await awaitBackToLobby();
            }

            const queued = this.stickerQueue[0];
            if(!queued) return;

            const stickerAmount = Math.min(queued.stickerCodes.length, stickerRoom);
            for(const stickerCode of queued.stickerCodes.slice(0, stickerAmount)) {
                const stickerData = codeToSticker(stickerCode);
                api.net.colyseus.send("PLACE_STICKER", {
                    stickerId: this.ownedSticker!,
                    ...stickerData
                });
            }

            this.stickersSentAfterLastWait += stickerAmount;

            this.pendingStickers.push({
                amount: stickerAmount,
                resolvers: Promise.withResolvers<void>()
            });

            if(stickerAmount === queued.stickerCodes.length) {
                this.stickerQueue.shift();
                queued.resolvers.resolve();
            } else {
                queued.stickerCodes.splice(0, stickerAmount);
            }
        }
    }
}
