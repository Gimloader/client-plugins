import type { CodeGrid, Device, MapData, Tile, Wire } from "../types";
import { downloadFile } from "$shared/files";
import { safeParse } from "../util";
import { selectedTileIds } from "./selection";

export function exportWholeMap() {
    const data = getMapData(false);
    downloadFile(JSON.stringify(data), "map.json", "application/json");
}

export function exportSelection() {
    const data = getMapData(true);
    downloadFile(JSON.stringify(data), "selection.json", "application/json");
}

function getMapData(selectionOnly: boolean): MapData {
    // Get all the tiles from the tilemap
    const terrain: Tile[] = [];
    const layerManager = api.stores.phaser.scene.tileManager.layerManager;

    for(let i = 1; i <= 5; i++) {
        const layer = layerManager.layers.get(`terrain-${i}`);
        for(const tile of layer.tiles.values()) {
            if(selectionOnly && !selectedTileIds.has(`${i}_${tile.x}_${tile.y}`)) continue;

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
    const multiselect = api.stores.phaser.scene.actionManager.multiselect;
    const deviceSelected = (id: string) => multiselect.selectedDevicesIds.includes(id);

    for(const device of deviceManager.allDevices) {
        if(selectionOnly && !deviceSelected(device.id)) continue;

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
        if(selectionOnly && (!deviceSelected(wire.startDevice) || !deviceSelected(wire.endDevice))) continue;

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
        if(selectionOnly && !deviceSelected(deviceId)) continue;

        const items = gridsStore.get(deviceId)?.items;
        if(!items) continue;

        for(const gridId of items.keys()) {
            const grid = items.get(gridId);
            if(!grid) continue;

            codeGrids[deviceId] ??= {};
            codeGrids[deviceId][gridId] = {
                triggerType: grid.triggerType,
                triggerValue: grid.triggerValue,
                json: safeParse(grid.json, {})
            };
        }
    }

    const mobxCustomAssets = api.stores.world.customAssets.customAssets;
    const customAssets = Object.fromEntries(JSON.parse(JSON.stringify(mobxCustomAssets)));

    if(selectionOnly) {
        const includeShapes = new Set<string>();
        for(const device of multiselect.selectedDevices) {
            if(device.deviceOption.id !== "scalableShape") continue;

            const shapeId = device.options.customAssetId;
            if(shapeId) includeShapes.add(shapeId);
        }

        for(const shapeId in customAssets) {
            if(!includeShapes.has(shapeId)) {
                delete customAssets[shapeId];
            }
        }
    }

    return {
        isRegion: selectionOnly,
        terrain,
        devices,
        wires,
        codeGrids,
        customAssets
    };
}
