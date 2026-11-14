import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CharacterCustomization",
    description: "Allows you to use any gim or a custom gim client-side",
    version: "1.1.0",
    hasSettings: true,
    gamemodes: ["2d"],
    needsLibs: ["Communication"],
    changelog: ["Added option to synchronize cosmetic selection"]
});
