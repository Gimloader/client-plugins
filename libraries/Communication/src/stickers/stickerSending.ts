import { encodeBytes, encodeCharacters, floatToBytes, splitUint16, splitUint24 } from "../encoding";
import { placements, sizes, StickerMessageType, type StickerData } from "./consts";
import StickerReceiver from "./stickerReceiving";

const maxStickersBeforeWait = 500;
const stickerWait = 200;
const maxMessageBytes = 0xFFFF;

function codeToSticker(code: number): StickerData {
    return {
        placement: placements[code % 3],
        size: sizes[Math.floor(code / 3)]
    };
}

async function awaitBackToLobby() {
    await new Promise<void>((res) => {
        const unsub = api.net.state.session.listen("loadingPhase", (loading) => {
            if(loading) return;
            unsub();
            res();
        }, false);
    });
}

interface PendingMessage {
    stickerCodes: number[];
    resolvers: PromiseWithResolvers<void>;
}

interface PendingSegment {
    stickerCodes: number[];
    resolvers?: PromiseWithResolvers<void>;
}

async function getOwnedSticker(): Promise<string | null> {
    const res = await fetch("/api/cosmos/owned-stickers");
    if(!res.ok) return null;
    const sticker = (await res.json())[0];
    if(!sticker) return null;
    return sticker.id;
}

export default class StickerMessenger {
    private static initialStickerPromise: Promise<void> | null = null;
    private static readonly stickerQueue: PendingMessage[] = [];
    private static lastStickerWait = 0;
    private static stickersSentAfterLastWait = 0;
    private static sending = false;
    static receiver = new StickerReceiver();

    static ownedStickerRes = getOwnedSticker();

    static async create(identifier: number[]) {
        const ownedSticker = await this.ownedStickerRes;
        return ownedSticker ? new StickerMessenger(ownedSticker, identifier) : null;
    }

    static init() {
        api.onStop(
            api.net.state.session.listen("phase", (phase) => {
                if(phase !== "game") return;
                for(const message of this.stickerQueue) {
                    message.resolvers.reject();
                }

                this.stickerQueue.length = 0;
            }, false)
        );

        this.receiver.init();
    }

    // TODO: Communicate with multiple stickers
    constructor(private readonly stickerId: string, private readonly identifier: number[]) {}

    async sendPositiveInt24(value: number) {
        const bytes = splitUint24(value);
        await this.sendMessage([StickerMessageType.PositiveInt24, ...bytes]);
    }

    async sendNegativeInt24(value: number) {
        const bytes = splitUint24(-value);
        await this.sendMessage([StickerMessageType.NegativeInt24, ...bytes]);
    }

    async sendNumber(value: number) {
        const bytes = floatToBytes(value);
        await this.sendMessage([StickerMessageType.Float, ...bytes]);
    }

    async sendBoolean(value: boolean) {
        await this.sendMessage([StickerMessageType.Boolean, value ? 1 : 0]);
    }

    async sendString(value: string) {
        await this.sendStringOfType(value, StickerMessageType.String);
    }

    async sendObject(value: object) {
        const str = JSON.stringify(value);
        await this.sendStringOfType(str, StickerMessageType.Object);
    }

    async sendBytes(bytes: number[]) {
        await this.sendMessage([StickerMessageType.Bytes, ...StickerMessenger.getLengthHeader(bytes.length), ...bytes]);
    }

    private async sendStringOfType(value: string, type: StickerMessageType) {
        const encodedCharacters = encodeCharacters(value);
        await this.sendMessage([type, ...StickerMessenger.getLengthHeader(encodedCharacters.length), ...encodedCharacters]);
    }

    private static getLengthHeader(bytesLength: number) {
        if(bytesLength > maxMessageBytes) {
            throw new RangeError(`Message length cannot be over ${maxMessageBytes} bytes`);
        }
        return splitUint16(bytesLength);
    }

    private async sendMessage(bytes: number[]) {
        const stickerCodes = encodeBytes([...this.identifier, ...bytes]);

        if(StickerMessenger.initialStickerPromise) {
            await StickerMessenger.initialStickerPromise;
            return await this.sendStickers(stickerCodes);
        }

        await (StickerMessenger.initialStickerPromise = this.sendStickers([stickerCodes[0]]));
        await this.sendStickers(stickerCodes.slice(1));
    }

    private async sendStickers(stickerCodes: number[]) {
        const resolvers = Promise.withResolvers<void>();
        StickerMessenger.stickerQueue.push({
            resolvers,
            stickerCodes
        });

        if(!StickerMessenger.sending) this.processQueue();
        await resolvers.promise;
    }

    private static getStickerSegments() {
        const stickerRoom = maxStickersBeforeWait - this.stickersSentAfterLastWait;
        const segments: PendingSegment[] = [];

        for(const message of this.stickerQueue) {
            if(message.stickerCodes.length <= stickerRoom) {
                segments.push(message);
                this.stickerQueue.shift();
                continue;
            }

            const segmentStickers = message.stickerCodes.slice(0, stickerRoom);
            message.stickerCodes.splice(0, stickerRoom);
            segments.push({ stickerCodes: segmentStickers });
            break;
        }

        return segments;
    }

    private async processQueue() {
        StickerMessenger.sending = true;

        const now = Date.now();
        StickerMessenger.lastStickerWait ||= now;
        if(now - StickerMessenger.lastStickerWait >= stickerWait) {
            StickerMessenger.stickersSentAfterLastWait = 0;
        }

        while(StickerMessenger.stickerQueue.length > 0) {
            if(api.net.state.session.loadingPhase) {
                await awaitBackToLobby();
            }

            const segments = StickerMessenger.getStickerSegments();

            for(const { stickerCodes, resolvers } of segments) {
                for(const stickerCode of stickerCodes) {
                    const stickerData = codeToSticker(stickerCode);
                    api.net.send("PLACE_STICKER", {
                        stickerId: this.stickerId,
                        ...stickerData
                    });
                }

                StickerMessenger.receiver.pendingStickers.push({
                    amount: stickerCodes.length,
                    resolvers: resolvers ?? Promise.withResolvers<void>()
                });

                StickerMessenger.stickersSentAfterLastWait += stickerCodes.length;
            }

            await StickerMessenger.receiver.pendingStickers.at(-1)!.resolvers.promise;
            // This additional wait is needed to prevent stickers from being dropped
            await new Promise<void>((res) => setTimeout(() => res(), stickerWait));

            StickerMessenger.lastStickerWait = Date.now();
            StickerMessenger.stickersSentAfterLastWait = 0;
        }

        StickerMessenger.sending = false;
    }
}
