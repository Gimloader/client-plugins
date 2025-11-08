import type { Op } from "./consts";

export type Message =
    | string
    | number
    | boolean
    | { [key: string]: Message }
    | Message[];

export type Callback = (message: Message, player: any) => void;

export interface MessageState {
    message: string;
    charsRemaining: number;
    identifierString: string;
    op: Op;
}
