import BaseLine from "../baseLine";
import type { autorun } from "mobx";

const fishValues = {
    "gray": 1,
    "green": 2,
    "red": 5,
    "blue": 10,
    "purple": 20,
    "beach": 40,
    "star": 65,
    "galaxy": 100,
    "berry": 150,
    "gim": 5000
};

export default class FishValue extends BaseLine {
    name = "Fishtopia Fish Value";
    gamemode = "fishtopia";
    enabledDefault = false;

    async init() {
        const allDevices = api.stores.phaser.scene.worldManager.devices.allDevices;

        const autorunFn = await new Promise<typeof autorun>(res => {
            api.rewriter.exposeVar(true, {
                find: /isMobxAction===!0}function (\S+)\(/,
                callback: res
            });
        });

        this.onStop(
            autorunFn(() => {
                let total = 0;

                for(const [id, { amount }] of api.stores.me.inventory.slots) {
                    if(!id.endsWith("-fish")) continue;
                    const fishName = id.split("-")[0];
                    total += fishValues[fishName as keyof typeof fishValues] * amount;
                }

                const multiplierDevice = allDevices.find(d => d.options.guiMessage === "Purchase Cash In ($70)");
                if(multiplierDevice && !multiplierDevice.state.active) {
                    total = Math.round(total * 1.3);
                }

                this.update(`fish value: $${total}`);
            })
        );
    }
}
