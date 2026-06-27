import { freecamPos, isFreecamming } from "./freecam";
import { settings } from "./settings";
import { getCamera, isTargetCanvas } from "./util";

export function setZoom(zoom: number) {
    getCamera().zoom = zoom;
}

let scrollMomentum = 0;
function onWheel(e: WheelEvent) {
    if(!isTargetCanvas(e)) return;

    // If not freecamming with mouse controls just zoom out
    if(!isFreecamming || !settings.mouseControls) {
        if(settings.shiftToZoom && !api.hotkeys.pressed.has("ShiftLeft")) return;
        scrollMomentum -= e.deltaY / 65000;
        return;
    }

    // Zoom out and move the freecam position accordingly
    const camera = getCamera();
    if(camera.zoom === 0.1 && e.deltaY > 0 && settings.capZoomOut) return;

    const oldzoom = camera.zoom;
    const newzoom = oldzoom * (e.deltaY < 0 ? 1.1 : 0.9);

    const canvasZoom = api.stores.phaser.scene.resizeManager.usedDpi;
    const mouse_x = e.clientX * canvasZoom;
    const mouse_y = e.clientY * canvasZoom;

    const pixels_difference_w = (camera.width / oldzoom) - (camera.width / newzoom);
    const side_ratio_x = (mouse_x - (camera.width / 2)) / camera.width;
    freecamPos.x += pixels_difference_w * side_ratio_x;

    const pixels_difference_h = (camera.height / oldzoom) - (camera.height / newzoom);
    const side_ratio_h = (mouse_y - (camera.height / 2)) / camera.height;
    freecamPos.y += pixels_difference_h * side_ratio_h;

    camera.setZoom(newzoom);
}

export function updateZoom(dt: number) {
    const camera = getCamera();

    scrollMomentum *= .97 ** dt;
    camera.zoom += scrollMomentum * dt;

    // Clamp the camera zoom if the setting is enabled
    if(!settings.capZoomOut) return;

    if(camera.zoom <= 0.1) scrollMomentum = 0;
    camera.zoom = Math.max(0.1, camera.zoom);
}

let zoomToggled = false;
let preToggleZoom = 1;
export function toggleZoom() {
    if(!settings.toggleZoomFactor) return;

    const camera = getCamera();
    if(zoomToggled) {
        camera.zoom = preToggleZoom;
    } else {
        preToggleZoom = camera.zoom;
        camera.zoom /= settings.toggleZoomFactor;
    }

    zoomToggled = !zoomToggled;
}

let initialZoom = 1;
api.net.onLoad(() => {
    // Reset the camera zoom when the plugin is disabled
    const camera = getCamera();
    initialZoom = camera.zoom;

    api.onStop(() => camera.zoom = initialZoom);

    // disable the camera zoom being reset when changing the screen size
    api.patcher.before(api.stores.phaser.scene.cameraHelper, "resize", () => true);

    window.addEventListener("wheel", onWheel);
    api.onStop(() => window.removeEventListener("wheel", onWheel));
});
