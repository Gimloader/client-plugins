import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "GamemodeLinks",
    description: "Creates game rooms from links, particularly useful in bookmarks.",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/GamemodeLinks.js",
    webpage: "https://gimloader.github.io/plugins/gamemodelinks",
    version: "0.3.0",
    hasSettings: true,
    reloadRequired: "notingame",
    changelog: [
        "Reload required only while not in-game",
        "Added links for editing a creative map. You can get a link for editing a specific map in the three dots on your maps",
        "Added settings for if the gamemode selector should be updating the tab link and title"
    ]
});
