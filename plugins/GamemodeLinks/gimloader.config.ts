import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "GamemodeLinks",
    description: "Creates game rooms from links, particularly useful in bookmarks.",
    author: "retrozy",
    version: "0.3.4",
    hasSettings: true,
    reloadRequired: "notingame",
    changelog: ["Fixed for gimloader v1.12.0"]
});
