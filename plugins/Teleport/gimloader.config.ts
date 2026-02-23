import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Teleport",
    description: "Ctrl+Click to teleport anywhere and adds a command to teleport to a player client-side",
    author: "TheLazySquid",
    version: "1.0.1",
    changelog: ["Updated webpage url"],
    needsPlugins: ["Desynchronize"],
    gamemodes: ["2d"]
});
