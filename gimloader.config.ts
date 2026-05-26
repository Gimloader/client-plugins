import svelte from "esbuild-svelte";
import { workspaceConfig } from "@gimloader/build";
import { externalSvelte } from "@gimloader/external-svelte-plugin";

export default workspaceConfig({
    type: "workspace",
    splitPluginsAndLibraries: true,
    injectCss: true,
    autoAlias: [
        "./plugins",
        "./libraries"
    ],
    plugins: [
        svelte({
            compilerOptions: {
                css: "injected"
            }
        }),
        externalSvelte()
    ],
    esbuildOptions: {
        loader: {
            ".svg": "text"
        }
    }
});