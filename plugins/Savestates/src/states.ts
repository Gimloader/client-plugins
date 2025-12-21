import type { Vector } from "@dimforge/rapier2d-compat";

const defaultName = "Main";

interface SavedState {
    name: string;
    pos: Vector;
    state: string;
}

export function upgradeFromLegacy() {
    const legacyLastPos: Vector = api.storage.getValue("lastPos");
    const legacyLastState: string = api.storage.getValue("lastState");
    if(legacyLastPos) {
        api.storage.deleteValue("lastPos");
        api.storage.deleteValue("lastState");
        api.storage.setValue("savedStates", [{
            name: defaultName,
            pos: legacyLastPos,
            state: legacyLastState
        }]);
        api.storage.setValue("selectedState", defaultName);
    }
}

export const storage = () => ({
    savedStates: api.storage.getValue("savedStates", []) as SavedState[],
    selectedState: api.storage.getValue("selectedState", null) as string | null
});

export function getSelectedState() {
    const { savedStates, selectedState } = storage();
    return savedStates.find(s => s.name === selectedState);
}

export function updateState(pos: Vector, state: string) {
    const { savedStates, selectedState } = storage();

    if(selectedState === null) {
        api.storage.setValue("savedStates", [{ name: defaultName, pos, state }]);
        api.storage.setValue("selectedState", defaultName);
        return defaultName;
    }

    const selected = savedStates.find(s => s.name === selectedState)!;
    selected.pos = pos;
    selected.state = state;
    api.storage.setValue("savedStates", savedStates);

    return selected.name;
}

export function setSelected(name: string) {
    api.storage.setValue("selectedState", name);
}

export function createState(name: string, pos: Vector, state: string) {
    const { savedStates } = storage();

    savedStates.push({ name, pos, state });
    api.storage.setValue("savedStates", savedStates);

    api.storage.setValue("selectedState", name);
}

export function deleteState(name: string) {
    const { savedStates } = storage();

    api.storage.setValue("savedStates", savedStates.filter(s => s.name !== name));
}

export function renameState(name: string, newName: string) {
    const { savedStates, selectedState } = storage();

    const state = savedStates.find(s => s.name === name)!;
    state.name = newName;

    api.storage.setValue("savedStates", savedStates);
    if(selectedState === name) {
        api.storage.setValue("selectedState", newName);
    }
}
