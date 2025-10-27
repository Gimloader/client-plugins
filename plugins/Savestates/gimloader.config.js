/** @type {import("@gimloader/build").SingleConfig} */
export default {
    input: "src/index.ts",
    name: "Savestates",
    description: "Allows you to save and load states/summits in Don't Look Down. Only client side, nobody else can see you move.",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Savestates.js",
    webpage: "https://gimloader.github.io/plugins/savestates",
    version: "0.4.1",
    libs: [
        "DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/DLDUtils.js"
    ],
    optionalLibs: [
        "CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js"
    ],
    gamemodes: ["dontLookDown"]
}