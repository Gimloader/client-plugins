import fs from "fs";
import svelte from "esbuild-svelte";
import { sveltePreprocess } from "svelte-preprocess";

let pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"))

/** @type {import('@gimloader/build').Config} */
export default {
    input: "src/index.ts",
    name: "CharacterCustomization",
    description: "Allows you to use any gim or a custom gim client-side",
    author: "TheLazySquid",
    version: pkg.version,
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/CharacterCustomization/build/CharacterCustomization.js",
    webpage: 'https://gimloader.github.io/plugins/charactercustomization',
    hasSettings: true,
    plugins: [
        svelte({
            preprocess: sveltePreprocess(),
            compilerOptions: {
                css: "injected"
            }
        })
    ],
    gamemodes: ["2d"]
}