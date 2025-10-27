import Settings from "./settings/Settings.svelte";
import type { Autosplitter } from "./splitters/autosplitter";
import DLDAutosplitter from "./splitters/DLD";
import FishtopiaAutosplitter from "./splitters/fishtopia";
import OneWayOutAutosplitter from "./splitters/OneWayOut";
import styles from "./styles.scss";

api.UI.addStyles(styles);

let autosplitter: Autosplitter;

api.net.onLoad((_, gamemode) => {
    if(gamemode === "dontlookdown") {
        autosplitter = new DLDAutosplitter();
    } else if(gamemode === "fishtopia") {
        autosplitter = new FishtopiaAutosplitter();
    } else if(gamemode === "onwWayout") {
        autosplitter = new OneWayOutAutosplitter();
    }
});

api.openSettingsMenu(() => {
    const div = document.createElement("div");
    // @ts-expect-error
    const settings = new Settings({
        target: div
    });

    api.UI.showModal(div, {
        title: "Manage Autosplitter data",
        buttons: [{ text: "Close", style: "close" }],
        id: "Autosplitter Settings",
        style: "min-width: min(600px, 90%); height: 90%;",
        closeOnBackgroundClick: false,
        onClosed: () => {
            settings.save();
            autosplitter?.loadData();
            autosplitter?.reset();
        }
    });
});
