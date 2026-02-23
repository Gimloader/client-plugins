import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "IdleForXp",
    description: "Automatically performs actions to let you gain XP while idle",
    author: "TheLazySquid",
    reloadRequired: "ingame",
    version: "0.3.3",
    gamemodes: ["2d"],
    changelog: ["Updated webpage url"]
});
