import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "PhysicsSettings",
    description: "Allows you to configure various things about the physics in platformer modes (client-side only)",
    author: "TheLazySquid",
    hasSettings: true,
    version: "0.3.1",
    gamemodes: ["2d"],
    needsPlugins: ["Desynchronize"],
    changelog: ["Updated webpage url"]
});
