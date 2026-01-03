declare namespace Gimloader {
    interface Plugins {
        Savestates: typeof import("plugins/Savestates/src");
        InputRecorder: typeof import("plugins/InputRecorder/src");
        Desynchronize: typeof import("plugins/Desynchronize/src");
        DLDTAS: typeof import("plugins/DLDTAS/src");
    }
    
    interface Libraries {
        Communication: typeof import("libraries/Communication/src").default
    }
}

declare module "*.scss" {
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

declare module "*.svelte" {
    const component: import('svelte').SvelteComponent;
    // @ts-ignore svelte makes this same declaration but it doesn't work for some reason
    export default component;
}