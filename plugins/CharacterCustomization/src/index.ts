import { patchCharacters } from "./characterManager";
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
api.openSettingsMenu(() => showUI());
