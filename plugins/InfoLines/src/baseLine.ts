import EventEmitter from "eventemitter3";

export default abstract class BaseLine extends EventEmitter<{
    stop: [];
    update: [string];
    frame: [];
    physicsTick: [];
}> {
    abstract name: string;
    abstract enabledDefault: boolean;
    abstract init(): void;
    settings?: Gimloader.PluginSetting[];

    protected net = {
        on: (...args: Parameters<Gimloader.NetApi["on"]>) => {
            this.on("stop", () => {
                api.net.off(args[0], args[1]);
            });
            return api.net.on(...args);
        }
    };

    protected patcher = {
        before: (...args: Parameters<Gimloader.Api["patcher"]["before"]>) => {
            this.on("stop", api.patcher.before(...args));
        },
        after: (...args: Parameters<Gimloader.Api["patcher"]["after"]>) => {
            this.on("stop", api.patcher.after(...args));
        }
    };

    enable() {
        const { worldManager } = api.stores.phaser.scene;

        this.patcher.after(worldManager, "update", () => this.emit("frame"));
        this.patcher.after(worldManager.physics, "physicsStep", () => this.emit("physicsTick"));

        this.init();
    }

    disable() {
        this.emit("stop");
        this.removeAllListeners("frame");
        this.removeAllListeners("physicsTick");
    }

    update(value: string) {
        this.emit("update", value);
    }
}
