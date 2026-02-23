import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "2dMovementTAS",
    description: "Allows for making TASes of CTF and tag",
    author: "TheLazySquid",
    version: "0.4.1",
    reloadRequired: "ingame",
    gamemodes: ["ctf", "tag"],
    changelog: ["Updated webpage url"]
});
