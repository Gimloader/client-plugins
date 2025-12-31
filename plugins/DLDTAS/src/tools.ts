import type { ISharedValues } from "../types";
import { getMoveSpeed } from "./index";
import { initLasers, updateLasers } from "./updateLasers";
import { defaultState, generatePhysicsInput } from "./util";

export default class TASTools {
    physicsManager = api.stores.phaser.scene.worldManager.physics;
    nativeStep = this.physicsManager.physicsStep;
    physics = api.stores.phaser.mainCharacter.physics;
    rb = this.physics.getBody().rigidBody;
    inputManager = api.stores.phaser.scene.inputManager;
    getPhysicsInput = this.inputManager.getPhysicsInput;
    slowdownAmount = 1;
    slowdownDelayedFrames = 0;
    // hardcoded, for now
    startPos = { x: 33.87, y: 638.38 };
    startState = defaultState;

    constructor(public values: ISharedValues, public updateTable: () => void) {
        this.physicsManager.physicsStep = (dt: number) => {
            // only rerender, rather than running the physics loop
            api.stores.phaser.mainCharacter.physics.postUpdate(dt);
        };
        api.onStop(() => this.physicsManager.physicsStep = this.nativeStep);
        api.onStop(() => this.inputManager.getPhysicsInput = this.getPhysicsInput);

        this.reset();
        initLasers(this.values);
    }

    reset() {
        this.rb.setTranslation(this.startPos, true);

        this.physics.state = JSON.parse(this.startState);
    }

    startPlaying() {
        const { frames } = this.values;
        this.slowdownDelayedFrames = 0;

        this.physicsManager.physicsStep = (dt: number) => {
            this.slowdownDelayedFrames++;

            if(this.slowdownDelayedFrames < this.slowdownAmount) return;

            this.slowdownDelayedFrames = 0;

            updateLasers(this.values.currentFrame);

            // set the inputs
            const frame = frames[this.values.currentFrame];
            if(frame) {
                const translation = this.rb.translation();
                frames[this.values.currentFrame].translation = { x: translation.x, y: translation.y };
                frames[this.values.currentFrame].state = JSON.stringify(this.physics.state);

                const input = generatePhysicsInput(frame, frames[this.values.currentFrame - 1]);
                this.inputManager.getPhysicsInput = () => input;
            }

            this.setMoveSpeed();

            // step the game
            this.nativeStep(dt);

            // advance the frame
            this.values.currentFrame++;
            this.updateTable();
        };
    }

    stopPlaying() {
        this.physicsManager.physicsStep = (dt: number) => {
            // only rerender, rather than running the physics loop
            api.stores.phaser.mainCharacter.physics.postUpdate(dt);
        };
    }

    startControlling() {
        this.slowdownDelayedFrames = 0;

        this.inputManager.getPhysicsInput = this.getPhysicsInput;
        this.physicsManager.physicsStep = (dt: number) => {
            // check if we should slow down the game
            this.slowdownDelayedFrames++;
            if(this.slowdownDelayedFrames < this.slowdownAmount) return;
            this.slowdownDelayedFrames = 0;

            // Incorrect type
            const keys = this.inputManager.keyboard.heldKeys as unknown as Set<number>;
            const { KeyCodes } = Phaser.Input.Keyboard;

            // log the inputs and translation/state
            const left = keys.has(KeyCodes.LEFT) || keys.has(KeyCodes.A);
            const right = keys.has(KeyCodes.RIGHT) || keys.has(KeyCodes.D);
            const up = keys.has(KeyCodes.UP) || keys.has(KeyCodes.W) || keys.has(KeyCodes.SPACE);

            const translation = this.rb.translation();
            const state = JSON.stringify(this.physics.state);

            this.values.frames[this.values.currentFrame] = { left, right, up, translation, state };

            this.setMoveSpeed();
            this.nativeStep(dt);

            // update the current frame
            this.values.currentFrame++;
            this.updateTable();
        };
    }

    stopControlling() {
        this.physicsManager.physicsStep = (dt: number) => {
            // only rerender, rather than running the physics loop
            api.stores.phaser.mainCharacter.physics.postUpdate(dt);
        };
    }

    advanceFrame() {
        const frame = this.values.frames[this.values.currentFrame];
        if(!frame) return;

        this.setMoveSpeed();

        // log the current translation and state
        const translation = this.rb.translation();
        frame.translation = { x: translation.x, y: translation.y };
        frame.state = JSON.stringify(this.physics.state);

        // generate the input
        const lastFrame = this.values.frames[this.values.currentFrame - 1];
        const input = generatePhysicsInput(frame, lastFrame);

        this.inputManager.getPhysicsInput = () => input;

        // step the game
        this.nativeStep(0);

        this.values.currentFrame++;

        updateLasers(this.values.currentFrame);
    }

    setSlowdown(amount: number) {
        this.slowdownAmount = amount;
        this.slowdownDelayedFrames = 0;
    }

    // this function should only ever be used when going back in time
    setFrame(number: number) {
        const frame = this.values.frames[number];
        if(!frame || !frame.translation || !frame.state) return;

        this.values.currentFrame = number;

        updateLasers(this.values.currentFrame);
        this.rb.setTranslation(frame.translation, true);
        this.physics.state = JSON.parse(frame.state);
    }

    setMoveSpeed() {
        api.stores.me.movementSpeed = getMoveSpeed();
    }
}
