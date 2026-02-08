/**
 * @name CameraControl
 * @description Lets you freely move and zoom your camera
 * @author TheLazySquid
 * @version 0.7.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/CameraControl.js
 * @optionalLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
 * @hasSettings true
 * @gamemode 2d
 * @changelog Fixed freecam resetting when going into area with restricted camera bounds
 */

// plugins/CameraControl/src/index.ts
var settings = api.settings.create([
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
var freecamming = false;
var freecamPos = { x: 0, y: 0 };
var scrollMomentum = 0;
var changedZoom = false;
var stopDefaultArrows = false;
var stopKeys = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"];
for (const key of stopKeys) {
  api.hotkeys.addHotkey({
    key,
    preventDefault: false
  }, (e) => {
    if (stopDefaultArrows) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}
var updateFreecam = null;
var updateScroll = (dt) => {
  const camera2 = api.stores.phaser.scene.cameras?.cameras?.[0];
  if (!camera2) return;
  scrollMomentum *= 0.97 ** dt;
  camera2.zoom += scrollMomentum * dt;
  if (scrollMomentum > 0) changedZoom = true;
  if (settings.capZoomOut) {
    if (camera2.zoom <= 0.1) {
      scrollMomentum = 0;
    }
    camera2.zoom = Math.max(0.1, camera2.zoom);
  }
};
api.net.onLoad(() => {
  const worldManager = api.stores.phaser.scene.worldManager;
  api.patcher.after(worldManager, "update", (_, args) => {
    updateFreecam?.(args[0]);
    updateScroll(args[0]);
  });
});
var scene;
var camera;
var getCanvasZoom = () => {
  const transform = api.stores.phaser.scene.game.canvas.style.transform;
  if (!transform) return 1;
  return parseFloat(transform.split("(")[1].replace(")", ""));
};
var isPointerDown = false;
var setPointerDown = (e) => {
  if (!(e.target instanceof HTMLElement)) return;
  if (e.target.nodeName !== "CANVAS") return;
  isPointerDown = true;
};
var setPointerUp = () => isPointerDown = false;
window.addEventListener("pointerdown", setPointerDown);
window.addEventListener("pointerup", setPointerUp);
var lastX;
var lastY;
function onPointermove(e) {
  const canvasZoom = getCanvasZoom();
  if (isPointerDown && lastX && lastY) {
    freecamPos.x -= (e.clientX / canvasZoom - lastX) / camera.zoom;
    freecamPos.y -= (e.clientY / canvasZoom - lastY) / camera.zoom;
  }
  lastX = e.clientX / canvasZoom;
  lastY = e.clientY / canvasZoom;
}
function onWheel(e) {
  if (!(e.target instanceof HTMLElement)) return;
  if (e.target.nodeName !== "CANVAS") return;
  if (!freecamming || !settings.mouseControls) {
    if (settings.shiftToZoom && !api.hotkeys.pressed.has("ShiftLeft")) return;
    scrollMomentum -= e.deltaY / 65e3;
    return;
  }
  if (camera.zoom === 0.1 && e.deltaY > 0 && settings.capZoomOut) return;
  const oldzoom = camera.zoom;
  const newzoom = oldzoom * (e.deltaY < 0 ? 1.1 : 0.9);
  const canvasZoom = getCanvasZoom();
  const mouse_x = e.clientX / canvasZoom;
  const mouse_y = e.clientY / canvasZoom;
  const pixels_difference_w = camera.width / oldzoom - camera.width / newzoom;
  const side_ratio_x = (mouse_x - camera.width / 2) / camera.width;
  freecamPos.x += pixels_difference_w * side_ratio_x;
  const pixels_difference_h = camera.height / oldzoom - camera.height / newzoom;
  const side_ratio_h = (mouse_y - camera.height / 2) / camera.height;
  freecamPos.y += pixels_difference_h * side_ratio_h;
  camera.setZoom(newzoom);
  changedZoom = true;
}
api.net.onLoad(() => {
  scene = api.stores?.phaser?.scene;
  camera = scene?.cameras?.cameras?.[0];
  if (!scene) return;
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
var lastInteractiveSlot = 0;
function stopFreecamming() {
  if (!scene || !camera) return;
  api.stores.me.inventory.activeInteractiveSlot = lastInteractiveSlot;
  GL.patcher.unpatchAll("CameraControl-helper");
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
  if (!scene || !camera) return;
  if (freecamming) {
    stopFreecamming();
  } else {
    lastInteractiveSlot = api.stores.me.inventory.activeInteractiveSlot;
    api.stores.me.inventory.activeInteractiveSlot = 0;
    scene.cameraHelper.stopFollow();
    camera.useBounds = false;
    freecamPos = { x: camera.midPoint.x, y: camera.midPoint.y };
    stopDefaultArrows = true;
    GL.patcher.instead("CameraControl-helper", scene.cameraHelper, "setCameraSizeParams", () => {
    });
    updateFreecam = (dt) => {
      let moveAmount = 0.8 / camera.zoom * dt;
      const pressed = api.hotkeys.pressed;
      if (pressed.has("ControlLeft")) moveAmount *= 5;
      if (pressed.has("ArrowLeft")) freecamPos.x -= moveAmount;
      if (pressed.has("ArrowRight")) freecamPos.x += moveAmount;
      if (pressed.has("ArrowUp")) freecamPos.y -= moveAmount;
      if (pressed.has("ArrowDown")) freecamPos.y += moveAmount;
      scene.cameraHelper.goTo(freecamPos);
    };
    window.addEventListener("pointermove", onPointermove);
  }
  freecamming = !freecamming;
});
var commandLine = api.lib("CommandLine");
if (commandLine) {
  commandLine.addCommand("setzoom", [
    { "amount": "number" }
  ], (zoom) => {
    const scene2 = api.stores?.phaser?.scene;
    const camera2 = scene2?.cameras?.cameras?.[0];
    if (!scene2 || !camera2) return;
    camera2.zoom = parseFloat(zoom);
  });
}
var zoomToggled = false;
var initialZoom = 1;
var onDown = () => {
  if (!settings.toggleZoomFactor) return;
  const scene2 = api.stores?.phaser?.scene;
  const camera2 = scene2?.cameras?.cameras?.[0];
  if (!scene2 || !camera2) return;
  if (zoomToggled) {
    camera2.zoom = initialZoom;
  } else {
    initialZoom = camera2.zoom;
    camera2.zoom /= settings.toggleZoomFactor;
  }
  zoomToggled = !zoomToggled;
};
api.hotkeys.addConfigurableHotkey({
  category: "Camera Control",
  title: "Quick Zoom Toggle",
  preventDefault: false
}, onDown);
api.onStop(() => {
  if (commandLine) {
    commandLine.removeCommand("setzoom");
  }
  window.removeEventListener("wheel", onWheel);
  window.removeEventListener("mousedown", setPointerDown);
  window.removeEventListener("mouseup", setPointerUp);
  const cam = api.stores?.phaser.scene.cameras.main;
  if (cam) cam.zoom = 1;
  if (freecamming) {
    stopFreecamming();
  }
});
