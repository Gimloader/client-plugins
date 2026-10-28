import type { SelectedTile } from "../types";
import { settings } from "../settings";
import { addAction } from "./undo";

const selectedTileIds: Set<string> = new Set();
const selectedTiles: SelectedTile[] = [];
const currentlySelectedTiles: SelectedTile[] = [];
let movingTiles: SelectedTile[] = [];
let isMovingTiles = false;
let updateAction: (action: string) => void;
let multiselectMode = api.storage.getValue("multiselectMode", "all");

export async function replaceSelection(ctx: Gimloader.CommandContext) {
    if(isMovingTiles) {
        api.UI.toast.error("Cannot replace selection while moving tiles");
        return;
    }

    if(selectedTiles.length === 0) {
        api.UI.toast.error("No tiles selected");
        return;
    }

    const terrainOptions = api.stores.worldOptions.terrainOptions;
    const terrainTypes = terrainOptions.map((t) => ({
        label: t.name,
        value: t.id
    }));
    const possibleTerrainTypes = terrainTypes.filter((t) => selectedTiles.some((tile) => tile.terrainOption.id === t.value));

    const fromId = await ctx.select({
        title: "Terrain type to replace",
        options: possibleTerrainTypes
    });

    const toId = await ctx.select({
        title: "Replace with",
        options: terrainTypes
    });

    const matchingTiles = selectedTiles.filter((tile) => tile.terrainOption.id === fromId);
    for(const tile of matchingTiles) {
        removeTile(tile);
        api.net.colyseus.send("PLACE_TERRAIN", {
            x: tile.realX,
            y: tile.realY,
            collides: tile.collides,
            depth: tile.depth,
            terrain: toId
        });
    }

    api.UI.toast.success(`Replaced ${matchingTiles.length} tile${matchingTiles.length === 1 ? "" : "s"}`);
}

