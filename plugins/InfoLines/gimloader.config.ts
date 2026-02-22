import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "InfoLines",
    description: "Displays a configurable list of info on the screen",
    author: "TheLazySquid",
    version: "1.0.1",
    changelog: [
        "Updated webpage url"
    ],
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InfoLines.js",
    webpage: "https://gimloader.github.io/plugins/InfoLines",
    hasSettings: true,
    gamemodes: ["2d"]
});
