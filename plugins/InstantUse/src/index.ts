api.hotkeys.addConfigurableHotkey({
    category: "InstantUse",
    title: "Use Device",
    default: {
        key: "Enter"
    },
    preventDefault: false
}, () => {
    if(api.stores?.session?.gameSession?.phase !== "game") return;
    const devices = api.stores?.phaser?.scene?.worldManager?.devices;
    const body = api.stores?.phaser?.mainCharacter?.body;
    if(!devices || !body) return;

    const device = devices.interactives.findClosestInteractiveDevice(devices.devicesInView, body.x, body.y);

    // trigger it
    device?.interactiveZones?.onInteraction?.();
});
