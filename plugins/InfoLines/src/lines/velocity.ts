import BaseLine from "../baseLine";

export default class Velocity extends BaseLine {
    name = "Velocity";
    enabledDefault = true;
    settings: Gimloader.PluginSetting[] = [{
        type: "slider",
        id: "velocityDecimalPlaces",
        title: "Velocity decimal places",
        min: 0,
        max: 10,
        step: 1,
        default: 2
    }];

    init() {
        const { physics } = api.stores.phaser.mainCharacter;
        const rb = physics.getBody().rigidBody;

        this.on("physicsTick", () => {
            const velocity = rb?.linvel();
            if(!velocity) return;

            const decimals = api.settings.velocityDecimalPlaces;

            this.update(`velocity x: ${velocity.x.toFixed(decimals)}, y: ${velocity.y.toFixed(decimals)}`);
        });
    }
}
