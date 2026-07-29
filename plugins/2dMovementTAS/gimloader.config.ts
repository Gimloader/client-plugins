import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "2dMovementTAS",
    description: "Allows for making TASes of CTF and tag",
    version: "0.4.2",
    reloadRequired: "ingame",
    gamemodes: ["ctf", "tag"],
    changelog: ["Deprecated plugin"],
    deprecated: "This plugin has been broken by changes to Gimkit and there are not currently any plans to fix it."
});
