import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Healthbars",
    description: "Adds healthbars underneath players' names",
    version: "1.0.0",
    gamemodes: ["2d"],
    changelog: ["Used the CharacterLabels library"],
    needsLibs: ["CharacterLabels"]
});
