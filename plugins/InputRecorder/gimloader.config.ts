import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "./src/index.ts",
    name: "InputRecorder",
    description: "Records your inputs in Don't Look Down",
    author: "TheLazySquid",
    version: "0.4.0",
    reloadRequired: "ingame",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InputRecorder.js",
    webpage: "https://gimloader.github.io/plugins/inputrecorder",
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
    ],
    gamemodes: ["dontLookDown"],
    changelog: ["Added Gimloader commands"]
});
