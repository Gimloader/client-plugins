api.settings.create([
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

let freecamming = false;
let freecamPos = { x: 0, y: 0 };
let scrollMomentum = 0;
let changedZoom = false;

let stopDefaultArrows = false;
const stopKeys = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"];
for(const key of stopKeys) {
    api.hotkeys.addHotkey({
        key,
        preventDefault: false
    }, (e) => {
        if(stopDefaultArrows) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    });
}

let updateFreecam: ((dt: number) => void) | null = null;
const updateScroll = (dt: number) => {
    const camera = api.stores.phaser.scene.cameras?.cameras?.[0];
    if(!camera) return;

    scrollMomentum *= .97 ** dt;
    camera.zoom += scrollMomentum * dt;
    if(scrollMomentum > 0) changedZoom = true;

    if(api.settings.capZoomOut) {
        if(camera.zoom <= 0.1) {
            scrollMomentum = 0;
        }

        camera.zoom = Math.max(0.1, camera.zoom);
    }
};

api.net.onLoad(() => {
    const worldManager = api.stores.phaser.scene.worldManager;

    // whenever a frame passes
    api.patcher.after(worldManager, "update", (_, args) => {
        updateFreecam?.(args[0]);
        updateScroll(args[0]);
    });
});

let scene: Gimloader.Stores.Scene, camera: Phaser.Cameras.Scene2D.Camera;

const getCanvasZoom = () => {
    const transform = api.stores.phaser.scene.game.canvas.style.transform;
    if(!transform) return 1;
    return parseFloat(transform.split("(")[1].replace(")", ""));
};

let isPointerDown = false;
const setPointerDown = (e: MouseEvent) => {
    if(!(e.target instanceof HTMLElement)) return;
    if(e.target.nodeName !== "CANVAS") return;
    isPointerDown = true;
};
const setPointerUp = () => isPointerDown = false;
window.addEventListener("pointerdown", setPointerDown);
window.addEventListener("pointerup", setPointerUp);

let lastX: number, lastY: number;
function onPointermove(e: PointerEvent) {
    const canvasZoom = getCanvasZoom();

    if(isPointerDown && lastX && lastY) {
        freecamPos.x -= ((e.clientX / canvasZoom) - lastX) / camera.zoom;
        freecamPos.y -= ((e.clientY / canvasZoom) - lastY) / camera.zoom;
    }

    lastX = e.clientX / canvasZoom;
    lastY = e.clientY / canvasZoom;
}

function onWheel(e: WheelEvent) {
    if(!(e.target instanceof HTMLElement)) return;
    if(e.target.nodeName !== "CANVAS") return;

    if(!freecamming || !api.settings.mouseControls) {
        if(api.settings.shiftToZoom && !api.hotkeys.pressed.has("ShiftLeft")) return;
        scrollMomentum -= e.deltaY / 65000;
        return;
    }

    if(camera.zoom === 0.1 && e.deltaY > 0 && api.settings.capZoomOut) return;

    const oldzoom = camera.zoom;
    const newzoom = oldzoom * (e.deltaY < 0 ? 1.1 : 0.9);

    const canvasZoom = getCanvasZoom();
    const mouse_x = e.clientX / canvasZoom;
    const mouse_y = e.clientY / canvasZoom;

    const pixels_difference_w = (camera.width / oldzoom) - (camera.width / newzoom);
    const side_ratio_x = (mouse_x - (camera.width / 2)) / camera.width;
    freecamPos.x += pixels_difference_w * side_ratio_x;

    const pixels_difference_h = (camera.height / oldzoom) - (camera.height / newzoom);
    const side_ratio_h = (mouse_y - (camera.height / 2)) / camera.height;
    freecamPos.y += pixels_difference_h * side_ratio_h;

    camera.setZoom(newzoom);
    changedZoom = true;
}

api.net.onLoad(() => {
    scene = api.stores?.phaser?.scene;
    camera = scene?.cameras?.cameras?.[0];
    if(!scene) return;

    // disable the camera zoom being reset when changing the screen size
    api.patcher.before(api.stores.phaser.scene.cameraHelper, "resize", () => {
        return changedZoom;
    });

    window.addEventListener("wheel", onWheel);

    api.commands.addCommand({
        text: "CameraControl: Set Zoom",
        keywords: ["camera", "zoom"]
    }, async (context) => {
        camera.zoom = await context.number({ title: "Zoom" });
    });
});

let lastInteractiveSlot = 0;
function stopFreecamming() {
    if(!scene || !camera) return;
    api.stores.me.inventory.activeInteractiveSlot = lastInteractiveSlot;

    camera.useBounds = true;
    const charObj = api.stores.phaser.mainCharacter.body;

    scene.cameraHelper.startFollowingObject({ object: charObj });
    updateFreecam = null;
    stopDefaultArrows = false;

    window.removeEventListener("pointermove", onPointermove);
}

api.hotkeys.addConfigurableHotkey({
    category: "Camera Control",
    title: "Enable Freecam",
    preventDefault: false,
    default: {
        key: "KeyF",
        shift: true
    }
}, () => {
    if(!scene || !camera) return;

    if(freecamming) {
        // stop freecamming
        stopFreecamming();
    } else {
        // start freecamming
        lastInteractiveSlot = api.stores.me.inventory.activeInteractiveSlot;
        api.stores.me.inventory.activeInteractiveSlot = 0;
        scene.cameraHelper.stopFollow();
        camera.useBounds = false;
        freecamPos = { x: camera.midPoint.x, y: camera.midPoint.y };
        stopDefaultArrows = true;

        // move the camera
        updateFreecam = (dt) => {
            let moveAmount = 0.8 / camera.zoom * dt;
            const pressed = api.hotkeys.pressed;
            if(pressed.has("ControlLeft")) moveAmount *= 5;

            if(pressed.has("ArrowLeft")) freecamPos.x -= moveAmount;
            if(pressed.has("ArrowRight")) freecamPos.x += moveAmount;
            if(pressed.has("ArrowUp")) freecamPos.y -= moveAmount;
            if(pressed.has("ArrowDown")) freecamPos.y += moveAmount;

            scene.cameraHelper.goTo(freecamPos);
        };

        window.addEventListener("pointermove", onPointermove);
    }

    freecamming = !freecamming;
});

// optional command line integration
const commandLine = api.lib("CommandLine");
if(commandLine) {
    commandLine.addCommand("setzoom", [
        { "amount": "number" }
    ], (zoom: string) => {
        const scene = api.stores?.phaser?.scene;
        const camera = scene?.cameras?.cameras?.[0];
        if(!scene || !camera) return;

        camera.zoom = parseFloat(zoom);
    });
}

let zoomToggled = false;
let initialZoom = 1;
const onDown = () => {
    if(!api.settings.toggleZoomFactor) return;

    const scene = api.stores?.phaser?.scene;
    const camera = scene?.cameras?.cameras?.[0];
    if(!scene || !camera) return;

    if(zoomToggled) {
        camera.zoom = initialZoom;
    } else {
        initialZoom = camera.zoom;
        camera.zoom /= api.settings.toggleZoomFactor;
    }

    zoomToggled = !zoomToggled;
};

api.hotkeys.addConfigurableHotkey({
    category: "Camera Control",
    title: "Quick Zoom Toggle",
    preventDefault: false
}, onDown);

api.onStop(() => {
    if(commandLine) {
        commandLine.removeCommand("setzoom");
    }

    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("mousedown", setPointerDown);
    window.removeEventListener("mouseup", setPointerUp);

    const cam = api.stores?.phaser.scene.cameras.main;
    if(cam) cam.zoom = 1;

    // stop freecamming
    if(freecamming) {
        stopFreecamming();
    }
});
