import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "SaveBlockCode",
    description: "Allows you to save and load block code in creative via the command palette.",
    version: "1.0.2",
    gamemodes: ["creative"],
    changelog: ["Deprecated in favor of CreativeTools"],
    deprecated: "SaveBlockCode has been superceded by CreativeTools",
    successor: "CreativeTools"
});
