import type { Vector } from "@dimforge/rapier2d-compat";
import type { IRecording } from "../types";
import { stopUpdatingLasers, updateLasers } from "./updateLasers";
import type * as Desynchronize from "plugins/Desynchronize/src";

export default class Recorder {
    nativeStep: Gimloader.Stores.PhysicsManager["physicsStep"];
    physics = api.stores.phaser.mainCharacter.physics;
    rb = this.physics.getBody().rigidBody;
    inputManager = api.stores.phaser.scene.inputManager;
    getPhysicsInput = this.inputManager.getPhysicsInput;

    startPos: Vector = { x: 0, y: 0 };
    startState = "";
    platformerPhysics = "";
    frames: Gimloader.Stores.TickInput[] = [];

    recording = false;
    playing = false;

    constructor(public physicsManager: Gimloader.Stores.PhysicsManager) {
        this.physicsManager = physicsManager;
        this.nativeStep = physicsManager.physicsStep;

        // load all bodies in at once for deterministic physics
        for(const id of physicsManager.bodies.staticBodies) {
            physicsManager.bodies.activeBodies.enableBody(id);
        }

        // ignore attempts to disable bodies
        physicsManager.bodies.activeBodies.disableBody = () => {};
    }

    toggleRecording() {
        if(this.recording) {
            const conf = window.confirm("Do you want to save the recording?");
            this.stopRecording(conf);
        } else this.startRecording();
    }

    startRecording() {
        this.recording = true;

        this.startPos = this.rb.translation();
        this.startState = JSON.stringify(this.physics.state);
        this.platformerPhysics = JSON.stringify(GL.platformerPhysics);
        this.frames = [];

        api.notification.open({ message: "Started Recording" });

        this.inputManager.getPhysicsInput = this.getPhysicsInput;
        this.physicsManager.physicsStep = (dt) => {
            this.frames.push(this.inputManager.getPhysicsInput());

            this.nativeStep(dt);
            updateLasers(this.frames.length);
        };
    }

    stopRecording(save: boolean, fileName?: string) {
        this.recording = false;
        this.physicsManager.physicsStep = this.nativeStep;
        stopUpdatingLasers();

        if(!save) return;

        // download the file
        const json: IRecording = {
            startPos: this.startPos,
            startState: this.startState,
            platformerPhysics: this.platformerPhysics,
            frames: this.frames
        };

        const blob = new Blob([JSON.stringify(json)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const name = api.stores.phaser.mainCharacter.nametag.name;

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName ?? `recording-${name}.json`;
        a.click();
    }

    async playback(data: IRecording) {
        const desync = api.plugin("Desynchronize") as typeof Desynchronize;
        desync.DLD.cancelRespawn();

        this.playing = true;
        this.platformerPhysics = JSON.stringify(GL.platformerPhysics);

        this.rb.setTranslation(data.startPos, true);
        this.physics.state = JSON.parse(data.startState);
        Object.assign(GL.platformerPhysics, JSON.parse(data.platformerPhysics));

        this.physicsManager.physicsStep = (dt) => {
            api.stores.phaser.mainCharacter.physics.postUpdate(dt);
        };

        await new Promise(resolve => setTimeout(resolve, 1500));

        let currentFrame = 0;

        this.physicsManager.physicsStep = (dt) => {
            const frame = data.frames[currentFrame];
            if(!frame) {
                this.stopPlayback();
                api.notification.open({ message: "Playback finished" });
                return;
            }

            this.inputManager.getPhysicsInput = () => frame;

            this.nativeStep(dt);

            currentFrame++;
            updateLasers(currentFrame);
        };
    }

    stopPlayback() {
        this.playing = false;
        Object.assign(GL.platformerPhysics, JSON.parse(this.platformerPhysics));
        stopUpdatingLasers();

        this.physicsManager.physicsStep = this.nativeStep;
        this.inputManager.getPhysicsInput = this.getPhysicsInput;
    }
}
