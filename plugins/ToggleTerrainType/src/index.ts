api.hotkeys.addConfigurableHotkey({
    category: "ToggleTerrainType",
    title: "Switch between placing walls/floors",
    default: {
        key: "KeyT",
        alt: true
    }
}, () => {
    const terrain = GL.stores?.me?.adding?.terrain;
    if(!terrain) return;

    terrain.buildTerrainAsWall = !terrain.buildTerrainAsWall;

    api.notification.open({
        message: `Placing terrain as a ${terrain.buildTerrainAsWall ? "wall" : "floor"}`
    });
});
