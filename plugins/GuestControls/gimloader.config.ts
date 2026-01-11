import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "./src/index.ts",
    name: "GuestControls",
    description: "Allows guests to perform host actions in 2d modes, when the host has this plugin on",
    author: "retrozy",
    version: "0.1.0",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/GuestControls.js",
    webpage: "https://gimloader.github.io/plugins/guestcontrols",
    needsLibs: ["Communication | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/Communication.js"],
    gamemodes: ["2d"]
});
