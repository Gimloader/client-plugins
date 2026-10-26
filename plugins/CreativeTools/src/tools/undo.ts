import type { Action, Actions } from "../types";
import { dataFromDevice, dataFromDeviceInfo } from "../util";

const maxUndoStackSize = 100;
const undoStack: Action[][] = [];
const redoStack: Action[][] = [];
let undoBatch: Action[] = [];

let batchTimeoutStarted = false;
export function addAction<T extends keyof Actions>(type: T, data: Actions[T], mergeWithLast = false) {
    undoBatch.push({ type, data } as Action);
    redoStack.length = 0;

    if(batchTimeoutStarted) return;
    batchTimeoutStarted = true;

    setTimeout(() => {
        const lastBatch = undoStack[undoStack.length - 1];

        if(
            mergeWithLast && undoBatch.length === 1 && lastBatch?.length === 1
            && undoBatch[0].type === lastBatch[0].type
        ) {
            undoStack[undoStack.length - 1] = undoBatch;
        } else {
            undoStack.push(undoBatch);
        }

        undoBatch = [];
        batchTimeoutStarted = false;

        if(undoStack.length > maxUndoStackSize) undoStack.shift();
    }, 0);
}

export function clearUndoStacks() {
    undoStack.length = 0;
    redoStack.length = 0;
}

api.net.onLoad(() => {
    const devices = api.stores.phaser.scene.worldManager.devices;
    const actionManager = api.stores.phaser.scene.actionManager;
    const layers = api.stores.phaser.scene.tileManager.layerManager.layers;

    let lastDestroyed: any;
    api.patcher.before(devices, "removeDeviceById", (_, [id]) => {
        const device = devices.getDeviceById(id);
        if(device) lastDestroyed = dataFromDevice(device);
    });

    api.net.colyseus.on("send:REMOVE_DEVICE", () => {
        addAction("REMOVE_DEVICE", lastDestroyed);
    });

    api.patcher.before(actionManager.removal, "removeSelectedItems", () => {
        if(api.stores.me.removing.deviceIdToRemove) return;

        const removeWire = api.stores.me.removing.wireIdToRemove;
        if(removeWire) {
            const wire = api.stores.world.wires.wires.get(removeWire);
            addAction("REMOVE_WIRE", {
                startDevice: wire.startDevice,
                startConnection: wire.startConnection,
                endDevice: wire.endDevice,
                endConnection: wire.endConnection
            });
            return;
        }

        for(const tile of api.stores.me.removing.tilesToRemove) {
            const layerTile = layers.get(`terrain-${tile.depth}`).tiles.get(`${tile.x}-${tile.y}`);
            if(!layerTile) continue;

            addAction("REMOVE_TERRAIN", {
                x: tile.x,
                y: tile.y,
                collides: layerTile.collides,
                depth: tile.depth,
                terrain: layerTile.terrainOption.id
            });
        }
    });

    api.net.colyseus.on("send:PLACE_TERRAIN", (terrain) => {
        addAction("PLACE_TERRAIN", terrain);
    });

    api.net.colyseus.on("send:PLACE_WIRE", (wire) => {
        addAction("PLACE_WIRE", wire, true);
    });
});

const onDeviceCreated = api.rewriter.createShared("onDeviceCreated", (info: any) => {
    if(!info.placedByClient || info.isPreview) return;

    const existing = api.stores.world.devices.devices.get(info.id);
    if(existing) {
        addAction("UPDATE_DEVICE", {
            from: dataFromDeviceInfo(existing),
            to: dataFromDeviceInfo(info)
        });
    } else {
        addAction("PLACE_DEVICE", dataFromDeviceInfo(info));
    }
});

api.rewriter.addParseHook("PlaceDevice-", (code) => {
    const index = code.indexOf(".callImmediately&&");
    if(index === -1) return code;

    const endIndex = code.indexOf("=>{", index);
    const startIndex = code.lastIndexOf("=", endIndex - 1) + 1;
    const argName = code.slice(startIndex, endIndex);
    const insertIndex = endIndex + 3;

    return code.slice(0, insertIndex) + `${onDeviceCreated}?.(${argName});` + code.slice(insertIndex);
});

export function undo() {
    const actions = undoStack.pop();
    if(!actions) {
        api.UI.toast.error("Nothing to undo");
        return;
    }

    for(let i = actions.length - 1; i >= 0; i--) {
        const action = actions[i];
        if(action.type === "PLACE_DEVICE") {
            api.net.colyseus.sendDirect("REMOVE_DEVICE", { id: action.data.id });
        } else if(action.type === "UPDATE_DEVICE") {
            api.net.colyseus.sendDirect("PLACE_DEVICE", action.data.from);
        } else if(action.type === "REMOVE_DEVICE") {
            api.net.colyseus.sendDirect("PLACE_DEVICE", action.data);
        } else if(action.type === "PLACE_TERRAIN") {
            api.net.colyseus.sendDirect("REMOVE_TERRAIN", {
                x: action.data.x,
                y: action.data.y,
                depth: action.data.depth
            });
        } else if(action.type === "REMOVE_TERRAIN") {
            api.net.colyseus.sendDirect("PLACE_TERRAIN", action.data);
        } else if(action.type === "PLACE_WIRE") {
            api.net.colyseus.sendDirect("REMOVE_WIRE", {
                id: `${action.data.startDevice}-${action.data.endDevice}`
            });
        } else if(action.type === "REMOVE_WIRE") {
            api.net.colyseus.sendDirect("PLACE_WIRE", action.data);
        }
    }

    redoStack.push(actions);
    api.UI.toast.success(`Undid ${actions.length} action${actions.length > 1 ? "s" : ""}`);
}

export function redo() {
    const actions = redoStack.pop();
    if(!actions) {
        api.UI.toast.error("Nothing to redo");
        return;
    }

    for(let i = 0; i < actions.length; i++) {
        const action = actions[i];
        if(action.type === "PLACE_DEVICE") {
            api.net.colyseus.sendDirect("PLACE_DEVICE", action.data);
        } else if(action.type === "UPDATE_DEVICE") {
            api.net.colyseus.sendDirect("PLACE_DEVICE", action.data.to);
        } else if(action.type === "REMOVE_DEVICE") {
            api.net.colyseus.sendDirect("REMOVE_DEVICE", { id: action.data.id });
        } else if(action.type === "PLACE_TERRAIN") {
            api.net.colyseus.sendDirect("PLACE_TERRAIN", action.data);
        } else if(action.type === "REMOVE_TERRAIN") {
            api.net.colyseus.sendDirect("REMOVE_TERRAIN", {
                x: action.data.x,
                y: action.data.y,
                depth: action.data.depth
            });
        } else if(action.type === "PLACE_WIRE") {
            api.net.colyseus.sendDirect("PLACE_WIRE", action.data);
        } else if(action.type === "REMOVE_WIRE") {
            api.net.colyseus.sendDirect("REMOVE_WIRE", {
                id: `${action.data.startDevice}-${action.data.endDevice}`
            });
        }
    }

    undoStack.push(actions);
    api.UI.toast.success(`Redid ${actions.length} action${actions.length > 1 ? "s" : ""}`);
}
