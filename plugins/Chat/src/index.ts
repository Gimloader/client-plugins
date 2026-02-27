import { mount, unmount } from "svelte";
import UI from "./UI.svelte";

let openChat: (e: KeyboardEvent) => void = () => {};

api.hotkeys.addConfigurableHotkey({
    category: "Chat",
    title: "Open Chat",
    preventDefault: false,
    default: {
        key: "KeyY"
    }
}, openChat);

api.net.onLoad(() => {
    const ui = mount(UI, { target: document.body });

    openChat = ui.open;

    api.onStop(() => {
        unmount(ui);
    });
});
