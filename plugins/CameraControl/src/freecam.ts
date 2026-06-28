import { settings } from "./settings";
import { getCamera, isTargetCanvas } from "./util";

export let isFreecamming = false;
export let freecamPos = { x: 0, y: 0 };

export function updateFreecam(dt: number) {
    if(!isFreecamming) return;

    const scene = api.stores.phaser.scene;
    const camera = scene.cameras.cameras[0];

    // Calculate how much to move
    let moveAmount = 0.8 / camera.zoom * dt;
    const pressed = api.hotkeys.pressed;
    if(pressed.has("ControlLeft")) moveAmount *= 5;

    // Move based on which arrow keys are pressed
    if(pressed.has("ArrowLeft")) freecamPos.x -= moveAmount;
    if(pressed.has("ArrowRight")) freecamPos.x += moveAmount;
    if(pressed.has("ArrowUp")) freecamPos.y -= moveAmount;
    if(pressed.has("ArrowDown")) freecamPos.y += moveAmount;

    scene.cameraHelper.goTo(freecamPos);
}

let preFreecamInteractiveSlot = 0;
export function stopFreecam() {
    if(!isFreecamming) return;
    isFreecamming = false;

    api.stores.me.inventory.activeInteractiveSlot = preFreecamInteractiveSlot;
    GL.patcher.unpatchAll("CameraControl-helper");

    getCamera().useBounds = true;

    // Make the camera follow the player again
    const charObj = api.stores.phaser.mainCharacter.body;
    api.stores.phaser.scene.cameraHelper.startFollowingObject({ object: charObj });
}

export function startFreecam() {
    if(isFreecamming) return;
    isFreecamming = true;

    preFreecamInteractiveSlot = api.stores.me.inventory.activeInteractiveSlot;
    api.stores.me.inventory.activeInteractiveSlot = 0;

    const scene = api.stores.phaser.scene;
    const camera = scene.cameras.cameras[0];

    scene.cameraHelper.stopFollow();
    camera.useBounds = false;
    freecamPos = { x: camera.midPoint.x, y: camera.midPoint.y };

    // Ignore the game trying to mess with the camera while freecamming
    GL.patcher.instead("CameraControl-helper", scene.cameraHelper, "setCameraSizeParams", () => {});
    GL.patcher.instead("CameraControl-helper", scene.cameraHelper, "startFollowingObject", () => {});

    window.addEventListener("pointermove", onPointermove);
}

export function toggleFreecam() {
    if(isFreecamming) stopFreecam();
    else startFreecam();
}

export function moveFreecam(x: number, y: number) {
    freecamPos.x = x;
    freecamPos.y = y;
}

// Prevent the default behavior of the arrow keys when freecamming
const stopKeys = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"];
for(const key of stopKeys) {
    api.hotkeys.addHotkey({
        key,
        preventDefault: false
    }, (e) => {
        if(!isFreecamming) return;
        e.stopImmediatePropagation();
        e.preventDefault();
    });
}

let isPointerDown = false;
function onPointerDown(e: PointerEvent) {
    if(!isTargetCanvas(e)) return;
    isPointerDown = true;
}

function onPointerUp() {
    isPointerDown = false;
}

let lastMouseX: number, lastMouseY: number;
function onPointermove(e: PointerEvent) {
    const canvasZoom = api.stores.phaser.scene.resizeManager.usedDpi;

    if(isFreecamming && settings.mouseControls && isPointerDown && lastMouseX && lastMouseY) {
        const camera = getCamera();
        freecamPos.x -= ((e.clientX * canvasZoom) - lastMouseX) / camera.zoom;
        freecamPos.y -= ((e.clientY * canvasZoom) - lastMouseY) / camera.zoom;
    }

    lastMouseX = e.clientX * canvasZoom;
    lastMouseY = e.clientY * canvasZoom;
}

api.net.onLoad(() => {
    window.addEventListener("pointermove", onPointermove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    api.onStop(() => {
        window.removeEventListener("pointermove", onPointermove);
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", onPointerUp);

        if(isFreecamming) stopFreecam();
    });
});
