import BaseLine from "../baseLine";

export default class VisualCoordinates extends BaseLine {
    name = "Visual Coordinates";
    enabledDefault = true;
    settings: Gimloader.PluginSetting[] = [{
        type: "slider",
        id: "visualCoordsDecimalPlaces",
        title: "Visual coordinates decimal places",
        min: 0,
        max: 10,
        step: 1,
        default: 2
    }];

    init() {
        this.on("frame", () => {
            const { body } = api.stores.phaser.mainCharacter;
            const decimals = api.settings.visualCoordsDecimalPlaces;
            this.update(`visual x: ${body.x.toFixed(decimals)}, y: ${body.y.toFixed(decimals)}`);
        });
    }
}
