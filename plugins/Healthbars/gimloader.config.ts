import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Healthbars",
    description: "Adds healthbars underneath players' names",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Healthbars.js",
    webpage: "https://gimloader.github.io/plugins/healthbars",
    version: "0.1.5",
    gamemodes: ["2d"],
    changelog: ["Fixed potential crash when others join your game"]
});
