import { sassPlugin } from "esbuild-sass-plugin";
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

/** @type { import('@gimloader/build').Config } */
export default {
    input: 'src/index.ts',
    name: 'InfoLines',
    description: 'Displays a configurable list of info on the screen',
    author: 'TheLazySquid',
    version: pkg.version,
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/InfoLines/build/InfoLines.js",
    webpage: 'https://gimloader.github.io/plugins/infolines',
    hasSettings: true,
    plugins: [sassPlugin({ type: "css-text" })]
};