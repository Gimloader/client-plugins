import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "BringBackBoosts",
    description: "Restores boosts in Don't Look Down. Will cause you to desync, so others cannot see you move.",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/BringBackBoosts.js",
    version: "0.6.1",
    hasSettings: true,
    reloadRequired: "ingame",
    webpage: "https://gimloader.github.io/plugins/bringbackboosts",
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
    ],
    gamemodes: ["dontLookDown"],
    changelog: ["Replace DLDUtils with Desynchronize dependency"]
});
