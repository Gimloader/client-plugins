import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "./src/index.ts",
    name: "GameTimeMS",
    description: "Allows millisecond precision in the game timer",
    author: "retrozy",
    version: "0.1.1",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/GameTimeMS.js",
    webpage: "https://gimloader.github.io/plugins/GameTimeMS",
    reloadRequired: "ingame",
    hasSettings: true,
    changelog: ["Updated webpage url"]
});
