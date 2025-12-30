import { resetCoordinates, summitCoords, summitStartCoords } from "../constants";
import BasicTimer from "../timers/basic";
import SplitsTimer from "../timers/splits";
import type { DLDData } from "../types";
import { DLDFullGameUI, DLDSummitUI } from "../ui/DLD";
import { fmtMs, inArea, onFrame, onPhysicsStep } from "../util";
import { SplitsAutosplitter } from "./autosplitter";

export default class DLDAutosplitter extends SplitsAutosplitter {
    declare data: DLDData;
    ui!: DLDSummitUI | DLDFullGameUI;
    timer!: BasicTimer | SplitsTimer;

    category: string = "Current Patch";

    couldStartLastFrame = true;
    loadedCorrectSummit = false;
    hasMoved = false;
    autoRecording = false;

    constructor() {
        super("DLD");

        this.category = "Current Patch";
        if(api.plugins.isEnabled("BringBackBoosts")) {
            const bbbSettings = GL.storage.getValue("BringBackBoosts", "QS-Settings", {});
            if(bbbSettings.useOriginalPhysics) {
                this.category = "Original Physics";
            } else {
                this.category = "Creative Platforming Patch";
            }
        }

        if(this.category === "Current Patch") {
            this.data.ilPreboosts = false;
        }

        this.updateTimerAndUI();

        onPhysicsStep(() => {
            const input = api.stores.phaser.scene.inputManager.getPhysicsInput();

            if(input.jump || input.angle !== null) this.hasMoved = true;
        });

        // whenever a frame passes check if we've reached any summits
        onFrame(() => {
            if(this.data.mode === "Full Game") this.updateFullGame();
            else if(this.data.ilPreboosts) this.updatePreboosts();
            else this.updateNoPreboosts();

            this.hasMoved = false;
        });

        const savestates = api.plugin("Savestates");
        if(savestates) {
            savestates.onStateLoaded(this.onStateLoadedBound);
        }
    }

    updateTimerAndUI() {
        this.ui?.remove();
        if(this.data.mode === "Full Game") {
            const ui = new DLDFullGameUI(this);
            this.ui = ui;
            this.timer = new SplitsTimer(this, ui);
        } else {
            const ui = new DLDSummitUI(this);
            this.ui = ui;
            this.timer = new BasicTimer(this, ui);
        }
    }

    getCategoryId() {
        if(this.data.mode === "Full Game") return this.category;
        if(this.data.ilPreboosts) return `${this.category}-${this.data.ilSummit}-preboosts`;
        return `${this.category}-${this.data.ilSummit}`;
    }

    setMode(mode: string, ilsummit?: number, ilPreboosts?: boolean) {
        if(this.category === "Current Patch") ilPreboosts = false;

        const modeChanged = this.data.mode !== mode;

        // set and save values
        this.data.mode = mode;
        if(ilsummit !== undefined) this.data.ilSummit = ilsummit;
        if(ilPreboosts !== undefined) this.data.ilPreboosts = ilPreboosts;

        this.save();
        this.couldStartLastFrame = true;

        if(modeChanged) {
            this.updateTimerAndUI();
        } else {
            this.ui.updateAttempts();
        }
    }

    setCategory(name: string) {
        this.category = name;
        this.ui.updateAttempts();
    }

    ilState = "waiting";

    updatePreboosts() {
        const body = api.stores.phaser.mainCharacter.body;
        const coords = summitCoords[this.data.ilSummit];

        if(this.ilState === "waiting") {
            if(inArea(body, coords)) {
                if(this.couldStartLastFrame) return;
                this.ilState = "started";
                this.timer.start();
                this.onRunStart();

                this.timer.update();
            } else {
                this.couldStartLastFrame = false;
            }
        } else if(this.ilState === "started") {
            // check if we've reached the end
            if(inArea(body, summitStartCoords[this.data.ilSummit + 1])) {
                this.ilState = "completed";
                this.couldStartLastFrame = true;
                this.onRunEnd();
            } else {
                this.timer.update();
            }
        }
    }

