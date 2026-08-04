import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    version: "0.6.0",
    changelog: ["Allowed sending messages when in the lobby (by using stickers)"],
    gamemodes: ["2d"],
    isLibrary: true
});
