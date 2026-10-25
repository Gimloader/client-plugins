const maxSendsPerSecond = 100;
const sendDelay = 1000 / maxSendsPerSecond;

export function pauseSend() {
    return new Promise((res) => setTimeout(res, sendDelay));
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
    if(options.grantItemWhenDamaged || options.itemToGrant === undefined) return options;

    const { itemToGrant, ...rest } = options;
    return rest;
}
