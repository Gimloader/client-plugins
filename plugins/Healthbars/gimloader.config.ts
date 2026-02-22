import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Healthbars",
    description: "Adds healthbars underneath players' names",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Healthbars.js",
    webpage: "https://gimloader.github.io/plugins/Healthbars",
    version: "0.1.6",
    gamemodes: ["2d"],
    changelog: ["Updated webpage url"]
});
