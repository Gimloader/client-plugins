const padding = 10;
type LabelObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Depth & Phaser.GameObjects.Components.Visible;

export interface LabelInstance {
    gameObjects: LabelObject[];
    update?(): void;
}

export type SetupLabel = (character: Gimloader.Stores.Character) => LabelInstance | void;

let addLabelToGame: ((setupLabel: SetupLabel) => () => void) | null = null;

export default function addLabel(setupLabel: SetupLabel) {
    if(!addLabelToGame) throw new Error("Labels cannot be added before loading in");
    return addLabelToGame(setupLabel);
}

interface Label {
    heights: Map<Gimloader.Stores.Character, number>;
    setupLabel: SetupLabel;
    onStop: Set<() => void>;
}

api.net.onLoad(() => {
    const handleLabel = (character: Gimloader.Stores.Character, label: Label) => {
        const stateChar = api.net.state.characters.get(character.id);
        const labelInstance = label.setupLabel(character);
        if(!labelInstance) return;

        const getHeight = () => {
            let maxHeight = 0;
            for(const object of labelInstance.gameObjects) {
                if(("visible" in object && !object.visible) || !("height" in object)) continue;
                maxHeight = Math.max(maxHeight, object.height as number);
            }
            return maxHeight;
        };

        const getYOffset = () => {
            let offset = 22;
            if(character.nametag.fragilityTag) {
                offset += 15;
            }
            for(const characterLabel of labels.slice(0, labels.indexOf(label))) {
                const height = characterLabel.heights.get(character)!;
                if(height) offset += padding;
                offset += height;
            }
            return offset;
        };

        const unsub = api.patcher.after(character.nametag, "update", () => {
            if(!character.nametag.tag) return;
            for(const addedObject of labelInstance.gameObjects) {
                const { x, y, depth } = character.nametag.tag;
                addedObject.visible = true;
                addedObject.x = x;
                addedObject.y = y + getYOffset();
                addedObject.setDepth(depth);
            }

            labelInstance.update?.();
            if(stateChar?.isRespawning || stateChar?.teamId === "__SPECTATORS_TEAM") {
                for(const addedObject of labelInstance.gameObjects) {
                    addedObject.visible = false;
                }
            }
            const height = getHeight();
            label.heights.set(character, height);
        });

        const stopDestroy = api.patcher.after(character.nametag, "destroy", () => {
            destroy();
            label.onStop.delete(destroy);
        });

        const destroy = () => {
            unsub();
            for(const object of labelInstance.gameObjects) {
                object.destroy();
            }
            stopDestroy();
        };

        label.onStop.add(destroy);
    };

    const scene = api.stores.phaser.scene;

    const labels: Label[] = [];
    addLabelToGame = (setupLabel) => {
        const label: Label = {
            setupLabel,
            onStop: new Set(),
            heights: new Map()
        };
        labels.push(label);

        for(const character of api.stores.phaser.scene.characterManager.characters.values()) {
            handleLabel(character, label);
        }

        return () => {
            for(const cb of label.onStop) {
                cb();
            }

            const index = labels.indexOf(label);
            if(index === -1) return;
            labels.splice(index, 1);
        };
    };

    api.patcher.after(scene.characterManager, "addCharacter", (_, __, character) => {
        for(const label of labels) {
            handleLabel(character, label);
        }
    });
});
