import { summitCoords } from "$shared/consts";
import { createState, deleteState, getSelectedState, renameState, setSelected, storage, updateState, upgradeFromLegacy } from "./states";

const desync = api.plugin("Desynchronize");

const defaultState =
    '{"gravity":0.001,"velocity":{"x":0,"y":0},"movement":{"direction":"none","xVelocity":0,"accelerationTicks":0},"jump":{"isJumping":false,"jumpsLeft":2,"jumpCounter":0,"jumpTicks":118,"xVelocityAtJumpStart":0},"forces":[],"grounded":true,"groundedTicks":0,"lastGroundedAngle":0}';

type StateLoadCallback = (summit: number | "custom") => void;
let stateLoadCallbacks: StateLoadCallback[] = [];

// Upgrade from v0.4.2
upgradeFromLegacy();

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

function getPhysics() {
    const { physics } = api.stores.phaser.mainCharacter;
    return { physics, rb: physics.getBody().rigidBody };
}

function getPhysicsState() {
    const { physics, rb } = getPhysics();
    return { pos: rb.translation(), state: JSON.stringify(physics.state) };
}

let gameLoaded = false;

const saveState = () => {
    if(!gameLoaded) return;

    const { pos, state } = getPhysicsState();

    const name = updateState(pos, state);
    api.UI.notification.open({ message: `State Saved to ${name}`, duration: 0.75 });
};

const loadState = () => {
    if(!gameLoaded) return;

    const selectedState = getSelectedState();
    if(!selectedState) {
        api.UI.notification.error({ message: "You don't have any states, create a state with Gimloader commands", duration: 2 });
        return;
    }

    const { rb, physics } = getPhysics();

    desync.DLD.cancelRespawn();
    rb.setTranslation(selectedState.pos, true);
    physics.state = JSON.parse(selectedState.state);

    api.UI.notification.open({ message: `State Loaded: ${selectedState.name}`, duration: 0.75 });

    stateLoadCallbacks.forEach(cb => cb("custom"));
};

async function getNewName(context: Gimloader.CommandContext, initial: string) {
    let name = await context.string({ title: initial });

    while(true) {
        const { savedStates } = storage();

        if(savedStates.every(s => s.name !== name)) break;
        name = await context.string({ title: `"${name}" is already taken!` });
    }

    return name;
}

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

    api.commands.addCommand({ text: "Savestates: Create State" }, async context => {
        const name = await getNewName(context, "Name");

        const { pos, state } = getPhysicsState();
        createState(name, pos, state);
        api.UI.notification.open({ message: `State Created and Selected: ${name}`, duration: 0.75 });
    });

    api.commands.addCommand({
        text() {
            const { selectedState } = storage();
            return `Savestates: Select State (Currently Selected: ${selectedState})`;
        },
        hidden() {
            const { savedStates } = storage();
            return savedStates.length < 2;
        }
    }, async context => {
        const { savedStates, selectedState } = storage();

        const selected = await context.select({
            title: `State (${selectedState} is currently selected)`,
            options: savedStates.map(({ name }) => ({ label: name, value: name }))
        });

        setSelected(selected);
        loadState();
        api.UI.notification.open({ message: `Switched to State: ${selected}` });
    });

    api.commands.addCommand({
        text: "Savestates: Delete State",
        hidden() {
            const { savedStates } = storage();
            return savedStates.length === 0;
        }
    }, async context => {
        const { savedStates, selectedState } = storage();

        const selected = await context.select({
            title: "State",
            options: savedStates
                .filter(state => state.name !== selectedState)
                .map(({ name }) => ({ label: name, value: name }))
        });

        deleteState(selected);
        api.UI.notification.open({ message: `Deleted State ${selected}` });
    });

    api.commands.addCommand({
        text: "Savestates: Rename State",
        hidden() {
            const { savedStates } = storage();
            return savedStates.length === 0;
        }
    }, async context => {
        const { savedStates, selectedState } = storage();

        const selected = await context.select({
            title: "State",
            options: savedStates.map(({ name }) => ({
                label: name === selectedState ? `${name} (selected state)` : name,
                value: name
            }))
        });

        const newName = await getNewName(context, "New Name");
        renameState(selected, newName);
    });

    api.commands.addCommand({
        text() {
            const { selectedState } = storage();
            return `Savestates: Save Selected State${selectedState && ` (${selectedState})`}`;
        }
    }, saveState);

    api.commands.addCommand({
        text() {
            const { selectedState } = storage();
            return `Savestates: Load Selected State${selectedState && ` (${selectedState})`}`;
        }
    }, loadState);
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
        title: `Savestates: Teleport to Summit ${i}`,
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
