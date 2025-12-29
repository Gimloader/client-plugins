import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "Desynchronize",
    description: "Disables the client being snapped back by the server, others cannot see you move. Breaks most gamemodes.",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js",
    webpage: "https://gimloader.github.io/plugins/desynchronize",
    version: "0.1.1",
    changelog: ["Added setting for what to do when touching laser in DLD"]
});
