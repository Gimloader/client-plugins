export interface Tile {
    x: number;
    y: number;
    terrain: string;
    collides: boolean;
    depth: number;
}

export interface Device {
    x: number;
    y: number;
    id: string;
    layerId: string;
    deviceId: string;
    depth: number;
    options: Record<string, any>;
}

export interface Wire {
    endConnection?: string;
    endDevice: string;
    startConnection?: string;
    startDevice: string;
}

export interface CodeGrid {
    triggerType: string;
    triggerValue?: string;
    json: any;
}

export interface MapData {
    terrain: Tile[];
    devices: Device[];
    codeGrids: Record<string, Record<string, CodeGrid>>;
    wires: Wire[];
}

export interface SelectedTile {
    x: number;
    y: number;
    realX: number;
    realY: number;
    tilemapX: number;
    tilemapY: number;
    width: number;
    height: number;
    terrainOption: Gimloader.Stores.TerrainOption;
    collides: boolean;
    depth: number;
}

export interface DeviceData {
    x: number;
    y: number;
    depth: number;
    layerId: string;
    deviceTypeId: string;
    id: string;
    options: string;
}

export interface Actions {
    "UPDATE_DEVICE": { from: DeviceData; to: DeviceData };
    "PLACE_DEVICE": DeviceData;
    "REMOVE_DEVICE": DeviceData;
    "PLACE_TERRAIN": Gimloader.Stores.Tile;
    "REMOVE_TERRAIN": Gimloader.Stores.Tile;
    "PLACE_WIRE": Wire;
    "REMOVE_WIRE": Wire;
}

export type Action = {
    [K in keyof Actions]: {
        type: K;
        data: Actions[K];
    };
}[keyof Actions];
