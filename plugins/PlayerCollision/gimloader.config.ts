import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "PlayerCollision",
    description: "Makes you collide with other players in 2d gamemodes",
    author: "retrozy",
    version: "0.2.1",
    changelog: ["Updated webpage url"],
    gamemodes: ["2d"],
    needsPlugins: ["Desynchronize"]
});
