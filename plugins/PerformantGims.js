/**
 * @name PerformantGims
 * @description Replaces configurable gims with images of them. Looks like crap, runs really fast.
 * @author TheLazySquid
 * @version 0.3.2
 * @reloadRequired ingame
 * @downloadUrl https://raw.githubusercontent.com/TheLazySquid/Gimloader/main/plugins/PerformantGims.js
 * @webpage https://thelazysquid.github.io/Gimloader/plugins/performantgims
 * @needsLib QuickSettings | https://raw.githubusercontent.com/TheLazySquid/Gimloader/refs/heads/main/libraries/QuickSettings/build/QuickSettings.js
 * @hasSettings true
 */

const api = new GL();

let settings = api.lib("QuickSettings")("PerformantGims", [
    {
        type: "heading",
        text: "Performant Gims Settings"
    },
    {
        type: "dropdown",
        title: "Apply To (Reload to see changes)",
        id: "applyTo",
        options: ["Everything", "Sentries", "Others"],
        default: "Others"
    }
]);

api.openSettingsMenu(settings.openSettingsMenu);

function shouldApply(character) {
    if(settings.applyTo === "Everything") return true;
    else if(settings.applyTo === "Sentries") return character.type === "sentry";

    return character.id !== api.stores.network.authId;
}

api.parcel.getLazy(exports => exports?.default?.toString?.().includes('this,"applyEditStyles"'), exports => {
    let normalSkin = exports.default;

    delete exports.default;
    exports.default = class {
        skinId = "character_default_cyan"
        latestSkinId = "character_default_cyan"

        constructor(props) {
            if(!props.character || !shouldApply(props.character)) {
                return new normalSkin(props);
            }
            this.character = props.character;
            this.scene = props.scene;
        }
        updateSkin(A) {
            A.id = A.id.replace("character_", "");
            let load = this.scene.load.image(`gim-${A.id}`, `https://www.gimkit.com/assets/map/characters/spine/preview/${A.id}.png`);
            load.on("complete", () => {
                this.setupSkin({
                    id: A.id
                });
            })
            load.start();
        }
        setupSkin(A) {
            let x = A.x ?? this.character.spine.x;
            let y = A.y ?? this.character.spine.y;

            if(this.character.spine) this.character.spine.destroy(true);
            this.character.scale.baseScale = 0.7
            this.character.spine = this.scene.add.sprite(x, y, `gim-${A.id}`);
            this.character.spine.setOrigin(0.5, 0.75);
            this.character.spine.skeleton = {color: {}, physicsTranslate: () => {}};
            let scale = this.character.scale;
            this.character.spine.setScale(scale.scaleX, scale.scaleY);

            this.character.characterTrail.followCharacter();
        }
        applyEditStyles() {}
    }

    api.onStop(() => exports.default = normalSkin);
});

api.parcel.getLazy(exports => exports?.ANIMATION_TRACKS?.BODY, exports => {
    let normalAnimation = exports.default;

    delete exports.default;
    exports.default = class {
        constructor(props) {
            if(!shouldApply(props.character)) {
                return new normalAnimation(props);
            }
        }
        destroy() {}
        update() {}
        onSkinChanged() {}
    }

    api.onStop(() => exports.default = normalAnimation);
});