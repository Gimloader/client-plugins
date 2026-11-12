import type { Category } from "./types";
import { readFile } from "$shared/files";
import { decompress } from "compress-json";
import StylePicker from "./ui/StylePicker.svelte";
import { mount } from "svelte";
import { updateMainSkin, updateMainTrail } from "./characterManager";

export interface CustomSkin {
    type: "custom";
    name: string;
}

export interface OfficialSkin {
    type: "official";
    id: string;
    editStyles?: Record<string, string>;
}

export type SkinChoice = CustomSkin | OfficialSkin | null;
export type TrailChoice = string | null;

export default new class CosmeticSelection {
    skin: SkinChoice = $state(api.storage.getValue("skin", null));
    pastSkins: Gimloader.Stores.SkinOptions[] = $state(api.storage.getValue("pastSkins", []));
    customSkins: string[] = $state([]);

    trail: TrailChoice = $state(api.storage.getValue("trail", null));
    pastTrails: string[] = $state(api.storage.getValue("pastTrails", []));

    constructor() {
        updateMainSkin(this.skin);
        updateMainTrail(this.trail);

        api.storage.idbKeys().then((names) => this.customSkins = names, api.logger.error);
    }

    savePastSkins() {
        api.storage.setValue("pastSkins", $state.snapshot(this.pastSkins));
    }

    savePastTrails() {
        api.storage.setValue("pastTrails", $state.snapshot(this.pastTrails));
    }

    async addOfficialSkin() {
        const id = await api.UI.prompt("Enter Gim ID", {
            text: "Enter the ID of the official gim you want to use. This can be found on the Gimkit Wiki.",
            placeholder: "Gim ID"
        });
        if(!id) return;

        // Just move it to the front of the list
        const index = this.pastSkins.findIndex(c => c.id === id);
        if(index !== -1) {
            const [options] = this.pastSkins.splice(index, 1);
            this.pastSkins.unshift(options);
            this.savePastSkins();

            this.updateSkin({ type: "official", ...options });
            return;
        }

        // Get edit styles for the gim
        try {
            const data = await this.fetchSpineData(id);
            const categories = data.style?.categories;
            let editStyles: Record<string, string> | undefined;
            if(categories) {
                const styles = await this.showStylePicker(categories);
                if(!styles) return;

                editStyles = styles;
            }

            this.pastSkins.unshift({ id, editStyles });
            this.savePastSkins();
            this.updateSkin({ type: "official", id, editStyles });
        } catch {
            api.UI.toast.error(`Could not load gim with ID ${id}`);
        }
    }

    async addCustomSkin() {
        try {
            const file = await readFile(".png");
            const name = await api.UI.prompt("Name Custom Gim", {
                text: "Enter a name for the custom gim"
            });
            if(!name) return;

            api.storage.idbSet(name, file);
            this.customSkins.unshift(name);

            this.updateSkin({ type: "custom", name });
        } catch {}
    }

    async addTrail() {
        const id = await api.UI.prompt("Enter Trail ID", {
            text: "Enter the ID of the trail you want to use. This can be found on the Gimkit Wiki.",
            placeholder: "Trail ID"
        });
        if(!id) return;

        // Just move it to the front of the list
        const index = this.pastTrails.indexOf(id);
        if(index !== -1) {
            this.pastTrails.splice(index, 1);
            this.pastTrails.unshift(id);
            this.savePastTrails();

            this.updateTrail(id);
            return;
        }

        // Confirm that the trail actually exists
        const particlesUrl = `https://www.gimkit.com/assets/map/trails/${id}/particles.png`;
        try {
            const res = await fetch(particlesUrl);
            if(!res.ok) throw new Error("Response not OK");
            if(!res.headers.get("content-type")?.startsWith("image/")) throw new Error("Not an image");

            this.pastTrails.unshift(id);
            this.savePastTrails();
            this.updateTrail(id);
        } catch {
            api.UI.toast.error(`Could not load trail with ID ${id}`);
        }
    }

    showStylePicker(categories: Category[]) {
        return new Promise<Record<string, string> | null>((res) => {
            const div = document.createElement("div");
            const ui = mount(StylePicker, { target: div, props: { categories } });

            api.UI.showModal(div, {
                id: "StylePicker",
                title: "Select Gim Styles",
                closeOnBackgroundClick: false,
                buttons: [
                    {
                        text: "Cancel",
                        style: "close",
                        onClick: () => res(null)
                    },
                    {
                        text: "Apply",
                        style: "primary",
                        onClick: () => {
                            const selection = ui.getSelection();
                            res(selection);
                        }
                    }
                ]
            });
        });
    }

    async fetchSpineData(id: string) {
        const dataUrl = `https://www.gimkit.com/assets/map/characters/spine/${id}.json`;
        const res = await fetch(dataUrl);
        const json = await res.json();
        return decompress(json);
    }

    async updateEditStyles(id: string) {
        const options = this.pastSkins.find(c => c.id === id);
        if(!options) return;

        try {
            const data = await this.fetchSpineData(id);
            const categories = data.style?.categories;
            if(!categories) return;

            const editStyles = await this.showStylePicker(categories);
            if(!editStyles) return;

            options.editStyles = editStyles;
            this.savePastSkins();
            this.updateSkin({ type: "official", id, editStyles });
        } catch (e) {
            api.logger.error(`Failed to fetch spine data for ${id}`, e);
            api.UI.toast.error(`Failed to load styles for ${id}`);
        }
    }

    updateSkin(skin: SkinChoice) {
        this.skin = skin;
        updateMainSkin(this.skin);
        api.storage.setValue("skin", $state.snapshot(this.skin));
    }

    updateTrail(trail: TrailChoice) {
        this.trail = trail;
        updateMainTrail(this.trail);
        api.storage.setValue("trail", $state.snapshot(this.trail));
    }

    unselectSkin() {
        this.updateSkin(null);
    }

    selectOfficialSkin(id: string) {
        const options = this.pastSkins.find(c => c.id === id);
        if(!options) return;

        this.updateSkin({ type: "official", ...options });
    }

    selectCustomSkin(name: string) {
        this.updateSkin({ type: "custom", name });
    }

    unselectTrail() {
        this.updateTrail(null);
    }

    selectTrail(id: string) {
        this.updateTrail(id);
    }

    deleteOfficialGim(id: string) {
        const index = this.pastSkins.findIndex(c => c.id === id);
        if(index === -1) return;

        this.pastSkins.splice(index, 1);

        if(this.skin?.type === "official" && this.skin.id === id) this.unselectSkin();
        this.savePastSkins();
    }

    deleteCustomSkin(name: string) {
        const index = this.customSkins.indexOf(name);
        if(index === -1) return;

        this.customSkins.splice(index, 1);
        api.storage.idbDelete(name);

        if(this.skin?.type === "custom" && this.skin.name === name) this.unselectSkin();
    }

    deleteTrail(id: string) {
        const index = this.pastTrails.indexOf(id);
        if(index === -1) return;

        this.pastTrails.splice(index, 1);

        if(this.trail === id) this.unselectTrail();
        this.savePastTrails();
    }
}();
