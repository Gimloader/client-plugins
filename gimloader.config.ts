import { sassPlugin } from "esbuild-sass-plugin";
import svelte from "esbuild-svelte";
import { workspaceConfig } from "@gimloader/build";
import { externalSvelte } from "@gimloader/external-svelte-plugin";
import UnpluginTypia from '@typia/unplugin/esbuild';

export default workspaceConfig({
    type: "workspace",
    splitPluginsAndLibraries: true,
    autoAlias: [
        "./plugins",
        "./libraries"
    ],
    plugins: [
        UnpluginTypia({
            cache: true,
            exclude: [/\.svelte$/]
        }),
        sassPlugin({ type: "css-text" }),
        svelte({
            compilerOptions: {
                css: "injected"
            }
        }),
        externalSvelte(),
    ],
    esbuildOptions: {
        loader: {
            ".css": "text",
            ".svg": "text"
        }
    }
});