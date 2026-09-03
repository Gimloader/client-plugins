import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "DownpatchPhysics",
    description: "Restore physics to how it functioned in older versions of Gimkit",
    version: "0.1.3",
    hasSettings: true,
    needsPlugins: ["Desynchronize"],
    gamemodes: ["2d"],
    changelog: ["Fix jumping fully not working. There may still be more issues."]
});
