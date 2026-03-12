import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "InfoLines",
    description: "Displays a configurable list of info on the screen",
    author: "TheLazySquid",
    version: "1.3.0",
    changelog: ["Added a setting for Fish Value to add your existing cash"],
    hasSettings: true,
    gamemodes: ["2d"]
});
