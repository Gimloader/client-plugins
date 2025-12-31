import type { ISharedValues } from "../types";

let lasers: Gimloader.Stores.Device[] = [];
let laserOffset: number = api.storage.getValue("laserOffset", 0);

api.net.on("DEVICES_STATES_CHANGES", (packet) => {
    for(let i = 0; i < packet.changes.length; i++) {
        const device = packet.changes[i];
        if(lasers.some(l => l.id === device[0])) {
            packet.changes.splice(i, 1);
            i -= 1;
        }
    }
});

export function initLasers(values: ISharedValues) {
    api.hotkeys.addHotkey({
        key: "KeyL",
        alt: true
    }, () => {
        api.hotkeys.releaseAll();

        const offset = prompt(`Enter the laser offset in frames, from 0 to 65 (currently ${laserOffset})`);
        if(offset === null) return;

        const parsed = parseInt(offset, 10);

        if(Number.isNaN(parsed) || parsed < 0 || parsed > 65) {
            alert("Invalid offset");
            return;
        }

        setLaserOffset(parsed);
        updateLasers(values.currentFrame);
    });
}

export function getLaserOffset() {
    return laserOffset;
}

export function setLaserOffset(offset: number) {
    laserOffset = offset;
    api.storage.getValue("laserOffset", offset);
}

export function updateLasers(frame: number) {
    if(lasers.length === 0) {
        lasers = api.stores.phaser.scene.worldManager.devices.allDevices.filter((d) => d.laser);
    }

    // lasers turn on for 36 frames and off for 30 frames
    const states = api.stores.world.devices.states;
    const devices = api.stores.phaser.scene.worldManager.devices;
    const active = (frame + laserOffset) % 66 < 36;

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
