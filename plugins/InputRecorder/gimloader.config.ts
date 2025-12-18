import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "./src/index.ts",
    name: "InputRecorder",
    description: "Records your inputs in Don't Look Down",
    author: "TheLazySquid",
    version: "0.3.1",
    changelog: [
        "Fixed performance issue while recording"
    ],
    reloadRequired: "ingame",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InputRecorder.js",
    webpage: "https://gimloader.github.io/plugins/inputrecorder",
    needsLibs: [
        "DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/DLDUtils.js"
    ],
    gamemodes: ["dontLookDown"]
});