api.net.onLoad(() => {
    const multiselect = api.stores.phaser.scene.actionManager.multiselect;
    const layerManager = api.stores.phaser.scene.tileManager.layerManager;
    const inputManager = api.stores.phaser.scene.inputManager;
    const terrainAdditionPreview = api.stores.phaser.scene.worldManager.terrain.terrainAdditionPreview;
    const devices = api.stores.phaser.scene.worldManager.devices;

    const addTile = (tile: any, depth: number) => {
        const id = `${depth}_${tile.x}_${tile.y}`;
        if(selectedTileIds.has(id)) return;
        selectedTileIds.add(id);

        selectedTiles.push({
            ...tile,
            realX: tile.x,
            realY: tile.y,
            x: tile.tilemapX,
            y: tile.tilemapY,
            width: 64,
            height: 64,
            depth
        });
    };

    api.patcher.before(multiselect, "findSelectedDevices", () => {
        currentlySelectedTiles.length = 0;
        if(!multiselect.modifierKeyDown) selectedTiles.length = 0;
        if(multiselectMode === "devices" || !multiselect.selection) return;

        for(let i = 1; i <= 5; i++) {
            const layer = layerManager.layers.get(`terrain-${i}`);
            for(const tile of layer.tiles.values()) {
                if(
                    tile.tilemapX + 64 < multiselect.selection.x || tile.tilemapX > multiselect.selection.x + multiselect.selection.width
                    || tile.tilemapY + 64 < multiselect.selection.y || tile.tilemapY > multiselect.selection.y + multiselect.selection.height
                ) continue;

                currentlySelectedTiles.push({
                    ...tile,
                    realX: tile.x,
                    realY: tile.y,
                    x: tile.tilemapX,
                    y: tile.tilemapY,
                    width: 64,
                    height: 64,
                    depth: i
                });
            }
        }
    });

    api.patcher.before(multiselect, "unselectAll", clearTerrainSelection);

    api.patcher.after(multiselect, "endSelectionRect", () => {
        if(multiselectMode === "devices") return;

        selectedTiles.push(...currentlySelectedTiles);
        for(const tile of currentlySelectedTiles) {
            selectedTileIds.add(`${tile.depth}_${tile.realX}_${tile.realY}`);
        }
        currentlySelectedTiles.length = 0;

        api.stores.me.editing.device.usingMultiselect ||= selectedTiles.length > 0;
    });

    api.patcher.before(multiselect, "hideSelection", () => {
        currentlySelectedTiles.length = 0;
    });

    api.patcher.before(multiselect, "updateSelectedDevicesOverlay", () => {
        if(multiselectMode === "devices") return;

        if(multiselect.selectedDevices.length + multiselect.currentlySelectedDevices.length + selectedTiles.length + currentlySelectedTiles.length > 0) {
            const deviceBoxes = multiselect.selectedDevices.map((o: any) => o.boundingBox.getBoundingBox());
            const currentDeviceBoxes = multiselect.currentlySelectedDevices.map((o: any) => o.boundingBox.getBoundingBox());

            multiselect.selectedDevicesOverlay.show([...deviceBoxes, ...currentDeviceBoxes, ...selectedTiles, ...currentlySelectedTiles]);
        } else if(!multiselect.modifierKeyDown || multiselect.selectedDevicesOverlay.showing) {
            multiselect.selectedDevicesOverlay.hide();
        }

        // Everything is manually handled so ignore the original
        return true;
    });

    api.onStop(
        inputManager.mouse.addClickListener({
            callback: (e) => {
                if(!multiselect.modifierKeyDown || multiselectMode === "devices") return;
                const tileX = e.worldX >> 6;
                const tileY = e.worldY >> 6;

                for(let i = 1; i <= 5; i++) {
                    const layer = layerManager.layers.get(`terrain-${i}`);
                    const tile = layer.tiles.get(`${tileX}_${tileY}`);
                    if(!tile) continue;

                    const id = `${i}_${tileX}_${tileY}`;
                    if(selectedTileIds.has(id)) {
                        const index = selectedTiles.findIndex((t) => t.realX === tileX && t.realY === tileY && t.depth === i);

                        if(index !== -1) {
                            selectedTiles.splice(index, 1);
                            selectedTileIds.delete(id);
                        }
                    } else {
                        addTile(tile, i);
                    }

                    multiselect.updateSelectedDevicesOverlay();
                    break;
                }
            }
        })
    );

    api.patcher.after(terrainAdditionPreview, "update", () => {
        if(multiselectMode === "devices" || !multiselect.mouseStartPos) return;
        const offsetX = (inputManager.mouse.worldX - multiselect.mouseStartPos.x) >> 6;
        const offsetY = (inputManager.mouse.worldY - multiselect.mouseStartPos.y) >> 6;

        for(const tile of movingTiles) {
            terrainAdditionPreview.createPreviewTile({
                x: tile.realX + offsetX,
                y: tile.realY + offsetY,
                depth: 999,
                tileIndex: 0,
                terrainOption: tile.terrainOption
            });
        }
    });

    const startAction = (action: string) => {
        if(multiselectMode === "devices") return;

        const hoveringDevice = devices.findDeviceUnderMouse();
        if(hoveringDevice) return;

        const tileX = inputManager.mouse.worldX >> 6;
        const tileY = inputManager.mouse.worldY >> 6;
        if(!selectedTiles.some((tile) => tile.realX === tileX && tile.realY === tileY)) return;

        multiselect.setShiftParams();
        startTerrainAction(action);

        multiselect.boundingBoxAroundEverything ??= {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        api.stores.me.adding.devices.existingDevice = {
            use: true,
            id: multiselect.selectedDevices[0]?.id ?? "",
            action
        };

        api.stores.me.adding.mode = "device";
        updateAction("adding");
    };

    api.hotkeys.addHotkey({
        key: "KeyM",
        preventDefault: false
    }, () => startAction("cut"));

    api.hotkeys.addHotkey({
        key: "KeyC",
        preventDefault: false
    }, () => startAction("copy"));
});

function clearTerrainSelection() {
    selectedTiles.length = 0;
    currentlySelectedTiles.length = 0;
    selectedTileIds.clear();
}

function startTerrainAction(action: string) {
    movingTiles = [...selectedTiles, ...currentlySelectedTiles];
    isMovingTiles = movingTiles.length > 0;
    api.stores.phaser.scene.actionManager.multiselect.updateSelectedDevicesOverlay();

    // Visually hide selected tiles
    if(action !== "cut") return;

    for(const tile of movingTiles) {
        const layer = api.stores.phaser.scene.tileManager.layerManager.layers.get(`terrain-${tile.depth}`);
        const layerTile = layer.tiles.get(`${tile.realX}_${tile.realY}`);
        layerTile.alphaTopLeft = 0;
        layerTile.alphaTopRight = 0;
        layerTile.alphaBottomLeft = 0;
        layerTile.alphaBottomRight = 0;
    }
}

const roundDeviceMovement = api.rewriter.createShared("roundDeviceMovement", (device: any, type: string, pos: number) => {
    if(!isMovingTiles) return pos;
    const startPos = device[type];
    const offset = pos - startPos;
    const roundedOffset = Math.floor(offset / 64) * 64;
    return startPos + roundedOffset;
});

api.rewriter.addParseHook("App-", (code) => {
    const firstIndex = code.indexOf(".LockVertical()");
    if(firstIndex === -1) return code;
    code = wrapCoords(code, firstIndex);

    const secondIndex = code.indexOf(".LockVertical()", firstIndex + 1);
    if(secondIndex === -1) return code;
    return wrapCoords(code, secondIndex);
});

function wrapCoords(code: string, index: number) {
    const varStart = code.indexOf("forEach((", index) + 9;
    const varEnd = code.indexOf(",", varStart);
    const varName = code.slice(varStart, varEnd);

    const start1 = code.indexOf(":", code.indexOf(".x", index)) + 1;
    const end1 = code.indexOf(",", start1);
    const index2 = code.indexOf(":", end1) + 1;
    const end2 = code.indexOf(";", index2);

    const safeRound = `(${roundDeviceMovement}??((_,__,x)=>x))`;

    return code.slice(0, start1) + `${safeRound}(${varName},"x",` + code.slice(start1, end1) + ")" + code.slice(end1, index2)
        + `${safeRound}(${varName},"y",` + code.slice(index2, end2) + ")" + code.slice(end2);
}

const onActionStart = api.rewriter.createShared("onActionStart", startTerrainAction);
const onPlace = api.rewriter.createShared("onPlace", () => {
    if(multiselectMode === "devices" || !api.stores.me.editing.device.usingMultiselect) return;

    const multiselect = api.stores.phaser.scene.actionManager.multiselect;
    const inputManager = api.stores.phaser.scene.inputManager;

    // Remove the selected tiles if we're cutting
    if(api.stores.me.adding.devices.existingDevice.action === "cut") {
        for(const tile of movingTiles) {
            removeTile(tile);
        }
    } else if(settings.copyWires && multiselect.movedOrCopiedDevices.length > 1) {
        // Re-place wires between devices if we're copying
        const movingDeviceIds = new Map<string, string>();
        let idIndex = 0;

        const onPlace = (data: Gimloader.SentMessages2d["PLACE_DEVICE"]) => {
            movingDeviceIds.set(multiselect.movedOrCopiedDevices[idIndex].id, data.id);
            idIndex++;
            if(idIndex < multiselect.movedOrCopiedDevices.length) return;

            // Hacky way to wait for all the place commands to send before sending wire placements
            api.patcher.after(inputManager.keyboard, "isKeyDown", () => {
                for(const wire of api.stores.world.wires.wires.values()) {
                    const start = movingDeviceIds.get(wire.startDevice);
                    const end = movingDeviceIds.get(wire.endDevice);
                    if(!start || !end) continue;

                    api.net.colyseus.send("PLACE_WIRE", {
                        startDevice: start,
                        endDevice: end,
                        startConnection: wire.startConnection,
                        endConnection: wire.endConnection
                    });
                }
            }, { once: true });

            api.net.colyseus.off("send:PLACE_DEVICE", onPlace);
        };

        api.net.colyseus.on("send:PLACE_DEVICE", onPlace);
    }

    if(multiselect.mouseStartPos) {
        for(const tile of movingTiles) {
            const offsetX = (inputManager.mouse.worldX - multiselect.mouseStartPos.x) >> 6;
            const offsetY = (inputManager.mouse.worldY - multiselect.mouseStartPos.y) >> 6;
            const newX = tile.realX + offsetX;
            const newY = tile.realY + offsetY;

            api.net.colyseus.send("PLACE_TERRAIN", {
                x: newX,
                y: newY,
                collides: tile.collides,
                depth: tile.depth,
                terrain: tile.terrainOption.id
            });
        }
    }

    // Don't reset if shift is held
    if(inputManager.keyboard.isKeyDown(16)) return;

    // Some delay is needed because the placement snapping happens after this callback
    setTimeout(() => isMovingTiles = false, 0);
    movingTiles.length = 0;

    // If there are no selected devices we need to trigger this manually
    if(multiselect.movedOrCopiedDevices.length === 0) {
        api.stores.me.editing.device.usingMultiselect = false;
        api.stores.gui.none.screen = "home";
        updateAction("none");
    }
});

const onDeleteSelection = api.rewriter.createShared("onDeleteSelection", () => {
    for(const tile of selectedTiles) {
        removeTile(tile);
    }

    clearTerrainSelection();
});

// Add a callback for when actions start
api.rewriter.addParseHook("Device-", (code) => {
    const index = code.indexOf("setShiftParams(),");
    if(index === -1) return code;

    const insertIndex = index + 17;
    const endIndex = code.indexOf("},", index);
    const startIndex = code.lastIndexOf(":", endIndex) + 1;
    const varName = code.slice(startIndex, endIndex);

    return code.slice(0, insertIndex) + `${onActionStart}?.(${varName}),` + code.slice(insertIndex);
});

// Add a callback for when the selection is placed
api.rewriter.addParseHook("App", (code) => {
    const index = code.indexOf("()}).canCopy");
    if(index === -1) return code;

    const insertIndex = code.lastIndexOf("isListeningForInput)return;", index) + 27;

    return code.slice(0, insertIndex) + `${onPlace}?.();` + code.slice(insertIndex);
});

// Add a callback for when the selection is deleted
api.rewriter.addParseHook("App", (code) => {
    const index = code.indexOf("Are you sure you want to delete your selection?");
    if(index === -1) return code;

    const insertIndex = code.indexOf("onOk:()=>{", index) + 10;
    return code.slice(0, insertIndex) + `${onDeleteSelection}?.();` + code.slice(insertIndex);
});

const onCancel = api.rewriter.createShared("onCancel", () => {
    for(const tile of movingTiles) {
        const layer = api.stores.phaser.scene.tileManager.layerManager.layers.get(`terrain-${tile.depth}`);
        const layerTile = layer.tiles.get(`${tile.realX}_${tile.realY}`);
        layerTile.alphaTopLeft = 1;
        layerTile.alphaTopRight = 1;
        layerTile.alphaBottomLeft = 1;
        layerTile.alphaBottomRight = 1;
    }

    isMovingTiles = false;
    movingTiles.length = 0;
});

// Add a callback for when the action is cancelled
api.rewriter.addParseHook("App", (code) => {
    const index = code.indexOf("fireImmediately:!0}),[]),");
    if(index === -1) return code;

    const insertIndex = code.indexOf(".none),", index) + 7;
    return code.slice(0, insertIndex) + `${onCancel}?.();` + code.slice(insertIndex);
});

api.rewriter.exposeVar("setCurrentAction-", {
    find: /\.actionManager\.multiselect,(\w{1,3})=/,
    callback: (setAction) => updateAction = setAction
});

// Change the name of the "Copying multiple props" display
api.rewriter.swapVar("App-", {
    check: "`Cannot add additional ${",
    find: /\.maxUsedMemory}`:``},(\w{1,3})=\(\)=>/,
    callback: (getActionInfo) => {
        return function() {
            const actionInfo = getActionInfo();
            if(!isMovingTiles) return actionInfo;

            const multiselect = api.stores.phaser.scene.actionManager.multiselect;
            const movingDevices = multiselect.movedOrCopiedDevices.some((d) => d.deviceOption.id !== "prop");
            const movingProps = multiselect.movedOrCopiedDevices.some((d) => d.deviceOption.id === "prop");

            if(movingDevices && movingProps) {
                actionInfo.title = "Multiple devices/props/tiles";
            } else if(movingDevices) {
                actionInfo.title = "Multiple devices/tiles";
            } else if(movingProps) {
                actionInfo.title = "Multiple props/tiles";
            } else if(movingTiles.length > 1) {
                actionInfo.title = "Multiple tiles";
            } else {
                actionInfo.title = "A tile";
            }

            return actionInfo;
        };
    }
});

// Add the selection configure button to the UI
const multiselectModes = [
    { value: "all", children: "Devices/Props and Tiles" },
    { value: "devices", children: "Devices/Props only" }
    // { value: "tiles", children: "Tiles only" } TODO
];

api.rewriter.exposeVar("App-", {
    check: "Are other players allowed to remove things",
    find: /radius: 6px;\n`,(\w{1,3})=/,
    callback: (editingOptions) => {
        api.patcher.afterReact(editingOptions.type, (_, __, returnVal) => {
            const [mode, setMode] = api.React.useState(multiselectMode);
            const settings = returnVal.props.children.props.children.props.children;
            const newSetting = api.React.cloneElement(settings[2]) as any;

            newSetting.props.description = "Configure what multiselect applies to (added by CreativeTools)";
            newSetting.props.name = "Multiselect Mode";

            const newChildren = api.React.cloneElement(newSetting.props.children) as any;
            const optionType = newChildren.props.children[0];
            const options: any[] = [];

            for(const mode of multiselectModes) {
                const element = api.React.cloneElement(optionType, mode) as any;
                element.key = mode.value;
                options.push(element);
            }

            newChildren.props.children = options;
            newChildren.props.value = mode;
            newChildren.props.onChange = (value: string) => {
                multiselectMode = value;
                setMode(value);
                api.logger.log("Multiselect mode changed to", value);
            };
            newSetting.props.children = newChildren;

            settings.unshift(newSetting);
        });
    }
});

function removeTile(tile: SelectedTile) {
    api.net.colyseus.send("REMOVE_TERRAIN", {
        x: tile.realX,
        y: tile.realY,
        depth: tile.depth
    });

    addAction("REMOVE_TERRAIN", {
        x: tile.realX,
        y: tile.realY,
        collides: tile.collides,
        depth: tile.depth,
        terrain: tile.terrainOption.id
    });
}
