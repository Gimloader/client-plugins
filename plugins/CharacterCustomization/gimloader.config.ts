import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CharacterCustomization",
    description: "Allows you to use any gim or a custom gim client-side",
    author: "TheLazySquid",
    version: "0.7.2",
    hasSettings: true,
    gamemodes: ["2d"],
    changelog: ["Updated webpage url"]
});
