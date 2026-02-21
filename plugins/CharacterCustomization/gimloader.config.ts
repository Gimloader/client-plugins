import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "CharacterCustomization",
    description: "Allows you to use any gim or a custom gim client-side",
    author: "TheLazySquid",
    version: "0.7.1",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/CharacterCustomization.js",
    webpage: "https://gimloader.github.io/plugins/charactercustomization",
    hasSettings: true,
    gamemodes: ["2d"],
    changelog: ["Fixed UI overflowing on smaller screens"]
});
