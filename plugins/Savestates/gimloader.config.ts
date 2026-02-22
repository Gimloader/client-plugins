import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Savestates",
    description: "Allows you to save and load states/summits in Don't Look Down. Only client side, nobody else can see you move.",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Savestates.js",
    webpage: "https://gimloader.github.io/plugins/Savestates",
    version: "0.5.1",
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
    ],
    optionalLibs: [
        "CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js"
    ],
    gamemodes: ["dontLookDown"],
    changelog: ["Updated webpage url"]
});
