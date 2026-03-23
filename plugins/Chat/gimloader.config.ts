import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "Chat",
    description: "Adds an in-game chat to 2d gamemodes",
    author: "TheLazySquid",
    version: "0.5.0",
    changelog: ["Added option to show player skins in chat"],
    needsLibs: ["Communication"],
    gamemodes: ["2d"]
});
