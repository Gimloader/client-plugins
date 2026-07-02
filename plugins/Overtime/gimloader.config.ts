import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Overtime",
    description: "Gives automatic overtime when the score is tied in knockout games",
    hasSettings: true,
    gamemodes: ["2d"],
    version: "0.1.0"
});
