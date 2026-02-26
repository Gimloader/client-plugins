import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    author: "retrozy",
    version: "0.4.1",
    changelog: ["Updated webpage url"],
    gamemodes: ["2d"],
    isLibrary: true
});
