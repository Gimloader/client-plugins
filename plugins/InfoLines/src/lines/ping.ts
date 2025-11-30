import BaseLine from "../baseLine";

export default class Ping extends BaseLine {
    name = "Ping";
    enabledDefault = true;

    init() {
        this.update("calculating ping...");

        let pongDelivered = false;
        let deviceChangeRes: (() => void) | null = null;

        // Prevent side effects
        this.net.on("DEVICES_STATES_CHANGES", (value, editFn) => {
            if(!value.initial) return;
            deviceChangeRes?.();
            editFn(null);
            pongDelivered = true;
        });

        this.net.on("TERRAIN_CHANGES", (_, editFn) => {
            if(!pongDelivered) return;
            editFn(null);
        });

        this.net.on("WORLD_CHANGES", (_, editFn) => {
            if(!pongDelivered) return;
            pongDelivered = false;
            editFn(null);
        });

        const interval = setInterval(async () => {
            api.net.send("REQUEST_INITIAL_WORLD");
            const start = Date.now();
            await new Promise<void>(res => deviceChangeRes = res);
            this.update(`ping: ${Date.now() - start} ms`);
        }, 5000);

        this.on("stop", () => clearInterval(interval));
    }
}
