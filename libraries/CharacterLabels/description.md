CharacterLabels allows plugins to easily add labels under the names of characters. Labels are made with one or more [Phaser game objects](https://docs.phaser.io/phaser/concepts/gameobjects/factories). The following is automatically handled by this library:
- Following each player's nametag
- Hiding when the character is respawning or is a spectator
- Removing when the character leaves
- Vertically layering different labels on top of each other based on their height
- Moving labels under the fragility tag if needed

### Usage:

```js
/**
 * @needsLib CharacterLabels | https://raw.githubusercontent.com/Gimloader/builds/main/libraries/CharacterLabels.js
 */

const addLabel = api.lib("CharacterLabels");
api.net.onLoad(() => {
    const destroy = addLabel((character) => {
        if (character.isMain) return;
        const text = api.stores.phaser.scene.add.text(0, 0, "", {
            fontSize: "normal 25px",
            fontFamily: "'Fugaz One', sans-serif",
            stroke: "#000000",
            strokeThickness: 5,
            align: "center",
        });

        return {
            gameObjects: [text],
            update() {
                const body = character.body;
                text.setText(`x: ${body.x}, y: ${body.y}`);
                // Small position tweaks
                text.x -= 100;
            }
        }
    })

    api.onStop(destroy);
})
```

