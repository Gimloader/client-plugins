import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "PlayerCollision",
    description: "Makes you collide with other players in 2d gamemodes",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/PlayerCollision.js",
    webpage: "https://gimloader.github.io/plugins/playercollision",
    version: "0.1.3",
    changelog: ["Actually fixed movement issue when host"],
    gamemodes: ["2d"],
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
    ]
});
