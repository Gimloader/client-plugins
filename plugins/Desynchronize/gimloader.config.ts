import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Desynchronize",
    description: "Disables the client being snapped back by the server, others cannot see you move. Breaks most gamemodes.",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js",
    webpage: "https://gimloader.github.io/plugins/desynchronize",
    version: "0.2.0",
    changelog: ["Added plugin sync setting to sync your position with other Desynchronize users"],
    optionalLibs: [
        "Communication | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/Communication.js"
    ]
});
