import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Communication.js",
    version: "0.2.0",
    changelog: [
        "Allowed unsigned 16-bit integers to be sent in a single message",
        "Allowed strings with a length of 1-2 to be sent in a single message",
        "Simplified onEnabled/onDisabled to only onEnabledChange"
    ],
    gamemodes: ["2d"],
    isLibrary: true
});
