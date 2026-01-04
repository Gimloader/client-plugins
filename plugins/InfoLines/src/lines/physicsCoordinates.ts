import type { RigidBody } from "@dimforge/rapier2d-compat";
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

    private rb?: RigidBody;

    init() {
        this.rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
    }

    onPhysicsTick() {
        const translation = this.rb?.translation();
        if(!translation) return;

        const decimals = api.settings.physicsCoordsDecimalPlaces;

        this.update(`physics x: ${translation.x.toFixed(decimals)}, y: ${translation.y.toFixed(decimals)}`);
    }
}
