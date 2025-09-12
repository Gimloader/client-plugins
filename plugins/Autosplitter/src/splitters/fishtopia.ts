import { boatChannels, fishtopiaSplits } from "../constants";
import SplitsUI from "../ui/splits";
import { SplitsAutosplitter } from "./autosplitter";
import SplitsTimer from '../timers/splits';
import { onFrame } from "../util";

export default class FishtopiaAutosplitter extends SplitsAutosplitter {
    ui = new SplitsUI(this, fishtopiaSplits);
    timer = new SplitsTimer(this, this.ui);

    usedChannels = new Set<string>();

    constructor() {
        super("Fishtopia");

        let gameSession = api.net.room.state.session.gameSession;

        api.net.room.state.session.listen("loadingPhase", (val: boolean) => {
            if(val) return;

            if(gameSession.phase === "game") {
                this.addAttempt();
                this.ui.updateAttempts();
                this.timer.start();
            }
        });

        // start the timer when the game starts
        gameSession.listen("phase", (phase: string) => {
            if(phase === "results") {
                this.reset();
            }
        });

        api.net.on("send:MESSAGE_FOR_DEVICE", (e: any) => {
            let id = e.deviceId;
            if(!id) return;
            let device = api.stores.phaser.scene.worldManager.devices.getDeviceById(id);
            let channel = device?.options?.channel;
            if(!channel) return;
            if(!boatChannels.includes(channel)) return;

            // split when we use a new boat
            if(this.usedChannels.has(channel)) return;
            this.usedChannels.add(channel);

            api.net.once("PHYSICS_STATE", (e: any) => {
                if(e.teleport) {
                    this.timer.split();
                }
            });
        });

        let id = api.stores.phaser.mainCharacter.id;
        api.net.room.state.characters.get(id).inventory.slots.onChange((_: any, key: string) => {
            if(key === "gim-fish") {
                this.timer.split();
                this.timer.stop();
            }
        })

        onFrame(() => {
            this.timer.update();
        })
    }

    getCategoryId() { return "fishtopia" }

    reset() {
        this.ui?.remove();
        this.ui = new SplitsUI(this, fishtopiaSplits);
        this.timer = new SplitsTimer(this, this.ui);
        this.usedChannels.clear();
    }

    destroy() {
        this.ui.remove();
    }
}