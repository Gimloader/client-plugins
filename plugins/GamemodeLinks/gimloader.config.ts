import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "GamemodeLinks",
    description: "Creates game rooms from links, particularly useful in bookmarks.",
    version: "0.4.0",
    hasSettings: true,
    changelog: ["Removed requirement to reload the page"]
});
