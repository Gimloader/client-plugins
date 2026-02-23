import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "FixTileDupe",
    description: "Prevents you from placing a terrain twice on the same cell area, helpful in Dig It Up.",
    author: "retrozy",
    version: "0.1.1",
    gamemodes: ["2d"],
    changelog: ["Updated webpage url"]
});
