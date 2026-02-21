api.net.onLoad(() => {
    const rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;

    const onClick = (e: MouseEvent) => {
        if(!e.ctrlKey) return;
        const pos = api.stores.phaser.scene.inputManager.getMouseWorldXY();

        rb.setTranslation({ x: pos.x / 100, y: pos.y / 100 }, true);
    };

    window.addEventListener("click", onClick);
    api.onStop(() => window.removeEventListener("click", onClick));

    const otherPlayers = () =>
        [...api.stores.characters.characters.values()]
            .filter(char => char.type === "player" && char.id !== api.stores.network.authId);

    api.commands.addCommand({
        text: "Teleport: Teleport to Player",
        hidden: () => otherPlayers().length === 0
    }, async (context) => {
        const player = await context.select({
            title: "Player",
            options: otherPlayers().map(player => ({
                label: player.name,
                value: player.id
            }))
        });

        const pos = api.stores.phaser.scene.characterManager.characters.get(player)?.body;
        if(!pos) return;
        rb.setTranslation({ x: pos.x / 100, y: pos.y / 100 }, true);
    });
});
