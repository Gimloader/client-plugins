import type { Callbacks, Character, OnStreamCallback, StateUpdate } from "./types";

export default class Streamer {
    static readonly callbacks = new Map<string, Callbacks>();
    static updatePromises = new Map<Character, Promise<StateUpdate>>();
    static updateResolvers = new Map<Character, (data: StateUpdate) => void>();

    static async *restOfBytes(char: Character) {
        while(true) {
            const update = await this.nextBytes(char);
            yield update.data;
            if(update.done) break;
        }
    }

    static async getMessageBytes(char: Character, initial: number[]) {
        const array = [...initial];

        // dprint-ignore
        for await (const chunk of this.restOfBytes(char)) {
            array.push(...chunk);
        }

        return array;
    }

    static nextBytes(char: Character) {
        const existing = this.updatePromises.get(char);
        if(existing) return existing;

        const { promise, resolve } = Promise.withResolvers<StateUpdate>();
        this.updatePromises.set(char, promise);
        this.updateResolvers.set(char, resolve);

        return promise;
    }

    static startCompletedStream<T>(callbacks: OnStreamCallback<T>[], char: Character, initial: T) {
        const generator = async function*() {
            yield initial;
        };

        for(const cb of callbacks) {
            cb(generator(), char);
        }
    }

    static startStream<T>(callbacks: OnStreamCallback<T>[], char: Character, initial: number[], map?: (...bytes: number[]) => T) {
        const generator = async function*() {
            yield map ? map(...initial) : initial;

            // dprint-ignore-start
            for await (const chunk of Streamer.restOfBytes(char)) {
          // dprint-ignore-start
              yield map ? map(...chunk) : chunk;
          }
        };

        for(const cb of callbacks) {
            cb(generator(), char);
        }
    }

    readonly callbacks: Callbacks = {
        byteStream: [],
        message: [],
        stringStream: []
    };

    constructor(private readonly identifierString: string) {
        Streamer.callbacks.set(identifierString, this.callbacks);
    }

    destroy() {
        Streamer.callbacks.delete(this.identifierString);
    }
}
