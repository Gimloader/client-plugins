import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    author: "retrozy",
    version: "0.4.2",
    changelog: ["Enabled state is now passed to onEnabledChange callback"],
    gamemodes: ["2d"],
    isLibrary: true
});
