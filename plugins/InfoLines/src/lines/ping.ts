import BaseLine from "../baseLine";

export default class Ping extends BaseLine {
    name = "Ping";
    enabledDefault = true;

    private deviceChangeRes: (() => void) | null = null;

    init() {
        let pongDelivered = false;

        // Prevent side effects
        const onDeviceStateChanges = (value: any, editFn: any) => {
            if(!value.initial) return;
            this.deviceChangeRes?.();
            editFn(null);
            pongDelivered = true;
        };

        const onTerrainChanges = (_: any, editFn: any) => {
            if(!pongDelivered) return;
            editFn(null);
        };

        const onWorldChanges = (_: any, editFn: any) => {
            if(!pongDelivered) return;
            pongDelivered = false;
            editFn(null);
        };

        api.net.on("DEVICES_STATES_CHANGES", onDeviceStateChanges);
        api.net.on("TERRAIN_CHANGES", onTerrainChanges);
        api.net.on("WORLD_CHANGES", onWorldChanges);

        const interval = setInterval(async () => {
            api.net.send("REQUEST_INITIAL_WORLD", undefined);
            const start = Date.now();
            await new Promise<void>(res => this.deviceChangeRes = res);
            this.update(`ping: ${Date.now() - start} ms`);
        }, 5000);

        this.disable = () => {
            api.net.off("DEVICES_STATES_CHANGES", onDeviceStateChanges);
            api.net.off("TERRAIN_CHANGES", onTerrainChanges);
            api.net.off("WORLD_CHANGES", onWorldChanges);
            clearInterval(interval);
        };
    }
}
