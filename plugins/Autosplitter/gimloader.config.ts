import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Autosplitter",
    description: "Automatically times speedruns for various gamemodes",
    author: "TheLazySquid",
    version: "0.6.0",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Autosplitter.js",
    webpage: "https://gimloader.github.io/plugins/autosplitter",
    hasSettings: true,
    gamemodes: ["dontLookDown", "fishtopia", "oneWayOut"],
    changelog: ["Updated the settings UI to svelte 5"]
});
