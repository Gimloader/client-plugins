import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    name: "CharacterLabels",
    isLibrary: true,
    description: "Allows easily making labels that follow players in 2d gamemodes",
    input: "src/index.ts",
    version: "0.1.0",
    gamemodes: ["2d"]
});
