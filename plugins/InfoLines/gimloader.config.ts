import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "InfoLines",
    description: "Displays a configurable list of info on the screen",
    author: "TheLazySquid",
    version: "1.0.0",
    changelog: [
        "Switched to native Gimloader settings. Your old settings have been reset!",
        "Fixed ping not hiding when disabled",
        "Made FPS more accurate"
    ],
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InfoLines.js",
    webpage: "https://gimloader.github.io/plugins/infolines",
    hasSettings: true,
    gamemodes: ["2d"]
});
