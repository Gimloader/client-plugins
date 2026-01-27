import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "KitTimesPlayed",
    description: "Shows the number of times that kits have been played on the kits screen",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/KitTimesPlayed.js",
    webpage: "https://gimloader.github.io/plugins/kittimesplayed",
    version: "0.1.1",
    reloadRequired: "notingame"
});
