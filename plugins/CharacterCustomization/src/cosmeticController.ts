import type { SkinChoice, TrailChoice } from "./selection.svelte";
import { loadSkin } from "./skinLoader";

export default class CosmeticController {
    character: Gimloader.Stores.Character;
    defaultSkin: Gimloader.Stores.SkinOptions;
    defaultTrail: string;
    manuallyChangingCharacter = false;
    manuallyChangingTrail = false;
    skin: SkinChoice = null;
    trail: TrailChoice = null;

    unpatchSkin: () => void;
    unpatchTrail: () => void;

    constructor(character: Gimloader.Stores.Character, skin: SkinChoice = null, trail: TrailChoice = null) {
        this.character = character;
        this.skin = skin;
        this.trail = trail;

        this.defaultSkin = {
            id: character.skin.skinId,
            editStyles: character.skin.editStyles
        };
        this.defaultTrail = character.characterTrail.currentAppearanceId;

        this.unpatchSkin = api.patcher.before(this.character.skin, "updateSkin", (_, args) => {
            if(this.manuallyChangingCharacter) {
                this.manuallyChangingCharacter = false;
                return;
            }

            this.defaultSkin = args[0];
            if(this.character.isMain && this.skin) return true;
        });

        this.unpatchTrail = api.patcher.before(this.character.characterTrail, "updateAppearance", (_, args) => {
            if(this.manuallyChangingTrail) {
                this.manuallyChangingTrail = false;
                return;
            }

            this.defaultTrail = args[0];
            if(this.character.isMain && this.trail) return true;
        });

        if(this.skin) this.setSkin(this.skin);
        if(this.trail) this.setTrail(this.trail);
    }

    destroy() {
        this.unpatchSkin();
        this.unpatchTrail();

        this.setTrail(null);
        this.setSkin(null);
    }

    setSkin(skin: SkinChoice) {
        this.skin = skin;
        this.manuallyChangingCharacter = true;

        if(skin === null) {
            this.character.skin.updateSkin(this.defaultSkin);
        } else if(skin.type === "official") {
            this.character.skin.updateSkin({
                id: skin.id,
                editStyles: skin.editStyles
            });
        } else {
            loadSkin(skin.name).then(() => {
                this.character.skin.updateSkin({
                    id: `cc-${skin.name}`
                });
            });
        }
    }

    setTrail(trail: TrailChoice) {
        this.trail = trail;
        this.manuallyChangingTrail = true;

        if(trail === null) {
            this.character.characterTrail.updateAppearance(this.defaultTrail);
        } else {
            this.character.characterTrail.updateAppearance(`trail_${trail}`);
        }
    }
}
