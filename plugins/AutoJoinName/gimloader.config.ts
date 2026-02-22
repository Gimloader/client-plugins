import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "AutoJoinName",
    description: "Automatically joins games with a configured name",
    author: "retrozy",
    version: "0.1.1",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/AutoJoinName.js",
    webpage: "https://gimloader.github.io/plugins/AutoJoinName",
    hasSettings: true,
    changelog: ["Updated webpage url"]
});
