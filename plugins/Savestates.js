/**
 * @name Savestates
 * @description Allows you to save and load states/summits in Don't Look Down. Only client side, nobody else can see you move.
 * @author TheLazySquid
 * @version 0.3.7
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/Savestates.js
 * @webpage https://gimloader.github.io/plugins/savestates
 * @needsLib DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/libraries/DLDUtils.js
 * @optionalLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
 * @gamemode dontLookDown
 */

const DLDUtils = api.lib("DLDUtils");

const summitCoords = [{
    "x": 38.25554275512695,
    "y": 638.3899536132812
}, {
    "x": 90.22997283935547,
    "y": 638.377685546875
}, {
    "x": 285.44000244140625,
    "y": 532.780029296875
}, {
    "x": 217.5500030517578,
    "y": 500.7799987792969
}, {
    "x": 400.3399963378906,
    "y": 413.739990234375
}, {
    "x": 356.5400085449219,
    "y": 351.6600036621094
}, {
    "x": 401.2699890136719,
    "y": 285.739990234375
}];

const defaultState =  '{"gravity":0.001,"velocity":{"x":0,"y":0},"movement":{"direction":"none","xVelocity":0,"accelerationTicks":0},"jump":{"isJumping":false,"jumpsLeft":2,"jumpCounter":0,"jumpTicks":118,"xVelocityAtJumpStart":0},"forces":[],"grounded":true,"groundedTicks":0,"lastGroundedAngle":0}'

let stateLoadCallbacks = [];

const tp = (summit) => {
    let physics = api.stores.phaser.mainCharacter.physics;
    let rb = physics.getBody().rigidBody;

    DLDUtils.cancelRespawn();
    
    rb.setTranslation(summitCoords[summit], true);
    physics.state = JSON.parse(defaultState);

    stateLoadCallbacks.forEach(cb => cb(summit));
}

let lastPos = api.storage.getValue("lastPos", null);
let lastState = api.storage.getValue("lastState", null);

let gameLoaded = false;

const saveState = () => {
    if(!gameLoaded) return;
    let physics = api.stores.phaser.mainCharacter.physics;
    let rb = physics.getBody().rigidBody;

    lastPos = rb.translation();
    lastState = JSON.stringify(physics.state);

    // save to storage
    api.storage.setValue("lastPos", lastPos);
    api.storage.setValue("lastState", lastState);

    api.notification.open({ message: "State Saved", duration: 0.75 });
}

const loadState = () => {
    if(!gameLoaded) return;
    let physics = api.stores.phaser.mainCharacter.physics;
    let rb = physics.getBody().rigidBody;

    if(!lastPos || !lastState) return;

    api.lib("DLDUtils").cancelRespawn();
    rb.setTranslation(lastPos, true);
    physics.state = JSON.parse(lastState);

    api.notification.open({ message: "State Loaded", duration: 0.75 })

    stateLoadCallbacks.forEach(cb => cb("custom"));
}

api.net.onLoad(() => { 
    gameLoaded = true;   
    // add hotkeys for summits
    for(let i = 0; i <= 6; i++) {        
        api.hotkeys.addHotkey({
            key: `Digit${i}`,
            shift: true,
            alt: true
        }, () => tp(i));
    }

    // optional command line integration
    let commandLine = api.lib("CommandLine");
    if(commandLine) {
        commandLine.addCommand("summit", [
            {"number": ["0", "1", "2", "3", "4", "5", "6"]}
        ], (summit) => {
            tp(parseInt(summit));
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

export function onStateLoaded(callback) {
    stateLoadCallbacks.push(callback);
}

export function offStateLoaded(callback) {
    stateLoadCallbacks = stateLoadCallbacks.filter(cb => cb !== callback);
}