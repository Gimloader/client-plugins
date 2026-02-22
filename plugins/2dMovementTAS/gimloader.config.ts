import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "2dMovementTAS",
    description: "Allows for making TASes of CTF and tag",
    author: "TheLazySquid",
    version: "0.4.1",
    reloadRequired: "ingame",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/2dMovementTAS.js",
    webpage: "https://gimloader.github.io/plugins/2dMovementTAS",
    gamemodes: ["ctf", "tag"],
    changelog: ["Updated webpage url"]
});
