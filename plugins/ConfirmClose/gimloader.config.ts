import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "ConfirmClose",
    description: "Ask for confirmation before closing the tab when in-game",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/ConfirmClose.js",
    webpage: "https://gimloader.github.io/plugins/ConfirmClose",
    version: "1.0.1",
    changelog: ["Updated webpage url"]
});
