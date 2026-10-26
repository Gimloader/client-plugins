import { pauseSend } from "../util";
import { clearUndoStacks } from "./undo";

export async function nukeMap() {
    const warning = "Are you sure you want to remove everything from the map? This cannot be undone.";
    if(!api.UI.confirm("Remove Everything Confirmation", warning)) return;

    api.UI.toast.promise(removeTilesAndDevices(), {
        loading: "Removing everything from map...",
        success: "Done!",
        error: "Something went wrong"
    });
}

async function removeTilesAndDevices() {
    const layerManager = api.stores.phaser.scene.tileManager.layerManager;
    clearUndoStacks();

    for(let i = 1; i <= 5; i++) {
        const layer = layerManager.layers.get(`terrain-${i}`);
        for(const tile of layer.tiles.values()) {
            api.net.colyseus.sendDirect("REMOVE_TERRAIN", {
                x: tile.x,
                y: tile.y,
                depth: i
            });

            await pauseSend();
        }
    }

    const deviceManager = api.stores.phaser.scene.worldManager.devices;

    for(const device of deviceManager.allDevices) {
        if(device.deviceOption.id === "mapOptions") continue;

        api.net.colyseus.sendDirect("REMOVE_DEVICE", { id: device.id });
        await pauseSend();
    }

    clearUndoStacks();
}
