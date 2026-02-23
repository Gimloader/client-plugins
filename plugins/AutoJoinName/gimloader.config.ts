import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "AutoJoinName",
    description: "Automatically joins games with a configured name",
    author: "retrozy",
    version: "0.1.1",
    hasSettings: true,
    changelog: ["Updated webpage url"]
});
