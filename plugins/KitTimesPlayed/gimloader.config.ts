import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "KitTimesPlayed",
    description: "Shows the number of times that kits have been played on the kits screen",
    author: "retrozy",
    version: "0.1.2",
    reloadRequired: "notingame",
    changelog: ["Updated webpage url"]
});
