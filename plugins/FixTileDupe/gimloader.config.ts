import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "FixTileDupe",
    description: "Prevents you from placing a terrain twice on the same cell area, helpful in Dig It Up.",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/FixTileDupe.js",
    webpage: "https://gimloader.github.io/plugins/fixtiledupe",
    version: "0.1.0",
    gamemodes: ["2d"]
});
