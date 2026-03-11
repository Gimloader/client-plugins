import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    author: "retrozy",
    version: "0.5.0",
    changelog: ["Added support for streaming strings and byte arrays"],
    gamemodes: ["2d"],
    isLibrary: true
});
