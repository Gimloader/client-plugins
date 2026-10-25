import type { MapData } from "../types";
import { readJsonFile } from "$shared/files";
import { pauseSend, prepareOptions } from "../util";

export async function importWholeMap() {
    try {
        const data = await readJsonFile();
        await importWholeMapData(data);
    } catch {}
}

export async function importWholeMapData(data: MapData) {
    for(const tile of data.terrain) {
        api.net.colyseus.send("PLACE_TERRAIN", tile);
        await pauseSend();
    }

    for(const device of data.devices) {
        api.net.colyseus.send("PLACE_DEVICE", {
            x: device.x,
            y: device.y,
            id: device.id,
            deviceTypeId: device.deviceId,
            layerId: device.layerId,
            depth: device.depth,
            options: JSON.stringify(prepareOptions(device.options))
        });

        await pauseSend();
    }

    for(const wire of data.wires) {
        api.net.colyseus.send("PLACE_WIRE", wire);
        await pauseSend();
    }

    for(const deviceId in data.codeGrids) {
        for(const key in data.codeGrids[deviceId]) {
            const grid = data.codeGrids[deviceId][key];
            const json = JSON.stringify(grid.json);

            await createCodeGrid(deviceId, json, grid.triggerType, grid.triggerValue);
        }
    }
}

export async function createCodeGrid(deviceId: string, json: string, triggerType: string, triggerValue?: string) {
    api.net.colyseus.send("CREATE_CODE_GRID", {
        deviceId,
        triggerType,
        triggerValue
    });

    const gridId = await awaitGridCreation(deviceId);
    api.net.colyseus.send("JOIN_CODE_GRID", { deviceId, gridId });
    api.net.colyseus.send("SET_CODE_GRID_JSON", {
        json,
        deviceId,
        gridId
    });
    api.net.colyseus.send("LEAVE_CODE_GRID", { deviceId, gridId });
}

function awaitGridCreation(deviceId: string) {
    return new Promise<string>((res) => {
        const existingDevice = api.net.colyseus.state.world.devices.codeGrids.get(deviceId);
        if(existingDevice) {
            const unsubGrids = existingDevice.items.onAdd((_: any, gridKey: string) => {
                unsubGrids();
                res(gridKey);
            }, false);
            return;
        }

        // Wait for the device to be added then wait for the grid to be added
        const unsubDevices = api.net.colyseus.state.world.devices.codeGrids.onAdd((device, deviceKey) => {
            if(deviceKey !== deviceId) return;
            unsubDevices();

            const unsubGrids = device.items.onAdd((_: any, gridKey: string) => {
                unsubGrids();
                res(gridKey);
            }, false);
        });
    });
}
