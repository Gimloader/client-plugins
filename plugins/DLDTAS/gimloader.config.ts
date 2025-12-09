import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "./src/index.ts",
    name: "DLDTAS",
    description: "Allows you to create TASes for Dont Look Down",
    author: "TheLazySquid",
    version: "0.5.0",
    changelog: [
        "Supported uploading input recordings"
    ],
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/DLDTAS.js",
    webpage: "https://gimloader.github.io/plugins/dldtas",
    libs: [
        "DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/DLDUtils.js"
    ],
    gamemodes: ["dontLookDown"]
});
