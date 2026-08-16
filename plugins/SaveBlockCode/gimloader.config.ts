import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "SaveBlockCode",
    description: "Allows you to save and load block code in creative via the command palette.",
    version: "1.0.0",
    gamemodes: ["creative"]
});
