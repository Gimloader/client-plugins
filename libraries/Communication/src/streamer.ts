import type { Callbacks, Character, Message, OnStreamCallback, StreamSubscription } from "./types";

export default class Streamer {
    static callbacks = new Map<number, Callbacks>();
    static updateCallbacks = new Map<Character, StreamSubscription<any>[]>();

    static startStream(
        callbacks: OnStreamCallback<any>[],
        char: Character,
        initial: number[],
        done: boolean,
        map?: (...bytes: number[]) => any
    ) {
        const subscriptions: StreamSubscription<any>[] = [];
        this.updateCallbacks.set(char, subscriptions);

        for(const callback of callbacks) {
            callback((sub) => {
                subscriptions.push((data, done) => {
                    sub(map ? map(...data) : data, done);
                });
            }, char);
        }

        this.onStreamData(char, initial, done);
    }

    static onStreamData(char: Character, data: any, done: boolean) {
        const subscriptions = this.updateCallbacks.get(char);
        if(!subscriptions) return;

        for(const sub of subscriptions) sub(data, done);
        if(done) this.updateCallbacks.delete(char);
    }

    static onMessage(identifier: number, value: Message, char: Character) {
        const callbacks = Streamer.callbacks.get(identifier);
        if(!callbacks) return;

        callbacks.message.forEach((cb) => {
            cb(value, char);
        });
    }

    readonly callbacks: Callbacks = {
        byteStream: [],
        message: [],
        stringStream: []
    };

    constructor(private readonly identifier: number) {
        Streamer.callbacks.set(identifier, this.callbacks);
    }

    destroy() {
        Streamer.callbacks.delete(this.identifier);
    }
}
