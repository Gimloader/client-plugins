import { exportWholeMap } from "./tools/export";
import { importWholeMap } from "./tools/import";
import { redo, undo } from "./tools/undo";
import { nukeMap } from "./tools/nuke";
import "./tools/selection";
import "./tools/eraserSize";
import "./tools/renameBlocks";
import { replaceSelection } from "./tools/selection";

const isNotInGame = () => api.net.type !== "Colyseus";

api.commands.addCommand({
    text: "CreativeTools: Export World",
    hidden: isNotInGame
}, exportWholeMap);

api.commands.addCommand({
    text: "CreativeTools: Import World",
    hidden: isNotInGame
}, importWholeMap);

api.commands.addCommand({
    text: "CreativeTools: Remove Everything From Map",
    hidden: isNotInGame
}, nukeMap);

api.commands.addCommand({
    text: "CreativeTools: Find/Replace Selected Terrain",
    hidden: isNotInGame
}, replaceSelection);

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
