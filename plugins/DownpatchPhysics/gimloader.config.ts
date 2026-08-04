import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "DownpatchPhysics",
    description: "Restore physics to how it functioned in older versions of Gimkit",
    version: "0.1.1",
    hasSettings: true,
    needsPlugins: ["Desynchronize"],
    gamemodes: ["2d"],
    reloadRequired: "ingame",
    changelog: ["Accomodated new Gimkit update"]
});
