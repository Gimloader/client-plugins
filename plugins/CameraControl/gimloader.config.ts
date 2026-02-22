import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "CameraControl",
    description: "Lets you freely move and zoom your camera",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/CameraControl.js",
    version: "0.7.2",
    changelog: ["Updated webpage url"],
    hasSettings: true,
    webpage: "https://gimloader.github.io/plugins/CameraControl",
    optionalLibs: [
        "CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js"
    ],
    gamemodes: ["2d"]
});
