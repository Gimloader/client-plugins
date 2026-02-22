import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "PerformantGims",
    description: "Replaces configurable gims with images of them. Looks like crap, runs really fast.",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/PerformantGims.js",
    webpage: "https://gimloader.github.io/plugins/PerformantGims",
    hasSettings: true,
    reloadRequired: "ingame",
    version: "0.5.2",
    changelog: ["Updated webpage url"]
});
