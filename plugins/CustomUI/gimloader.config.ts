import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "CustomUI",
    description: "Allows you to customize various things about the Gimkit UI",
    author: "TheLazySquid",
    version: "0.3.4",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/CustomUI.js",
    webpage: "https://gimloader.github.io/plugins/CustomUI",
    hasSettings: true,
    changelog: ["Updated webpage url"]
});
