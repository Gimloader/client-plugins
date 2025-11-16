import type { Op } from "./consts";

export type Message =
    | string
    | number
    | boolean
    | { [key: string]: Message }
    | Message[];

export type OnMessageCallback<T extends Message = Message> = (message: T, player: any) => void;

export interface MessageState {
    message: string;
    charsRemaining: number;
    identifierString: string;
    op: Op;
}
