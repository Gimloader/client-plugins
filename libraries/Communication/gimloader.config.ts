import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js",
    version: "0.4.0",
    changelog: [
        "Allowed arrays of only bytes to be sent optimally"
    ],
    gamemodes: ["2d"],
    isLibrary: true
});
