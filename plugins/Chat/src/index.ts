import { mount, unmount } from "svelte";
import UI from "./UI.svelte";

api.net.onLoad(() => {
    const ui = mount(UI, { target: document.body });

    api.onStop(() => {
        unmount(ui);
    });
});
