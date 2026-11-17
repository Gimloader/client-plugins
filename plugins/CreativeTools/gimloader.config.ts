import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CreativeTools",
    description: "Adds various quality of life improvements to the Creative editor",
    version: "0.5.0",
    reloadRequired: "ingame",
    gamemodes: ["creative"],
    changelog: ["Fixed undo/redo still happening in menus"]
});
