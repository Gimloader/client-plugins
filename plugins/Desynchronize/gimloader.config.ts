import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Desynchronize",
    description: "Disables the client being snapped back by the server, others cannot see you move. Breaks most gamemodes.",
    author: "TheLazySquid",
    version: "0.2.2",
    changelog: ["Updated webpage url"],
    optionalLibs: ["Communication"],
    gamemodes: ["2d"]
});
