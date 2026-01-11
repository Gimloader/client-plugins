import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js",
    version: "0.2.4",
    changelog: ["Fixed the angle queue freezing when ending the game"],
    gamemodes: ["2d"],
    isLibrary: true
});
