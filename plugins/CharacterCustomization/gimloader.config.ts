import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CharacterCustomization",
    description: "Allows you to use any gim or a custom gim client-side",
    version: "1.0.1",
    hasSettings: true,
    gamemodes: ["2d"],
    changelog: [
        "Overhauled interface",
        "Past gims/trails are now saved",
        "Your selection may have been reset"
    ]
});
