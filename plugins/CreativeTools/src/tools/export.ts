import type { CodeGrid, Device, MapData, Tile, Wire } from "../types";
import { downloadFile } from "$shared/files";

export function exportWholeMap() {
    const data = getWholeMapData();
    downloadFile(JSON.stringify(data), "map.json", "application/json");
}

export function getWholeMapData(): MapData {
    // Get all the tiles from the tilemap
    const terrain: Tile[] = [];
    const layerManager = api.stores.phaser.scene.tileManager.layerManager;

    for(let i = 1; i <= 5; i++) {
        const layer = layerManager.layers.get(`terrain-${i}`);
        for(const tile of layer.tiles.values()) {
            terrain.push({
                x: tile.x,
                y: tile.y,
                terrain: tile.terrainOption.id,
                collides: tile.collides,
                depth: i
            });
        }
    }

    // Get all devices from the device manager
    const devices: Device[] = [];
    const deviceManager = api.stores.phaser.scene.worldManager.devices;

    for(const device of deviceManager.allDevices) {
        devices.push({
            x: device.x,
            y: device.y,
            depth: device.layers.depth,
            layerId: device.layers.layer,
            deviceId: device.deviceOption.id,
            id: device.id,
            options: device.options
        });
    }

    // Get all wires from the world store
    const wires: Wire[] = [];

    for(const wire of api.stores.world.wires.wires.values()) {
        wires.push({
            endConnection: wire.endConnection,
            endDevice: wire.endDevice,
            startConnection: wire.startConnection,
            startDevice: wire.startDevice
        });
    }

    // Get all code grids from the world store
    const gridsStore = api.stores.world.devices.codeGrids;
    const codeGrids: Record<string, Record<string, CodeGrid>> = {};

    for(const deviceId of gridsStore.keys()) {
        const items = gridsStore.get(deviceId)?.items;
        if(!items) continue;

        for(const gridId of items.keys()) {
            const grid = items.get(gridId);
            if(!grid) continue;

            codeGrids[deviceId] ??= {};
            codeGrids[deviceId][gridId] = {
                triggerType: grid.triggerType,
                triggerValue: grid.triggerValue,
                json: JSON.parse(grid.json)
            };
        }
    }

    return {
        terrain,
        devices,
        wires,
        codeGrids
    };
}
