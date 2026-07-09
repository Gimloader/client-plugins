import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    version: "0.5.2",
    changelog: ["Fixed messages being dropped when sent while aiming"],
    gamemodes: ["2d"],
    isLibrary: true
});
