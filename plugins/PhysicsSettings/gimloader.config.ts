import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "PhysicsSettings",
    description: "Allows you to configure various things about the physics in platformer modes (client-side only)",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/PhysicsSettings.js",
    webpage: "https://gimloader.github.io/plugins/physicssettings",
    hasSettings: true,
    version: "0.2.1",
    gamemodes: ["2d"],
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
    ],
    changelog: ["Added dependency on Desynchronize"]
});
