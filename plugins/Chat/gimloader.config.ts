import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "Chat",
    description: "Adds an in-game chat to 2d gamemodes",
    author: "TheLazySquid",
    version: "0.3.0",
    changelog: ["Added typing indicator"],
    needsLibs: ["Communication"],
    gamemodes: ["2d"]
});
