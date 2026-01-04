import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "InstantUse",
    description: "Instantly use nearby devices without any wait",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/InstantUse.js",
    webpage: "https://gimloader.github.io/plugins/instantuse",
    version: "0.2.5",
    changelog: ["Fixed using devices after the game has ended"]
});
