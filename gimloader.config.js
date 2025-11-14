import { sassPlugin } from "esbuild-sass-plugin";
import svelte from "esbuild-svelte";
import { sveltePreprocess } from "svelte-preprocess";

/** @type {import('@gimloader/build').Config} */
export default {
    type: "workspace",
    splitPluginsAndLibraries: true,
    alias: {
        "ClickTP": "./plugins/ClickTP",
        "ConfirmClose": "./plugins/ConfirmClose",
        "CrazyFlag": "./plugins/CrazyFlag",
        "Healthbars": "./plugins/Healthbars",
        "IdleForXp": "./plugins/IdleForXp",
        "InstantUse": "./plugins/InstantUse",
        "PerformantGims": "./plugins/PerformantGims",
        "PhysicsSettings": "./plugins/PhysicsSettings",
        "QuickReset": "./plugins/QuickReset",
        "Savestates": "./plugins/Savestates",
        "ToggleTerrainType": "./plugins/ToggleTerrainType",
        "UncappedSettings": "./plugins/UncappedSettings",
        "CharacterCustomization": "./plugins/CharacterCustomization",
        "Chat": "./plugins/Chat",
        "2dMovementTAS": "./plugins/2dMovementTAS",
        "AutoKicker": "./plugins/AutoKicker",
        "Autosplitter": "./plugins/Autosplitter",
        "BringBackBoosts": "./plugins/BringBackBoosts",
        "CameraControl": "./plugins/CameraControl",
        "CustomUI": "./plugins/CustomUI",
        "DLDTAS": "./plugins/DLDTAS",
        "InfoLines": "./plugins/InfoLines",
        "InputRecorder": "./plugins/InputRecorder",
        "GamemodeLinks": "./plugins/GamemodeLinks",
        "Desync": "./libraries/Desync",
        "DLDUtils": "./libraries/DLDUtils",
        "GamemodeDetector": "./libraries/GamemodeDetector",
        "MobxUtils": "./libraries/MobxUtils",
        "Communication": "./libraries/Communication"
    },
    plugins: [
        sassPlugin({ type: "css-text" }),
        svelte({
            preprocess: sveltePreprocess(),
            compilerOptions: {
                css: "injected"
            }
        })
    ],
    esbuildOptions: {
        loader: {
            ".css": "text",
            ".svg": "text"
        }
    }
}