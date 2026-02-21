import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "./src/index.ts",
    name: "DLDTAS",
    description: "Allows you to create TASes for Dont Look Down",
    author: "TheLazySquid",
    version: "0.5.2",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/DLDTAS.js",
    webpage: "https://gimloader.github.io/plugins/dldtas",
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
    ],
    gamemodes: ["dontLookDown"],
    changelog: ["Fixed UI being placed on top of the Gimloader modal"]
});
