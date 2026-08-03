api.net.onLoad(() => {
    const options = JSON.parse(api.stores.world.mapOptionsJSON);
    let visible = options.showHealthAndShield && options.healthMode === "healthAndShield";

    api.onStop(api.net.state.listen("mapSettings", (settingsJson) => {
        const options = JSON.parse(settingsJson);
        visible = options.showHealthAndShield && options.healthMode === "healthAndShield";
    }, false));

    const { scene } = api.stores.phaser;
    const width = 130;
    const blue = 0x6894ec;
    const red = 0xff0000;
    const gray = 0x555555;

    const addLabel = api.lib("CharacterLabels");
    const destroy = addLabel(character => {
        const stateChar = api.net.state.characters.get(character.id);
        if(!stateChar) return;

        const bg = scene.add.rectangle(0, 0, width, 10, gray);
        const health = scene.add.rectangle(0, 0, width, 10, red);
        const shield = scene.add.rectangle(0, 0, width, 10, blue);
        shield.setStrokeStyle(2, 0xffffff);

        return {
            gameObjects: [bg, health, shield],
            update() {
                const hp = stateChar.health;

                health.width = hp.health / hp.maxHealth * width;
                shield.width = hp.shield / hp.maxShield * width;
                bg.visible = health.visible = shield.visible = visible;
            }
        };
    });

    api.onStop(destroy);
});
