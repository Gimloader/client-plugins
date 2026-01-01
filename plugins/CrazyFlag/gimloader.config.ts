import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "CrazyFlag",
    description: "Make the flags in capture the flag or creative swing like crazy!",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/CrazyFlag.js",
    webpage: "https://gimloader.github.io/plugins/crazyflag",
    hasSettings: true,
    version: "1.3.1",
    changelog: ["No longer requires a reload to enable mid-game"]
});
