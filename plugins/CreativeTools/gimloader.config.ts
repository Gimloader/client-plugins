import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CreativeTools",
    description: "Adds various quality of life improvements to the Creative editor",
    version: "0.3.2",
    reloadRequired: "ingame",
    gamemodes: ["creative"],
    changelog: ["Made export not break on certain maps"]
});
