import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "BringBackBoosts",
    description: "Restores boosts in Don't Look Down. Will cause you to desync, so others cannot see you move.",
    author: "TheLazySquid",
    version: "0.6.2",
    hasSettings: true,
    reloadRequired: "ingame",
    needsPlugins: ["Desynchronize"],
    gamemodes: ["dontLookDown"],
    changelog: ["Updated webpage url"]
});
