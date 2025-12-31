import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "InfoLines",
    description: "Displays a configurable list of info on the screen",
    author: "TheLazySquid",
    version: "0.2.0",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/InfoLines.js",
    webpage: "https://gimloader.github.io/plugins/infolines",
    hasSettings: true,
    gamemodes: ["2d"]
});
