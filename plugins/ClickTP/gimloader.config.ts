import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "ClickTP",
    description: "Ctrl+Click to teleport anywhere client-side",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/ClickTP.js",
    webpage: "https://gimloader.github.io/plugins/clicktp",
    version: "0.1.2",
    needsLibs: [
        "Desync | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Desync.js"
    ],
    gamemodes: ["2d"]
});
