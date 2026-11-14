import type Communication from "$libraries/Communication/src";
import type { SkinChoice } from "./selection.svelte";
import { disableNonMainCosmetics, mainSkin, mainTrail, updateSkin, updateTrail } from "./characterManager";

enum Op {
    Greet,
    ClearSkin,
    ClearTrail
}

let comms: Communication | null = null;

export function setSyncEnabled(enabled: boolean) {
    if(enabled) {
        setupSync();
    } else {
        comms?.destroy();
        comms = null;
        disableNonMainCosmetics();
    }
}

function setupSync() {
    const Communication = api.lib("Communication");
    comms = new Communication(api.headers.name);

    comms.onEnabledChanged((enabled, afterReady) => {
        if(!enabled) return;

        if(mainSkin?.type === "official") dispatchSkinChange(mainSkin);
        if(mainTrail) dispatchTrailChange(mainTrail);
        if(afterReady) comms?.send(Op.Greet);
    });

    comms.onMessage((message, character) => {
        if(typeof message !== "string") {
            if(message === Op.ClearSkin) updateSkin(character.id, null);
            else if(message === Op.ClearTrail) updateTrail(character.id, null);
            else if(message === Op.Greet) {
                if(mainSkin?.type === "official") dispatchSkinChange(mainSkin);
                if(mainTrail) dispatchTrailChange(mainTrail);
            }

            return;
        }

        if(message.startsWith("c")) {
            const content = message.substring(1);
            const parts = content.split("|");
            const skinId = parts.shift()!;
            const editStyles = Object.fromEntries(parts.map((p) => p.split(":")));

            updateSkin(character.id, {
                type: "official",
                id: skinId,
                editStyles
            });
        } else if(message.startsWith("t")) {
            const trail = message.substring(1);

            updateTrail(character.id, trail);
        }
    });
}

export function dispatchSkinChange(skin: SkinChoice) {
    if(skin === null) {
        comms?.send(Op.ClearSkin);
    } else if(skin.type === "official") {
        let message = `c${skin.id}`;
        if(skin.editStyles) {
            for(const key in skin.editStyles) {
                message += `|${key}:${skin.editStyles[key]}`;
            }
        }

        comms?.send(message);
    }
}

export function dispatchTrailChange(trail: string | null) {
    if(trail === null) comms?.send(Op.ClearTrail);
    else comms?.send(`t${trail}`);
}
