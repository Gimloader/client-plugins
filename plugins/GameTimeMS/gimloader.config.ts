import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "GameTimeMS",
    description: "Allows millisecond precision in the game timer",
    author: "retrozy",
    version: "0.1.1",
    reloadRequired: "ingame",
    hasSettings: true,
    changelog: ["Updated webpage url"]
});
