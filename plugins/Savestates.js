/**
 * @name Savestates
 * @description Allows you to save and load states/summits in Don't Look Down. Only client side, nobody else can see you move.
 * @author TheLazySquid
 * @version 0.2.2
 * @reloadRequired ingame
 * @downloadUrl https://raw.githubusercontent.com/TheLazySquid/Gimloader/main/plugins/Savestates.js
 * @needsLib DLDUtils | https://raw.githubusercontent.com/TheLazySquid/Gimloader/main/libraries/DLDUtils.js
 * @optionalLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
 */

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
}]

const defaultState =  '{"gravity":0.001,"velocity":{"x":0,"y":0},"movement":{"direction":"none","xVelocity":0,"accelerationTicks":0},"jump":{"isJumping":false,"jumpsLeft":2,"jumpCounter":0,"jumpTicks":118,"xVelocityAtJumpStart":0},"forces":[],"grounded":true,"groundedTicks":0,"lastGroundedAngle":0}'

let hotkeyEquivs = [')', '!', '@', '#', '$', '%', '^'];
let summitHotkeys = [];
for(let i = 0; i <= 6; i++) {
    // shift + alt + 0-6
    summitHotkeys.push(new Set(['shift', 'alt', hotkeyEquivs[i]]));
}

let saveStateHotkey = new Set(['alt', ',']);
let loadStateHotkey = new Set(['alt', '.']);

const tp = (summit) => {
    let physics = GL.stores.phaser.mainCharacter.physics;
    let rb = physics.getBody().rigidBody;

    GL.lib("DLDUtils").cancelRespawn();
    
    rb.setTranslation(summitCoords[summit], true);
    physics.state = JSON.parse(defaultState);
}

let lastPos, lastState;

const saveState = () => {
    let physics = GL.stores.phaser.mainCharacter.physics;
    let rb = physics.getBody().rigidBody;

    lastPos = rb.translation();
    lastState = JSON.stringify(physics.state);

    GL.notification.open({ message: "State Saved", duration: 0.75 })
}

const loadState = () => {
    let physics = GL.stores.phaser.mainCharacter.physics;
    let rb = physics.getBody().rigidBody;

    if(!lastPos || !lastState) return;

    GL.lib("DLDUtils").cancelRespawn();
    rb.setTranslation(lastPos, true);
    physics.state = JSON.parse(lastState);

    GL.notification.open({ message: "State Loaded", duration: 0.75 })
}

GL.addEventListener("loadEnd", () => {    
    // add hotkeys for summits
    for(let i = 0; i < summitHotkeys.length; i++) {
        let hotkey = summitHotkeys[i];
        
        GL.hotkeys.add(hotkey, () => tp(i));
    }

    // saving
    GL.hotkeys.add(saveStateHotkey, saveState)

    // loading
    GL.hotkeys.add(loadStateHotkey, loadState)

    // optional command line integration
    let commandLine = GL.lib("CommandLine");
    if(commandLine) {
        commandLine.addCommand("summit", [
            {"number": ["0", "1", "2", "3", "4", "5", "6"]}
        ], (summit) => {
            tp(parseInt(summit));
        })
        
        commandLine.addCommand("save", [], saveState);
        commandLine.addCommand("load", [], loadState);
    }
})

export function onStop() {
    for(let hotkey of summitHotkeys) {
        GL.hotkeys.remove(hotkey);
    }

    if(commandLine) {
        commandLine.removeCommand("summit");
        commandLine.removeCommand("save");
        commandLine.removeCommand("load");
    }

    GL.hotkeys.remove(saveStateHotkey, loadStateHotkey);
    GL.patcher.unpatchAll("Savestates");
    GL.parcel.stopIntercepts("Savestates");
}