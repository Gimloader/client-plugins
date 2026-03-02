import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "InfoLines",
    description: "Displays a configurable list of info on the screen",
    author: "TheLazySquid",
    version: "1.2.0",
    changelog: ["Added one way out plant drop rate"],
    hasSettings: true,
    gamemodes: ["2d"]
});
