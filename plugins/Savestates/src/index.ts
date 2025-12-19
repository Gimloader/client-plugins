import { summitCoords } from "$shared/consts";
import type * as Desynchronize from "plugins/Desynchronize/src";

const desync = api.plugin("Desynchronize") as typeof Desynchronize;

const defaultState =
    '{"gravity":0.001,"velocity":{"x":0,"y":0},"movement":{"direction":"none","xVelocity":0,"accelerationTicks":0},"jump":{"isJumping":false,"jumpsLeft":2,"jumpCounter":0,"jumpTicks":118,"xVelocityAtJumpStart":0},"forces":[],"grounded":true,"groundedTicks":0,"lastGroundedAngle":0}';

type StateLoadCallback = (summit: number | "custom") => void;
let stateLoadCallbacks: StateLoadCallback[] = [];

const tp = (summit: number) => {
    if(!gameLoaded) return;
    const physics = api.stores.phaser.mainCharacter.physics;
    const rb = physics.getBody().rigidBody;

    desync.DLD.cancelRespawn();

    rb.setTranslation(summitCoords[summit], true);
    physics.state = JSON.parse(defaultState);

    stateLoadCallbacks.forEach(cb => cb(summit));
    desync.DLD.onSummitTeleport(summit);
};

let lastPos = api.storage.getValue("lastPos", null);
let lastState = api.storage.getValue("lastState", null);
let gameLoaded = false;

const saveState = () => {
    if(!gameLoaded) return;
    const physics = api.stores.phaser.mainCharacter.physics;
    const rb = physics.getBody().rigidBody;

    lastPos = rb.translation();
    lastState = JSON.stringify(physics.state);

    // save to storage
    api.storage.setValue("lastPos", lastPos);
    api.storage.setValue("lastState", lastState);

    api.notification.open({ message: "State Saved", duration: 0.75 });
};

const loadState = () => {
    if(!gameLoaded) return;
    const physics = api.stores.phaser.mainCharacter.physics;
    const rb = physics.getBody().rigidBody;

    if(!lastPos || !lastState) return;

    desync.DLD.cancelRespawn();
    rb.setTranslation(lastPos, true);
    physics.state = JSON.parse(lastState);

    api.notification.open({ message: "State Loaded", duration: 0.75 });

    stateLoadCallbacks.forEach(cb => cb("custom"));
};

api.net.onLoad(() => {
    gameLoaded = true;

    // optional command line integration
    const commandLine = api.lib("CommandLine");
    if(commandLine) {
        commandLine.addCommand("summit", [
            { "number": ["0", "1", "2", "3", "4", "5", "6"] }
        ], (summit: string) => {
            tp(parseInt(summit, 10));
        });

        commandLine.addCommand("save", [], saveState);
        commandLine.addCommand("load", [], loadState);

        api.onStop(() => {
            commandLine.removeCommand("summit");
            commandLine.removeCommand("save");
            commandLine.removeCommand("load");
        });
    }
});

// saving
api.hotkeys.addConfigurableHotkey({
    category: "Savestates",
    title: "Save Current State",
    default: {
        key: "Comma",
        alt: true
    }
}, saveState);

// loading
api.hotkeys.addConfigurableHotkey({
    category: "Savestates",
    title: "Load Last State",
    default: {
        key: "Period",
        alt: true
    }
}, loadState);

// add hotkeys for summits
for(let i = 0; i <= 6; i++) {
    api.hotkeys.addConfigurableHotkey({
        category: "Savestates",
        title: `Teleport to Summit ${i}`,
        default: {
            key: `Digit${i}`,
            shift: true,
            alt: true
        }
    }, () => tp(i));
}

export function onStateLoaded(callback: StateLoadCallback) {
    stateLoadCallbacks.push(callback);
}

export function offStateLoaded(callback: StateLoadCallback) {
    stateLoadCallbacks = stateLoadCallbacks.filter(cb => cb !== callback);
}
