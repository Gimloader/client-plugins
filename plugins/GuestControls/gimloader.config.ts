import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "GuestControls",
    description: "Allows guests to perform host actions in 2d modes, when the host has this plugin on",
    author: "retrozy",
    version: "0.1.2",
    changelog: ["Updated webpage url"],
    needsLibs: ["Communication"],
    gamemodes: ["2d"]
});
