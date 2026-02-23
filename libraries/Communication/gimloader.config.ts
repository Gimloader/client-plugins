import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js",
    webpage: "https://gimloader.github.io/libraries/Communication",
    version: "0.4.1",
    changelog: ["Updated webpage url"],
    gamemodes: ["2d"],
    isLibrary: true
});
