import type { SkinChoice, TrailChoice } from "./selection.svelte";
import CosmeticController from "./cosmeticController";

let mainSkin: SkinChoice = null;
let mainTrail: TrailChoice = null;
const controllers = new Map<string, CosmeticController>();

export function patchCharacters() {
    const characterManager = api.stores.phaser.scene.characterManager;

    api.patcher.after(characterManager, "addCharacter", (_, __, returnVal) => {
        const controller = new CosmeticController(returnVal);
        controllers.set(returnVal.id, controller);
    });

    api.patcher.after(characterManager, "removeCharacter", (_, args) => {
        const controller = controllers.get(args[0]);
        if(!controller) return;

        controller.destroy();
        controllers.delete(args[0]);
    });

    for(const character of characterManager.characters.values()) {
        if(character.isMain) {
            const controller = new CosmeticController(character, mainSkin, mainTrail);
            controllers.set(character.id, controller);
        } else {
            const controller = new CosmeticController(character);
            controllers.set(character.id, controller);
        }
    }

    api.onStop(() => {
        for(const controller of controllers.values()) {
            controller.destroy();
        }
    });
}

export function updateMainSkin(skin: SkinChoice) {
    mainSkin = skin;

    const authId = api.stores?.network?.authId;
    if(authId) updateSkin(authId, skin);
}

export function updateMainTrail(trail: TrailChoice) {
    mainTrail = trail;

    const authId = api.stores?.network?.authId;
    if(authId) updateTrail(authId, trail);
}

export function updateSkin(id: string, skin: SkinChoice) {
    controllers.get(id)?.setSkin(skin);
}

export function updateTrail(id: string, trail: string | null) {
    controllers.get(id)?.setTrail(trail);
}
