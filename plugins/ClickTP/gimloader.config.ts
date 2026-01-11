import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "ClickTP",
    description: "Ctrl+Click to teleport anywhere client-side",
    deprecated: "This plugin has been renamed to Teleport to allow features such as teleporting to players. Update this plugin again to switch.",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Teleport.js",
    version: "0.2.3",
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
    ],
    gamemodes: ["2d"],
    changelog: ["Deprecated plugin"]
});
