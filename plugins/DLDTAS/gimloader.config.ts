import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "DLDTAS",
    description: "Allows you to create TASes for Dont Look Down",
    author: "TheLazySquid",
    version: "0.6.0",
    needsPlugins: [
        "Desynchronize"
    ],
    gamemodes: ["dontLookDown"],
    changelog: ["Added a command for jumping to any frame"]
});
