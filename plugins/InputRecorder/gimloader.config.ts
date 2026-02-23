import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "InputRecorder",
    description: "Records your inputs in Don't Look Down",
    author: "TheLazySquid",
    version: "0.4.1",
    reloadRequired: "ingame",
    needsPlugins: ["Desynchronize"],
    gamemodes: ["dontLookDown"],
    changelog: ["Updated webpage url"]
});
