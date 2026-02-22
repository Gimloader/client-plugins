import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Teleport",
    description: "Ctrl+Click to teleport anywhere and adds a command to teleport to a player client-side",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Teleport.js",
    webpage: "https://gimloader.github.io/plugins/Teleport",
    version: "1.0.1",
    changelog: ["Updated webpage url"],
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
    ],
    gamemodes: ["2d"]
});
