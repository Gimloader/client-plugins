import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "GuestControls",
    description: "Allows guests to perform host actions in 2d modes, when the host has this plugin on",
    version: "0.2.0",
    changelog: ["Allowed guests to start the game"],
    needsLibs: ["Communication"],
    gamemodes: ["2d"]
});
