import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "GamemodeLinks",
    description: "Creates game rooms from links, particularly useful in bookmarks.",
    version: "0.5.0",
    hasSettings: true,
    changelog: ["Added custom page when loading a gamemode link"]
});
