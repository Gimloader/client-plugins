import type { RigidBody } from "@dimforge/rapier2d-compat";
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

    private rb?: RigidBody;

    init() {
        this.rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
    }

    onPhysicsTick() {
        const velocity = this.rb?.linvel();
        if(!velocity) return;

        const decimals = api.settings.velocityDecimalPlaces;

        this.update(`velocity x: ${velocity.x.toFixed(decimals)}, y: ${velocity.y.toFixed(decimals)}`);
    }
}
