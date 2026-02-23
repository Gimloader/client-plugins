import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "Chat",
    description: "Adds an in-game chat to 2d gamemodes",
    author: "TheLazySquid",
    version: "0.2.8",
    changelog: ["Updated webpage url"],
    needsLibs: ["Communication"],
    gamemodes: ["2d"]
});
