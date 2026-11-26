import "./styles.css";
import "./tools/eraserSize";
import "./tools/blocks";
import "./tools/layers";
import "./tools/hider";
import { exportSelection, exportWholeMap } from "./tools/export";
import { importMap } from "./tools/import";
import { redo, undo } from "./tools/undo";
import { nukeMap } from "./tools/nuke";
import { replaceSelection } from "./tools/selection";
import { createShape, getCircleTiles, getEllipseTiles, getHollowCircleTiles, getHollowEllipseTiles, getHollowRectangleTiles, getHollowSquareTiles, getRectangleTiles, getSquareTiles } from "./tools/shapes";

api.net.onLoad(() => {
    api.commands.addCommand({
        text: "CreativeTools: Export Whole Map"
    }, exportWholeMap);

    api.commands.addCommand({
        text: "CreativeTools: Export Selection"
    }, exportSelection);

    // We actually infer whether it's from a selection based on the file itself
    api.commands.addCommand({
        text: "CreativeTools: Import Whole Map"
    }, importMap);

    api.commands.addCommand({
        text: "CreativeTools: Import Selection"
    }, importMap);

    api.commands.addCommand({
        text: "CreativeTools: Remove Everything From Map"
    }, nukeMap);

    api.commands.addCommand({
        text: "CreativeTools: Find/Replace Selected Terrain"
    }, replaceSelection);

    api.commands.addCommand({
        text: "CreativeTools: Create Square"
    }, (ctx) => createShape(ctx, "square", getSquareTiles));

    api.commands.addCommand({
        text: "CreativeTools: Create Hollow Square"
    }, (ctx) => createShape(ctx, "hollow square", getHollowSquareTiles));

    api.commands.addCommand({
        text: "CreativeTools: Create Rectangle"
    }, (ctx) => createShape(ctx, "rectangle", getRectangleTiles));

    api.commands.addCommand({
        text: "CreativeTools: Create Hollow Rectangle"
    }, (ctx) => createShape(ctx, "hollow rectangle", getHollowRectangleTiles));

    api.commands.addCommand({
        text: "CreativeTools: Create Circle"
    }, (ctx) => createShape(ctx, "circle", getCircleTiles));

    api.commands.addCommand({
        text: "CreativeTools: Create Hollow Circle"
    }, (ctx) => createShape(ctx, "hollow circle", getHollowCircleTiles));

    api.commands.addCommand({
        text: "CreativeTools: Create Ellipse",
        keywords: ["oval"]
    }, (ctx) => createShape(ctx, "ellipse", getEllipseTiles));

    api.commands.addCommand({
        text: "CreativeTools: Create Hollow Ellipse",
        keywords: ["oval"]
    }, (ctx) => createShape(ctx, "hollow ellipse", getHollowEllipseTiles));

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
