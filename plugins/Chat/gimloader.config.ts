import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "./src/index.ts",
    name: "Chat",
    description: "Adds an in-game chat to 2d gamemodes",
    author: "TheLazySquid",
    version: "0.3.0",
    changelog: ["Added typing indicator"],
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Chat.js",
    webpage: "https://gimloader.github.io/plugins/chat",
    needsLibs: ["Communication | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/Communication.js"],
    gamemodes: ["2d"]
});
