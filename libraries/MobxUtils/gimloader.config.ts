import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "MobxUtils",
    description: "Some simple utilities for react injection with MobX",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/MobxUtils.js",
    webpage: "https://gimloader.github.io/libraries/MobxUtils",
    version: "0.3.3",
    changelog: ["Updated webpage url"],
    isLibrary: true
});
