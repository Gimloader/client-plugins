import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CreativeTools",
    description: "Adds various quality of life improvements to the Creative editor",
    version: "0.3.1",
    reloadRequired: "ingame",
    gamemodes: ["creative"],
    changelog: ["Fixed custom assets not being exported"]
});
