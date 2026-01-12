import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "FixCrashes",
    description: "Attempts to prevent natural game crashes",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/FixCrashes.js",
    webpage: "https://gimloader.github.io/plugins/fixcrashes",
    version: "0.1.0",
    reloadRequired: "ingame"
});
