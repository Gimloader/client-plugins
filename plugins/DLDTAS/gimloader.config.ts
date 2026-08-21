import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "DLDTAS",
    description: "Allows you to create TASes for Dont Look Down",
    version: "0.6.1",
    needsPlugins: [
        "Desynchronize"
    ],
    gamemodes: ["dontLookDown"],
    changelog: ["Fixed for new physics"]
});
