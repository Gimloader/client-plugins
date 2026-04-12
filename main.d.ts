declare namespace Gimloader {
    export interface Plugins {
        Savestates: typeof import("./plugins/Savestates/src");
        InputRecorder: typeof import("./plugins/InputRecorder/src");
        Desynchronize: typeof import("./plugins/Desynchronize/src");
        DLDTAS: typeof import("./plugins/DLDTAS/src");
    }
    
    export interface Libraries {
        Communication: typeof import("./libraries/Communication/src").default;
    }
}

declare module "*.scss" {
    const content: string;
    export default content;
}

declare module '*.txt' {
    const content: string;
    export default content;
}

declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "*.css" {
    const content: string;
    export default content;
}
