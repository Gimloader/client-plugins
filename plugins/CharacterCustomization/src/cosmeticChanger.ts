import atlas from "../assets/gim_atlas.txt";
import json from "../assets/gim_json.txt";

interface Skin {
    id: string;
    editStyles: Record<string, string>;
}

export default new class CosmeticChanger {
    skinType: string = api.storage.getValue("skinType", "default");
    trailType: string = api.storage.getValue("trailType", "default");
    skinId: string = api.storage.getValue("skinId", "");
    trailId: string = api.storage.getValue("trailId", "");
    selectedStyles: Record<string, string> = api.storage.getValue("selectedStyles", {});

    normalSkin: Skin | null = null;
    allowNextSkin: boolean = false;

    normalTrail: string = "";
    allowNextTrail: boolean = false;
    customSkinFile: File | null = null;
    skinUrl: string | null = null;

    stopped = false;

    constructor() {
        this.initCustomSkinFile();

        api.net.onLoad(() => {
            this.loadCustomSkin();

            const mc = api.stores?.phaser?.mainCharacter;
            const skin = mc?.skin;
            const characterTrail = mc?.characterTrail;

            this.normalSkin = { id: skin.skinId, editStyles: Object.assign({}, skin.editStyles) };
            this.patchSkin(skin);

            this.normalTrail = characterTrail.currentAppearanceId;
            this.patchTrail(characterTrail);
        });

        api.onStop(() => this.reset());
    }

    get authId() {
        return api.stores?.network.authId;
    }

    loadCustomSkin() {
        if(!this.customSkinFile) return;

        const textureUrl = URL.createObjectURL(this.customSkinFile);
        this.skinUrl = textureUrl;

        const atlasLines = atlas.split("\n");
        atlasLines[0] = textureUrl.split("/").pop()!;
        const atlasBlob = new Blob([atlasLines.join("\n")], { type: "text/plain" });
        const atlasUrl = URL.createObjectURL(atlasBlob);

        const jsonBlob = new Blob([json], { type: "application/json" });
        const jsonUrl = URL.createObjectURL(jsonBlob);

        const fileTypes = Phaser.Loader.FileTypes;
        const imgFile = fileTypes.ImageFile;

        class newImgFile extends imgFile {
            constructor(loader: Phaser.Loader.LoaderPlugin, key: string, url: string, config: Phaser.Types.Loader.XHRSettingsObject) {
                if(url === "blob:https://www.gimkit.com/") {
                    url = textureUrl;
                    key = `customSkin-atlas!${textureUrl.split("/").pop()!}`;
                }
                super(loader, key, url, config);
            }
        }
        api.onStop(() => fileTypes.ImageFile = imgFile);

        fileTypes.ImageFile = newImgFile;

        const load: any = api.stores.phaser.scene.load;
        const jsonRes = load.spineJson("customSkin-data", jsonUrl);
        const atlasRes = load.spineAtlas("customSkin-atlas", atlasUrl);

        let running = 2;

        const onComplete = () => {
            running--;
            if(running > 0) return;

            URL.revokeObjectURL(textureUrl);
            URL.revokeObjectURL(atlasUrl);
            URL.revokeObjectURL(jsonUrl);

            const skin = api.stores.phaser.mainCharacter?.skin;
            if(skin && this.skinType === "custom") {
                this.allowNextSkin = true;
                skin.updateSkin({ id: "customSkin" });
            }
        };

        jsonRes.on("complete", onComplete);
        atlasRes.on("complete", onComplete);

        jsonRes.start();
        atlasRes.start();
    }

    async initCustomSkinFile() {
        const file = api.storage.getValue("customSkinFile");
        const fileName = api.storage.getValue("customSkinFileName");
        if(!file || !fileName) return;

        // stolen from some stackoverflow post
        const byteString = atob(file.substring(file.indexOf(",") + 1));
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for(let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        this.customSkinFile = new File([ab], fileName);
    }

    patchSkin(skin: any) {
        if(this.skinType === "id") {
            console.log({ id: this.skinId, editStyles: this.selectedStyles });
            skin.updateSkin({ id: this.skinId, editStyles: this.selectedStyles });
        }

        api.patcher.before(skin, "updateSkin", (_, args) => {
            if(this.allowNextSkin) {
                this.allowNextSkin = false;
            } else {
                this.normalSkin = args[0];

                // cancel the update if we're using a custom skin
                if(this.skinType !== "default") return true;
            }
        });
    }

    patchTrail(trail: any) {
        if(this.trailType === "id") {
            trail.updateAppearance(this.formatTrail(this.trailId));
        }

        api.patcher.before(trail, "updateAppearance", (_, args) => {
            if(this.allowNextTrail) {
                this.allowNextTrail = false;
            } else {
                this.normalTrail = args[0];

                // cancel the update if we're using a custom trail
                if(this.trailType === "id") return true;
            }
        });
    }

    async setSkin(skinType: string, skinId: string, customSkinFile: File | null, selectedStyles: Record<string, string>) {
        this.skinType = skinType;
        this.skinId = skinId;
        this.customSkinFile = customSkinFile;
        this.selectedStyles = selectedStyles;

        // save items to local storage
        api.storage.setValue("skinType", skinType);
        api.storage.setValue("skinId", skinId);
        api.storage.setValue("selectedStyles", selectedStyles);
        if(!customSkinFile) {
            api.storage.deleteValue("customSkinFile");
            api.storage.deleteValue("customSkinFileName");
        } else {
            const reader = new FileReader();
            reader.onload = () => {
                api.storage.setValue("customSkinFile", reader.result as string);
                api.storage.setValue("customSkinFileName", customSkinFile.name);
            };
            reader.readAsDataURL(customSkinFile);
        }

        // update the skin
        const skin = api.stores?.phaser?.mainCharacter?.skin;
        if(skin) {
            const cache = api.stores.phaser.scene.cache.custom["esotericsoftware.spine.atlas.cache"];
            // update the custom skin texture
            const entries = cache.entries.entries;
            const texture = entries["customSkin-atlas"]?.pages?.[0]?.texture;

            if(texture && this.customSkinFile) {
                const textureUrl = URL.createObjectURL(this.customSkinFile);
                this.skinUrl = textureUrl;

                texture._image.src = textureUrl;
                texture._image.addEventListener("load", () => {
                    texture.update();
                    URL.revokeObjectURL(textureUrl);
                }, { once: true });
            }

            this.allowNextSkin = true;
            if(skinType === "id") {
                skin.updateSkin({ id: "default_gray" });

                // I have no idea why I have to do this, but otherwise styles don't update
                setTimeout(() => {
                    this.allowNextSkin = true;
                    skin.updateSkin({ id: skinId, editStyles: this.selectedStyles });
                }, 0);
            } else if(skinType === "default") {
                skin.updateSkin(this.normalSkin!);
            } else {
                skin.updateSkin({ id: "customSkin" });
            }
        }
    }

    formatTrail(trail: string) {
        if(!trail.startsWith("trail_")) return `trail_${trail}`;
        return trail;
    }

    setTrail(trailType: string, trailId: string) {
        this.trailType = trailType;
        this.trailId = trailId;

        // save items to local storage
        api.storage.setValue("trailType", trailType);
        api.storage.setValue("trailId", trailId);

        const characterTrail = api.stores?.phaser?.mainCharacter?.characterTrail;
        if(characterTrail) {
            this.allowNextTrail = true;

            if(trailType === "id") {
                characterTrail.updateAppearance(this.formatTrail(trailId));
            } else {
                characterTrail.updateAppearance(this.normalTrail);
            }
        }
    }

    reset() {
        this.stopped = true;

        const characterTrail = api.stores?.phaser?.mainCharacter?.characterTrail;
        if(characterTrail) {
            characterTrail.updateAppearance(this.normalTrail);
            characterTrail.currentAppearanceId = this.normalTrail;
        }

        const skin = api.stores?.phaser?.mainCharacter?.skin;
        if(skin) {
            skin.updateSkin(this.normalSkin!);
        }

        if(this.skinUrl) {
            URL.revokeObjectURL(this.skinUrl);
        }
    }
}();
