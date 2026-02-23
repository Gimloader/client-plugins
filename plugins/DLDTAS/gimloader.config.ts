import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "DLDTAS",
    description: "Allows you to create TASes for Dont Look Down",
    author: "TheLazySquid",
    version: "0.5.3",
    needsPlugins: [
        "Desynchronize"
    ],
    gamemodes: ["dontLookDown"],
    changelog: ["Updated webpage url"]
});
