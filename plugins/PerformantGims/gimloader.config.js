/** @type {import("@gimloader/build").SingleConfig} */
export default {
    input: "src/index.ts",
    name: "PerformantGims",
    description: "Replaces configurable gims with images of them. Looks like crap, runs really fast.",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/PerformantGims.js",
    webpage: "https://gimloader.github.io/plugins/performantgims",
    hasSettings: true,
    reloadRequired: "ingame",
    version: "0.4.1",
    libs: [
        "QuickSettings | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/QuickSettings.js"
    ]
};
