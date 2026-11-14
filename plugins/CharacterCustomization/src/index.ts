import { patchCharacters } from "./characterManager";
import { setSyncEnabled } from "./sync";
import OpenButton from "./ui/OpenButton.svelte";
import Selector from "./ui/Selector.svelte";
import { mount, unmount } from "svelte";

api.net.onLoad(patchCharacters);

function showUI() {
    const div = document.createElement("div");
    const ui = mount(Selector, { target: div });

    api.UI.showModal(div, {
        id: "CharacterCustomization",
        title: "Character Customization",
        style: "width: min(90vw, 830px)",
        onClosed() {
            unmount(ui);
        },
        buttons: [
            {
                text: "Apply",
                style: "primary"
            }
        ]
    });
}

api.hotkeys.addHotkey({
    key: "KeyC",
    alt: true
}, showUI);

const settings = api.settings.create([
    {
        type: "toggle",
        id: "syncCosmetics",
        title: "Sync Cosmetics",
        description: "Synchronize cosmetics with other players who have this setting enabled. Does not sync custom gims.",
        default: true
    },
    {
        type: "customsection",
        id: "cosmeticSelection",
        render: (element) => {
            mount(OpenButton, {
                target: element,
                props: {
                    onclick: showUI
                }
            });
        }
    }
]);

settings.listen("syncCosmetics", (enabled) => setSyncEnabled(enabled), true);
