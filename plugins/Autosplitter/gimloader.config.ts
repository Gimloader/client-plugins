import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Autosplitter",
    description: "Automatically times speedruns for various gamemodes",
    author: "TheLazySquid",
    version: "0.6.1",
    hasSettings: true,
    gamemodes: ["dontLookDown", "fishtopia", "oneWayOut"],
    changelog: ["Updated webpage url"]
});
