import { bytesToFloat, decodeBytes, joinUint16, joinUint24 } from "../encoding";
import Streamer from "../streamer";
import { placements, sizes, StickerMessageType, type Placement, type Size, type StickerData } from "./consts";

export const sizeMap = new Map([
    [0.1, "Small"],
    [0.15, "Normal"],
    [0.2, "Large"],
    [0.25, "Extra Large"]
]);

function stickerToCode(sticker: StickerData): number {
    return sizes.indexOf(sticker.size) * 3 + placements.indexOf(sticker.placement);
}

interface StickerMessage {
    identifierString: string;
    type: StickerMessageType;
    payload: number[];
    length: number;
    done: boolean;
}

function getStickerDeviceOptions(optionIndexes: [number, number][], getValue: (index: number) => any) {
    const options: Record<string, any> = {};
    for(const [propertyIndex, valueIndex] of optionIndexes) {
        options[getValue(propertyIndex)] = getValue(valueIndex);
    }
    return options as StickerDeviceOptions;
}

function getStickerMessage(bytes: number[]): StickerMessage | null {
    if(bytes.length < 6) return null;
    const identifier = bytes.slice(0, 4);
    const identifierString = identifier.join(",");
    const type = bytes[4];

    let bytesAmount: number;
    if(type === StickerMessageType.Boolean) {
        bytesAmount = 1;
    } else if(type === StickerMessageType.PositiveInt24 || type === StickerMessageType.NegativeInt24) {
        bytesAmount = 3;
        if(bytes.length < 5 + 3) return null;
    } else if(type === StickerMessageType.Float) {
        bytesAmount = 8;
        if(bytes.length < 5 + 8) return null;
    } else {
        if(bytes.length < 7) return null;
        bytesAmount = joinUint16(bytes[5], bytes[6]);
    }

    const isFixedLength = [StickerMessageType.Boolean, StickerMessageType.Float, StickerMessageType.PositiveInt24, StickerMessageType.NegativeInt24].includes(type);
    const payloadStart = isFixedLength ? 5 : 7;
    const payload = bytes.slice(payloadStart, payloadStart + bytesAmount);

    return {
        identifierString,
        type,
        payload,
        length: payloadStart + payload.length,
        done: payload.length === bytesAmount
    };
}

interface AddedDevices {
    devices: any[];
    values: any[];
}

interface StickerDeviceOptions {
    depth: number;
    placedAtTimeStamp: number;
    placedByCharacterId: string;
    scale: number;
    stickerId: string;
}

interface PendingSendStickers {
    amount: number;
    resolvers: PromiseWithResolvers<void>;
}

export default class StickerReceiver {
    readonly pendingStickers: PendingSendStickers[] = [];
    private readonly stickerCodeBuffers = new Map<string, number[]>();
    private readonly characterYHistory = new Map<string, number[]>();

    init() {
        api.onStop(
            api.net.state.characters.onAdd((char) => {
                if(char.id === api.stores.network.authId) return;
                const history: number[] = [];
                this.characterYHistory.set(char.id, history);
                api.onStop(
                    char.listen("y", (y) => {
                        if(history.length === 10) {
                            history.splice(0, 1);
                        }
                        history.push(y);
                    })
                );
            })
        );
    }

    private getPlacement(characterId: string, stickerY: number): Placement {
        const history = this.characterYHistory.get(characterId)!;
        for(let i = history.length - 1; i >= 0; i--) {
            const y = history[i];
            const difference = stickerY - y;
            if(difference === -10) {
                history.splice(0, i);
                return "Exact";
            } else if(difference === -60) {
                history.splice(0, i);
                return "Above";
            } else if(difference === 50) {
                history.splice(0, i);
                return "Below";
            }
        }
        throw new Error("Placement not found");
    }

