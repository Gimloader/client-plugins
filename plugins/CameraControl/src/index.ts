import { toggleFreecam, updateFreecam } from "./freecam";
import { setZoom, toggleZoom, updateZoom } from "./zoom";

export { isFreecamming, startFreecam, stopFreecam, toggleFreecam, moveFreecam } from "./freecam";

api.net.onLoad(() => {
    const worldManager = api.stores.phaser.scene.worldManager;

    // Update the camera after every frame
    api.patcher.after(worldManager, "update", (_, args) => {
        updateFreecam(args[0]);
        updateZoom(args[0]);
    });
});

api.hotkeys.addConfigurableHotkey({
    category: "Camera Control",
    title: "Enable Freecam",
    preventDefault: false,
    default: {
        key: "KeyF",
        shift: true
    }
}, toggleFreecam);

api.hotkeys.addConfigurableHotkey({
    category: "Camera Control",
    title: "Quick Zoom Toggle",
    preventDefault: false
}, toggleZoom);

api.net.onLoad(() => {
    // Add a command to the command palette
    api.commands.addCommand({
        text: "CameraControl: Set Zoom",
        keywords: ["camera", "zoom"]
    }, async (context) => {
        const zoom = await context.number({ title: "Zoom" });
        setZoom(zoom);
    });

    // optional command line integration
    const commandLine = api.lib("CommandLine");
    if(!commandLine) return;

    commandLine.addCommand("setzoom", [
        { "amount": "number" }
    ], (zoom: string) => {
        setZoom(parseFloat(zoom));
    });

    api.onStop(() => commandLine.removeCommand("setzoom"));
});
