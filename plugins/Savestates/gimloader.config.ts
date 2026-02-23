import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Savestates",
    description: "Allows you to save and load states/summits in Don't Look Down. Only client side, nobody else can see you move.",
    author: "TheLazySquid",
    version: "0.5.1",
    needsPlugins: ["Desynchronize"],
    optionalLibs: [
        "CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js"
    ],
    gamemodes: ["dontLookDown"],
    changelog: ["Updated webpage url"]
});
