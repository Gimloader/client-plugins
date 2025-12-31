let lasers: Gimloader.Stores.Device[] = [];

api.net.on("DEVICES_STATES_CHANGES", (packet) => {
    for(let i = 0; i < packet.changes.length; i++) {
        const device = packet.changes[i];
        if(lasers.some(l => l.id === device[0])) {
            packet.changes.splice(i, 1);
            i -= 1;
        }
    }
});

export function stopUpdatingLasers() {
    lasers = [];
}

let lastActive: boolean | null = null;

export function updateLasers(frame: number) {
    if(lasers.length === 0) {
        lasers = api.stores.phaser.scene.worldManager.devices.allDevices.filter((d) => d.laser);
    }

    // lasers turn on for 36 frames and off for 30 frames
    const states = api.stores.world.devices.states;
    const devices = api.stores.phaser.scene.worldManager.devices;
    const active = frame % 66 < 36;

    // More performative
    if(lastActive === active) return;
    lastActive = active;

    if(!states.has(lasers[0].id)) {
        lasers = api.stores.phaser.scene.worldManager.devices.allDevices.filter((d) => d.laser);
    }

    for(const laser of lasers) {
        if(!states.has(laser.id)) {
            const propsMap = new Map();
            propsMap.set("GLOBAL_active", active);
            states.set(laser.id, { deviceId: laser.id, properties: propsMap });
        } else {
            states.get(laser.id)?.properties.set("GLOBAL_active", active);
        }
        devices.getDeviceById(laser.id)?.onStateUpdateFromServer("GLOBAL_active", active);
    }
}