    private handleMessage(characterId: string, originalBytesAmount: number, message: StickerMessage) {
        const callbacks = Streamer.callbacks.get(message.identifierString);
        if(!callbacks) return;
        const char = api.net.state.characters.get(characterId)!;
        const gotValue = (value: any) => {
            callbacks.message.forEach((cb) => cb(value, char));
        };

        const addPayloadToStream = () => {
            const resolve = Streamer.updateResolvers.get(char);
            if(!resolve) return;

            const newBytes = message.payload.slice(originalBytesAmount - 7);
            resolve({ data: newBytes, done: message.done });
            Streamer.updatePromises.delete(char);
            Streamer.updateResolvers.delete(char);
        };

        switch (message.type) {
            case StickerMessageType.Boolean:
                if(!message.done) return;
                gotValue(message.payload[0] === 1);
                return;
            case StickerMessageType.Float:
                if(!message.done) return;
                gotValue(bytesToFloat(message.payload));
                return;
            case StickerMessageType.PositiveInt24:
                if(!message.done) return;
                gotValue(joinUint24(message.payload[0], message.payload[1], message.payload[2]));
                return;
            case StickerMessageType.NegativeInt24:
                if(!message.done) return;
                gotValue(-joinUint24(message.payload[0], message.payload[1], message.payload[2]));
                return;
            case StickerMessageType.Bytes: {
                if(message.payload.length === 0) return;
                if(originalBytesAmount < 8) {
                    Streamer[message.done ? "startStream" : "startCompletedStream"](callbacks.byteStream, char, message.payload);
                } else {
                    addPayloadToStream();
                }
                if(!message.done) return;
                gotValue(message.payload);
                return;
            }
            case StickerMessageType.String: {
                if(message.payload.length === 0) return;
                if(originalBytesAmount < 8) {
                    if(!message.done) {
                        Streamer.startStream(callbacks.stringStream, char, message.payload, String.fromCharCode);
                    } else {
                        Streamer.startCompletedStream(callbacks.stringStream, char, String.fromCharCode(...message.payload));
                    }
                } else {
                    addPayloadToStream();
                }
                if(!message.done) return;
                gotValue(String.fromCharCode(...message.payload));
                return;
            }

            case StickerMessageType.Object: {
                if(!message.done) return;
                try {
                    gotValue(JSON.parse(String.fromCharCode(...message.payload)));
                } catch (e) {
                    console.error("Failed to parse object message:", e);
                }
                return;
            }
        }
    }

    private appendCharacterBuffer(characterId: string, buffer: number[]) {
        if(buffer.length === 1) {
            const globalBuffer = this.stickerCodeBuffers.get(characterId);
            // If they sent two lone stickers, the first one was definitely not communication
            if(globalBuffer && globalBuffer.length <= 1) {
                this.stickerCodeBuffers.delete(characterId);
            }
        }

        if(!this.stickerCodeBuffers.has(characterId)) {
            this.stickerCodeBuffers.set(characterId, []);
        }

        const globalBuffer = this.stickerCodeBuffers.get(characterId)!;
        const originalBytesAmount = decodeBytes(globalBuffer).length;

        globalBuffer.push(...buffer);
        const bytes = decodeBytes(globalBuffer);
        if(bytes.length === 0) return;

        let start = 0;
        while(start < bytes.length) {
            const message = getStickerMessage(bytes.slice(start));
            if(!message) break;
            start += message.length;
            if(message.done) {
                this.stickerCodeBuffers.delete(characterId);
            }
            this.handleMessage(characterId, originalBytesAmount, message);
        }
    }

    handleAddedDevices(addedDevices: AddedDevices, editFn: (data: any) => void) {
        if(addedDevices.devices.length === 0) return;
        const getValue = (index: number) => addedDevices.values[index];

        let shouldCancel = false;

        const incomingStickerBuffers = new Map<string, number[]>();
        for(const device of addedDevices.devices) {
            const y = device[2], deviceOptionIdIndex = device[5], optionIndexes = device[6];
            const deviceOptionId = getValue(deviceOptionIdIndex);
            if(deviceOptionId !== "placedSticker") continue;

            shouldCancel = true;

            const options = getStickerDeviceOptions(optionIndexes, getValue);
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

            const buffer = incomingStickerBuffers.get(options.placedByCharacterId)!;
            const size = sizeMap.get(options.scale)! as Size;
            buffer.push(stickerToCode({
                size,
                placement: this.getPlacement(options.placedByCharacterId, y)
            }));
        }

        if(!shouldCancel) return;
        editFn(null);

        for(const [characterId, buffer] of incomingStickerBuffers) {
            this.appendCharacterBuffer(characterId, buffer);
        }
    }
}
