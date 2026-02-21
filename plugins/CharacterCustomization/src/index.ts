import UI from "./UI.svelte";
import { mount, unmount } from "svelte";

function showUI() {
    const div = document.createElement("div");
    const ui = mount(UI, { target: div });

    api.UI.showModal(div, {
        id: "CharacterCustomization",
        title: "Character Customization",
        closeOnBackgroundClick: false,
        style: "min-width: min(90vw, 500px)",
        onClosed() {
            unmount(ui);
        },
        buttons: [
            {
                text: "Cancel",
                style: "close"
            },
            {
                text: "Apply",
                style: "primary",
                onClick() {
                    ui.save();
                }
            }
        ]
    });
}

api.hotkeys.addHotkey({
    key: "KeyC",
    alt: true
}, showUI);
api.openSettingsMenu(() => showUI());
