/** @type {import('@gimloader/build').SingleConfig} */
export default {
    input: "./src/index.ts",
    name: "InputRecorder",
    description: "Records your inputs in Don't Look Down",
    author: "TheLazySquid",
    version: "0.3.0",
    reloadRequired: "ingame",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InputRecorder.js",
    webpage: "https://gimloader.github.io/plugins/inputrecorder",
    libs: [
        "DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/DLDUtils.js"
    ],
    gamemodes: ["dontLookDown"]
};
