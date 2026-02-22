import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "GamemodeLinks",
    description: "Creates game rooms from links, particularly useful in bookmarks.",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/GamemodeLinks.js",
    webpage: "https://gimloader.github.io/plugins/GamemodeLinks",
    version: "0.3.2",
    hasSettings: true,
    reloadRequired: "notingame",
    changelog: ["Updated webpage url"]
});
