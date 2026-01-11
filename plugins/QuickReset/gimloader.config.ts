import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "QuickReset",
    description: "Quickly lets you restart 2d gamemodes",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/QuickReset.js",
    webpage: "https://gimloader.github.io/plugins/quickreset",
    version: "0.4.1",
    changelog: ["Supported restarting to lobby with GuestControls enabled"],
    gamemodes: ["2d"]
});
