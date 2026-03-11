export type Message =
    | string
    | number
    | boolean
    | { [key: string]: Message }
    | Message[];

export type Character = Gimloader.Schema.ObjectSchema<Gimloader.Schema.CharacterState>;

export type OnMessageCallback<T extends Message = Message> = (message: T, player: Character) => void;
export type OnStreamCallback<T> = (chunks: AsyncGenerator<T>, player: Character) => void;
export type StringStreamCallback = OnStreamCallback<string>;
export type ByteStreamCallback = OnStreamCallback<number[]>;

export interface Callbacks {
    message: OnMessageCallback[];
    stringStream: StringStreamCallback[];
    byteStream: ByteStreamCallback[];
}

export interface StateUpdate {
    done: boolean;
    data: any;
}

export interface PendingAngle {
    angle: number;
    resolve: () => void;
    reject: () => void;
}
