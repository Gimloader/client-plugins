import svelte from "esbuild-svelte";
import { sveltePreprocess } from "svelte-preprocess";
import { sassPlugin } from "esbuild-sass-plugin";
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

/** @type {import('@gimloader/build').Config} */
export default {
    input: 'src/index.ts',
    name: 'Autosplitter',
    description: 'Automatically times speedruns for various gamemodes',
    author: 'TheLazySquid',
    version: pkg.version,
    downloadUrl: 'https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/Autosplitter/build/Autosplitter.js',
    webpage: 'https://gimloader.github.io/plugins/autosplitter',
    libs: ["GamemodeDetector | https://raw.githubusercontent.com/Gimloader/client-plugins/main/libraries/GamemodeDetector.js"],
    hasSettings: true,
    plugins: [
        svelte({
            preprocess: sveltePreprocess(),
            compilerOptions: {
                css: "injected"
            }
        }),
        sassPlugin({ type: "css-text" })
    ],
    esbuildOptions: {
        loader: {
            ".svg": "text"
        }
    }
};