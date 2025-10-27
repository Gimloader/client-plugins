/** @type {import("@gimloader/build").SingleConfig} */
export default {
    input: "src/index.ts",
    name: "CameraControl",
    description: "Lets you freely move and zoom your camera",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/CameraControl.js",
    version: "0.5.6",
    hasSettings: true,
    libs: [
        "QuickSettings | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/QuickSettings.js"
    ],
    optionalLibs: [
        "CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js"
    ],
    gamemodes: ["2d"]
}