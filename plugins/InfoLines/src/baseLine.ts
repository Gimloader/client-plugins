type OnUpdateCallback = (value: string) => void;

export default abstract class BaseLine {
    abstract name: string;
    abstract enabledDefault: boolean;
    private onStopCallbacks: (() => void)[] = [];
    private onUpdateCallbacks: OnUpdateCallback[] = [];
    settings?: Gimloader.PluginSetting[];

    protected net = {
        on: (...args: Parameters<Gimloader.NetApi["on"]>) => {
            this.onStop(() => {
                api.net.off(args[0], args[1]);
            });
            return api.net.on(...args);
        }
    };

    protected patcher = {
        before: (...args: Parameters<Gimloader.Api["patcher"]["before"]>) => {
            this.onStop(api.patcher.before(...args));
        },
        after: (...args: Parameters<Gimloader.Api["patcher"]["after"]>) => {
            this.onStop(api.patcher.after(...args));
        }
    };

    enable() {
        api.net.onLoad(() => {
            if(this.onFrame) {
                this.patcher.after(api.stores.phaser.scene.worldManager, "update", () => this.onFrame?.());
            }
            if(this.onPhysicsTick) {
                this.patcher.after(api.stores.phaser.scene.worldManager.physics, "physicsStep", () => this.onPhysicsTick?.());
            }
            this.init?.();
        });
    }

    disable() {
        this.onStopCallbacks.forEach(cb => cb());
    }

    onStop(cb: () => void) {
        this.onStopCallbacks.push(cb);
    }

    onUpdate(cb: OnUpdateCallback) {
        this.onUpdateCallbacks.push(cb);
    }

    update(value: string) {
        this.onUpdateCallbacks.forEach(cb => cb(value));
    }

    protected onPhysicsTick?(): void;
    protected onFrame?(): void;
    protected init?(): void;
}
