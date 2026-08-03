declare namespace Gimloader {
    interface Plugins {
        Savestates: typeof import("./plugins/Savestates/src");
        InputRecorder: typeof import("./plugins/InputRecorder/src");
        Desynchronize: typeof import("./plugins/Desynchronize/src");
        DLDTAS: typeof import("./plugins/DLDTAS/src");
        CameraControl: typeof import("./plugins/CameraControl/src");
    }
    
    interface Libraries {
        Communication: typeof import("./libraries/Communication/src").default;
        CharacterLabels: typeof import("./libraries/CharacterLabels/src").default;
    }
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
