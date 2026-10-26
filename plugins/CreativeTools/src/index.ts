import { exportWholeMap } from "./tools/export";
import { importWholeMap } from "./tools/import";
import { redo, undo } from "./tools/undo";
import { nukeMap } from "./tools/nuke";
import "./tools/selection";
import "./tools/eraserSize";
import "./tools/renameBlocks";

api.commands.addCommand({
    text: "CreativeTools: Export World"
}, exportWholeMap);

api.commands.addCommand({
    text: "CreativeTools: Import World"
}, importWholeMap);

api.commands.addCommand({
    text: "CreativeTools: Remove Everything From Map"
}, nukeMap);

api.net.onLoad(() => {
    api.hotkeys.addHotkey({
        ctrl: true,
        shift: false,
        key: "KeyZ",
        stopPropagation: true
    }, undo);

    api.hotkeys.addHotkey({
        ctrl: true,
        shift: true,
        key: "KeyZ",
        stopPropagation: true
    }, redo);

    api.hotkeys.addHotkey({
        ctrl: true,
        key: "KeyY",
        stopPropagation: true
    }, redo);
});
