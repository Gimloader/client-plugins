import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CreativeTools",
    description: "Adds various quality of life improvements to the Creative editor",
    version: "0.2.0",
    reloadRequired: "ingame",
    gamemodes: ["creative"],
    changelog: [
        "Added the ability to remove everything from your map",
        "Added a loading toast when importing a map"
    ]
});
