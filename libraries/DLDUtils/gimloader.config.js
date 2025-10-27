/** @type {import("@gimloader/build").SingleConfig} */
export default {
    input: "src/index.ts",
    name: "DLDUtils",
    description: "Allows plugins to move characters without the server's permission",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/DLDUtils.js",
    version: "0.3.7",
    libs: [
        "Desync | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Desync.js"
    ],
    gamemodes: ["dontLookDown"],
    isLibrary: true
}