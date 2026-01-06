import type { Type } from "./consts";

export type Message =
    | string
    | number
    | boolean
    | { [key: string]: Message }
    | Message[];

export type OnMessageCallback<T extends Message = Message> = (message: T, player: any) => void;

export interface MessageState {
    type: Type;
    identifierString: string;
    recieved: number[];
}

export interface PendingAngle {
    angle: number;
    resolve?: () => void;
}
