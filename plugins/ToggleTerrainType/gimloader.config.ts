import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "ToggleTerrainType",
    description: "Quickly toggle whether you are placing terrain as walls or as floor. Allows you to place tiles as floors in platformer mode.",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/ToggleTerrainType.js",
    webpage: "https://gimloader.github.io/plugins/ToggleTerrainType",
    version: "0.2.1",
    changelog: ["Updated webpage url"]
});
