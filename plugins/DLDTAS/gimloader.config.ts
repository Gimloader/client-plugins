import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "./src/index.ts",
    name: "DLDTAS",
    description: "Allows you to create TASes for Dont Look Down",
    author: "TheLazySquid",
    version: "0.5.0",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/DLDTAS.js",
    webpage: "https://gimloader.github.io/plugins/dldtas",
<<<<<<< HEAD
    needsLibs: [
        "DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/DLDUtils.js"
=======
    needsPlugins: [
        "Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/Desynchronize.js"
>>>>>>> origin/main
    ],
    gamemodes: ["dontLookDown"],
    changelog: ["Replace DLDUtils with Desynchronize dependency"]
});
