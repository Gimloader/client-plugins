import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "GamemodeLinks",
    description: "Creates game rooms from links, particularly useful in bookmarks.",
    author: "retrozy",
    version: "0.3.2",
    hasSettings: true,
    reloadRequired: "notingame",
    changelog: ["Updated webpage url"]
});
