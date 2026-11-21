export function getTerrainOptions() {
    const terrainOptions = api.stores.worldOptions.terrainOptions;
    return terrainOptions.map((t) => ({
        label: t.name,
        value: t.id
    }));
}

export function dataFromDevice(device: Gimloader.Stores.Device) {
    return {
        x: device.x,
        y: device.y,
        depth: device.depth,
        layerId: device.layers.layer,
        deviceTypeId: device.deviceOption.id,
        id: device.id,
        options: JSON.stringify(prepareOptions(device.options))
    };
}

export function dataFromDeviceInfo(device: Gimloader.Stores.DeviceData) {
    return {
        x: device.x,
        y: device.y,
        depth: device.depth,
        layerId: device.layerId,
        deviceTypeId: device.deviceOption.id,
        id: device.id,
        options: JSON.stringify(prepareOptions(device.options))
    };
}

export function prepareOptions(options: Record<string, any>) {
    const newOptions = { ...options };

    for(const key in newOptions) {
        if(newOptions[key] === null) {
            delete newOptions[key];
        }
    }

    return newOptions;
}

export function safeParse(json: string, defaultVal: any) {
    try {
        return JSON.parse(json);
    } catch {
        return defaultVal;
    }
}
