import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "InfoLines",
    description: "Displays a configurable list of info on the screen",
    author: "TheLazySquid",
    version: "1.1.0",
    changelog: ["Added fish value line"],
    hasSettings: true,
    gamemodes: ["2d"]
});
