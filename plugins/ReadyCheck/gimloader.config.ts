import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    name: "ReadyCheck",
    input: "src/index.ts",
    description: "Allows plugin users to input if they are ready for the game to start",
    needsLibs: ["Communication", "CharacterLabels"],
    gamemodes: ["2d"],
    version: "0.1.0"
});
