export const settings = api.settings.create([
    {
        type: "toggle",
        id: "shiftToZoom",
        title: "Hold Shift to Zoom",
        description: "Whether to only allow zooming with the scroll wheel when holding shift",
        default: true
    },
    {
        type: "toggle",
        id: "mouseControls",
        title: "Use mouse controls while freecamming",
        description: "Click and drag on the screen to move the camera while freecamming",
        default: true
    },
    {
        type: "number",
        id: "toggleZoomFactor",
        title: "Toggle Zoom Factor",
        description: "The factor to zoom in/out by when pressing the quick zoom toggle hotkey",
        min: 0.05,
        max: 20,
        default: 2
    },
    {
        type: "toggle",
        id: "capZoomOut",
        title: "Cap Zoom Out",
        description: "Prevents zooming out too far (below 0.1x zoom) to avoid lag and crashes",
        default: true
    }
]);
