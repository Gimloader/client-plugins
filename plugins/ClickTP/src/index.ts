api.lib("Desync").enable();

api.net.onLoad(() => {
    const onClick = (e) => {
        if(!e.ctrlKey) return;
        const pos = api.stores.phaser.scene.inputManager.getMouseWorldXY();
        const rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
        rb.setTranslation({ x: pos.x / 100, y: pos.y / 100 }, true);
    };

    window.addEventListener("click", onClick);
    api.onStop(() => window.removeEventListener("click", onClick));
});
