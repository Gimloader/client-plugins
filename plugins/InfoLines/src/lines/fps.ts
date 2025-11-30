import BaseLine from "../baseLine";

export default class FPS extends BaseLine {
    name = "FPS";
    enabledDefault = true;

    init() {
        const { loop } = api.stores.phaser.scene.game;
        const updateFps = () => {
            this.update(`${Math.round(loop.actualFps)} fps`);
        };

        updateFps();
        this.patcher.after(loop, "updateFPS", updateFps);
    }
}
