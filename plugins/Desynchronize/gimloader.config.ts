import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Desynchronize",
    description: "Disables the client being snapped back by the server, others cannot see you move. Breaks most gamemodes.",
    author: "TheLazySquid",
    version: "0.3.0",
    changelog: ["Added better popup for needing communication"],
    optionalLibs: ["Communication"],
    gamemodes: ["2d"]
});
