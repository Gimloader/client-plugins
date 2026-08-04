import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "QuickReset",
    description: "Quickly lets you restart 2d gamemodes",
    version: "0.5.0",
    changelog: ["Allowed completely restarting the game when using GuestControls"],
    gamemodes: ["2d"]
});
