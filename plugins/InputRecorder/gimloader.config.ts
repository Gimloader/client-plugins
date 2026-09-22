import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "InputRecorder",
    description: "Records your inputs in Don't Look Down",
    version: "0.4.2",
    reloadRequired: "ingame",
    needsPlugins: ["Desynchronize"],
    gamemodes: ["dontLookDown"],
    changelog: ["Fixed crashing"]
});
