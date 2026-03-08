import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "GamemodeLinks",
    description: "Creates game rooms from links, particularly useful in bookmarks.",
    author: "retrozy",
    version: "0.3.3",
    hasSettings: true,
    reloadRequired: "notingame",
    changelog: ["Give a message when creative map URLs are copied"]
});