    updateNoPreboosts() {
        if(!this.loadedCorrectSummit) return;
        const body = api.stores.phaser.mainCharacter.body;

        if(this.ilState === "waiting") {
            if(this.hasMoved) {
                this.ilState = "started";
                this.timer.start();
                this.onRunStart();
                this.timer.update();
            }
        } else if(this.ilState === "started") {
            if(inArea(body, summitStartCoords[this.data.ilSummit + 1])) {
                this.ilState = "completed";
                this.onRunEnd();
            } else {
                this.timer.update();
            }
        }
    }

    summit = 0;

    updateFullGame() {
        const body = api.stores.phaser.mainCharacter.body;

        // check if we're at a position where we should reset
        if(this.summit > 0 && body.x < resetCoordinates.x && body.y > resetCoordinates.y) {
            this.reset();
            return;
        }

        if(this.summit > summitStartCoords.length - 1) return;
        if(this.summit === 0) {
            if(body.x > summitStartCoords[0].x && body.y < summitStartCoords[0].y + 10) {
                if(this.couldStartLastFrame) return;
                this.summit = 1;
                this.timer.start();
                this.onRunStart();
            } else {
                this.couldStartLastFrame = false;
            }
        } else if(inArea(body, summitStartCoords[this.summit])) {
            this.summit++;
            (this.timer as SplitsTimer).split();

            // Check if the run is finished
            if(this.summit > summitStartCoords.length - 1) {
                this.onRunEnd();
            }
        }

        this.timer.update();
    }

    getRecorder() {
        const inputRecorder = api.plugin("InputRecorder");
        if(!inputRecorder) return;

        return inputRecorder.getRecorder();
    }

    onRunStart() {
        this.addAttempt();
        this.ui.updateAttempts();
        this.ui.lockInCategory();

        if(!this.data.autoRecord) return;
        const recorder = this.getRecorder();
        if(!recorder) return;

        // Don't auto-record during a manual recording or playback
        if(recorder.recording || recorder.playing) return;

        recorder.startRecording();
        this.autoRecording = true;
    }

    onRunEnd() {
        this.timer.stop();

        if(!this.data.autoRecord) return;
        const recorder = this.getRecorder();
        if(!recorder) return;

        // Don't stop unless we're recording
        if(!recorder.recording || recorder.playing || !this.autoRecording) return;
        this.autoRecording = false;

        const isPb = !this.pb || this.timer.elapsed < this.pb;
        if(!isPb) return;
        const username = api.stores.phaser.mainCharacter.nametag.name;
        let mode = "Full Game";
        if(this.data.mode !== "Full Game") {
            mode = `Summit ${this.data.ilSummit + 1}`;
            if(this.data.ilPreboosts) mode += " (Preboosts)";
        }

        const time = fmtMs(this.timer.elapsed);

        recorder.stopRecording(isPb, `recording-${username}-${this.category}-${mode}-${time}.json`);

        api.notification.open({ message: `Auto-saved PB of ${time}`, placement: "topLeft" });
    }

    onStateLoaded(summit: number | "custom") {
        if(summit === "custom") return;
        if(this.data.autostartILs) {
            if(summit === 1 && this.data.mode === "Full Game") return;
            this.setMode("Summit", summit - 1);
            this.reset();

            if(!this.data.ilPreboosts) this.loadedCorrectSummit = true;
            return;
        }

        if(this.data.mode === "Full Game") return;
        if(this.data.ilPreboosts) return;

        if(this.ilState !== "waiting") {
            this.reset();
        }

        this.loadedCorrectSummit = summit === this.data.ilSummit + 1;
    }

    onStateLoadedBound = this.onStateLoaded.bind(this);

    reset() {
        // kind of cheaty way to reset the UI
        this.updateTimerAndUI();
        this.summit = 0;
        this.ilState = "waiting";
        this.couldStartLastFrame = true;
        this.loadedCorrectSummit = false;

        const recorder = this.getRecorder();
        if(recorder?.recording && this.autoRecording) {
            recorder.stopRecording(false);
        }
    }

    destroy() {
        this.ui.remove();

        const savestates = api.plugin("Savestates");
        if(savestates) {
            savestates.offStateLoaded(this.onStateLoadedBound);
        }
    }
}
