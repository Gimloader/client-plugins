import { sassPlugin } from "esbuild-sass-plugin";
import svelte from "esbuild-svelte";
import { workspaceConfig } from "@gimloader/build";
import { externalSvelte } from "@gimloader/external-svelte-plugin";

export default workspaceConfig({
    type: "workspace",
    splitPluginsAndLibraries: true,
    autoAlias: [
        "./plugins",
        "./libraries"
    ],
    plugins: [
        sassPlugin({ type: "css-text" }),
        svelte({
            compilerOptions: {
                css: "injected"
            }
        }),
        externalSvelte()
    ],
    esbuildOptions: {
        loader: {
            ".css": "text",
            ".svg": "text"
        }
    }
});