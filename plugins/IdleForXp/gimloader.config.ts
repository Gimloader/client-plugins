import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "IdleForXp",
    description: "Automatically performs actions to let you gain XP while idle",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/IdleForXp.js",
    webpage: "https://gimloader.github.io/plugins/IdleForXp",
    reloadRequired: "ingame",
    version: "0.3.3",
    gamemodes: ["2d"],
    changelog: ["Updated webpage url"]
});
