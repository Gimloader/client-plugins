import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js",
    version: "0.3.2",
    changelog: [
        "Fixed strings sent at a specific length never resolving"
    ],
    gamemodes: ["2d"],
    isLibrary: true
});
