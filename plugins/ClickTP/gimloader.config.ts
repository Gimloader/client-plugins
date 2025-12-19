import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "ClickTP",
    description: "Ctrl+Click to teleport anywhere client-side",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/ClickTP.js",
    webpage: "https://gimloader.github.io/plugins/clicktp",
    version: "0.1.3",
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
    ],
    gamemodes: ["2d"],
    changelog: ["Replace Desync with Desynchronize dependency"]
});
