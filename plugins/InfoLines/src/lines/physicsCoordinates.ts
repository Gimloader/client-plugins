import BaseLine from "../baseLine";

export default class PhysicsCoordinates extends BaseLine {
    name = "Physics Coordinates";
    enabledDefault = false;
    settings: Gimloader.PluginSetting[] = [{
        type: "slider",
        id: "physicsCoordsDecimalPlaces",
        title: "Physics coordinates decimal places",
        min: 0,
        max: 10,
        step: 1,
        default: 2
    }];

    init() {
        const { physics } = api.stores.phaser.mainCharacter;
        const rb = physics.getBody().rigidBody;

        this.on("physicsTick", () => {
            const translation = rb?.translation();
            if(!translation) return;

            const decimals = api.settings.physicsCoordsDecimalPlaces;

            this.update(`physics x: ${translation.x.toFixed(decimals)}, y: ${translation.y.toFixed(decimals)}`);
        });
    }
}
