/**
 * @name DLDTAS
 * @description Allows you to create TASes for Dont Look Down
 * @author TheLazySquid
 * @version 0.5.3
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/DLDTAS.js
 * @webpage https://gimloader.github.io/plugins/DLDTAS
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Desynchronize.js
 * @gamemode dontLookDown
 * @changelog Updated webpage url
 */

// plugins/DLDTAS/src/styles.scss
var styles_default = `#startTasBtn {
  position: fixed;
  top: 0;
  left: 0;
  margin: 5px;
  padding: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  cursor: pointer;
  z-index: 101;
  border-radius: 5px;
  user-select: none;
}

#tasOverlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 49;
  pointer-events: none;
}

#inputTable {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 49;
  background-color: rgba(255, 255, 255, 0.5);
}
#inputTable .btns {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
}
#inputTable .btns button {
  height: 30px;
  width: 30px;
  text-align: center;
}
#inputTable table {
  table-layout: fixed;
  user-select: none;
}
#inputTable tr.active {
  background-color: rgba(0, 138, 197, 0.892) !important;
}
#inputTable tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.1);
}
#inputTable tr {
  height: 22px;
}
#inputTable td, #inputTable th {
  height: 22px;
  width: 75px;
  text-align: center;
}

#controlCountdown {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: 99999999999;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
  color: black;
}`;

// assets/controller.svg
var controller_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.97,16L5,19C4.67,19.3 4.23,19.5 3.75,19.5A1.75,1.75 0 0,1 2,17.75V17.5L3,10.12C3.21,7.81 5.14,6 7.5,6H16.5C18.86,6 20.79,7.81 21,10.12L22,17.5V17.75A1.75,1.75 0 0,1 20.25,19.5C19.77,19.5 19.33,19.3 19,19L16.03,16H7.97M7,8V10H5V11H7V13H8V11H10V10H8V8H7M16.5,8A0.75,0.75 0 0,0 15.75,8.75A0.75,0.75 0 0,0 16.5,9.5A0.75,0.75 0 0,0 17.25,8.75A0.75,0.75 0 0,0 16.5,8M14.75,9.75A0.75,0.75 0 0,0 14,10.5A0.75,0.75 0 0,0 14.75,11.25A0.75,0.75 0 0,0 15.5,10.5A0.75,0.75 0 0,0 14.75,9.75M18.25,9.75A0.75,0.75 0 0,0 17.5,10.5A0.75,0.75 0 0,0 18.25,11.25A0.75,0.75 0 0,0 19,10.5A0.75,0.75 0 0,0 18.25,9.75M16.5,11.5A0.75,0.75 0 0,0 15.75,12.25A0.75,0.75 0 0,0 16.5,13A0.75,0.75 0 0,0 17.25,12.25A0.75,0.75 0 0,0 16.5,11.5Z" /></svg>';

// plugins/DLDTAS/src/overlay.ts
var canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.id = "tasOverlay";
var ctx = canvas.getContext("2d");
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
api.onStop(() => canvas.remove());
var propHitboxes = [];
function initOverlay() {
  document.body.appendChild(canvas);
  const scene = api.stores.phaser.scene;
  const props = scene.worldManager.devices.allDevices.filter((d) => d.deviceOption?.id === "prop");
  for (const prop of props) {
    for (const collider of prop.colliders.list) {
      let { x, y, h, w, angle, r1, r2 } = collider.options;
      if (!x || !y) continue;
      x += prop.x;
      y += prop.y;
      if (r1 && r2) {
        if (r1 < 0 || r2 < 0) continue;
        const ellipse = scene.add.ellipse(x, y, r1 * 2, r2 * 2, 16711680).setDepth(99999999999).setStrokeStyle(3, 16711680);
        ellipse.angle = angle;
        ellipse.isFilled = false;
        ellipse.isStroked = true;
        propHitboxes.push(ellipse);
      } else if (w && h) {
        const rect = scene.add.rectangle(x, y, w, h, 16711680).setDepth(99999999999).setStrokeStyle(3, 16711680);
        rect.angle = angle;
        rect.isFilled = false;
        rect.isStroked = true;
        propHitboxes.push(rect);
      }
    }
  }
  api.onStop(() => {
    for (const prop of propHitboxes) {
      prop.destroy();
    }
  });
  setInterval(render, 1e3 / 15);
}
var renderHitbox = true;
function hideHitbox() {
  for (const prop of propHitboxes) {
    prop.visible = false;
  }
  renderHitbox = false;
}
function showHitbox() {
  for (const prop of propHitboxes) {
    prop.visible = true;
  }
  renderHitbox = true;
}
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const physics = api.stores.phaser.mainCharacter.physics;
  const collider = physics.getBody().collider;
  let { halfHeight, radius } = collider.shape;
  const { x: cX, y: cY } = api.stores.phaser.scene.cameras.cameras[0].midPoint;
  let { x, y } = physics.getBody().rigidBody.translation();
  const { x: vX, y: vY } = physics.getBody().rigidBody.linvel();
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.font = "20px Arial";
  ctx.textAlign = "right";
  const posText = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
  const velText = `vx: ${vX.toFixed(2)}, vy: ${vY.toFixed(2)}`;
  ctx.strokeText(posText, canvas.width - 10, canvas.height - 20);
  ctx.fillText(posText, canvas.width - 10, canvas.height - 20);
  ctx.strokeText(velText, canvas.width - 10, canvas.height - 40);
  ctx.fillText(velText, canvas.width - 10, canvas.height - 40);
  if (!renderHitbox) return;
  x = x * 100 - cX + window.innerWidth / 2;
  y = y * 100 - cY + window.innerHeight / 2;
  radius *= 100;
  halfHeight *= 100;
  ctx.strokeStyle = "#2fd45b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - halfHeight, radius, Math.PI, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + radius, y + halfHeight);
  ctx.lineTo(x + radius, y - halfHeight);
  ctx.moveTo(x - radius, y + halfHeight);
  ctx.lineTo(x - radius, y - halfHeight);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + halfHeight, radius, 0, Math.PI);
  ctx.stroke();
}

// plugins/DLDTAS/src/updateLasers.ts
var lasers = [];
var laserOffset = api.storage.getValue("laserOffset", 0);
api.net.on("DEVICES_STATES_CHANGES", (packet) => {
  for (let i = 0; i < packet.changes.length; i++) {
    const device = packet.changes[i];
    if (lasers.some((l) => l.id === device[0])) {
      packet.changes.splice(i, 1);
      i -= 1;
    }
  }
});
function initLasers(values2) {
  api.hotkeys.addHotkey({
    key: "KeyL",
    alt: true
  }, () => {
    api.hotkeys.releaseAll();
    const offset = prompt(`Enter the laser offset in frames, from 0 to 65 (currently ${laserOffset})`);
    if (offset === null) return;
    const parsed = parseInt(offset, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 65) {
      alert("Invalid offset");
      return;
    }
    setLaserOffset(parsed);
    updateLasers(values2.currentFrame);
  });
}
function getLaserOffset() {
  return laserOffset;
}
function setLaserOffset(offset) {
  laserOffset = offset;
  api.storage.getValue("laserOffset", offset);
}
function updateLasers(frame) {
  if (lasers.length === 0) {
    lasers = api.stores.phaser.scene.worldManager.devices.allDevices.filter((d) => d.laser);
  }
  const states = api.stores.world.devices.states;
  const devices = api.stores.phaser.scene.worldManager.devices;
  const active = (frame + laserOffset) % 66 < 36;
  if (!states.has(lasers[0].id)) {
    lasers = api.stores.phaser.scene.worldManager.devices.allDevices.filter((d) => d.laser);
  }
  for (const laser of lasers) {
    if (!states.has(laser.id)) {
      const propsMap = /* @__PURE__ */ new Map();
      propsMap.set("GLOBAL_active", active);
      states.set(laser.id, { deviceId: laser.id, properties: propsMap });
    } else {
      states.get(laser.id)?.properties.set("GLOBAL_active", active);
    }
    devices.getDeviceById(laser.id)?.onStateUpdateFromServer("GLOBAL_active", active);
  }
}

// plugins/DLDTAS/src/util.ts
var defaultState = '{"gravity":0.001,"velocity":{"x":0,"y":0},"movement":{"direction":"none","xVelocity":0,"accelerationTicks":0},"jump":{"isJumping":false,"jumpsLeft":2,"jumpCounter":0,"jumpTicks":118,"xVelocityAtJumpStart":0},"forces":[],"grounded":true,"groundedTicks":0,"lastGroundedAngle":0}';
function generatePhysicsInput(frame, lastFrame) {
  const jump = frame.up && !lastFrame?.up;
  let angle = null;
  if (!frame.right && !frame.left && !frame.up) angle = null;
  else if (frame.right && !frame.left && !frame.up) angle = 0;
  else if (!frame.right && frame.left && !frame.up) angle = 180;
  else if (!frame.right && !frame.left && frame.up) angle = 270;
  else if (frame.right && !frame.left && frame.up) angle = 315;
  else if (frame.right && frame.left && !frame.up) angle = null;
  else if (!frame.right && frame.left && frame.up) angle = 225;
  else if (frame.right && frame.left && frame.up) angle = 225;
  return { angle, jump, _jumpKeyPressed: frame.up };
}
var getTickKeys = (input) => ({
  left: input.angle === 180 || input.angle === 225,
  right: input.angle === 0 || input.angle === 315,
  up: input.jump
});
function save(frames2) {
  const saveList = [];
  for (const frame of frames2) {
    const { left, right, up } = frame;
    saveList.push({ left, right, up });
  }
  for (let i = saveList.length - 1; i >= 0; i--) {
    if (saveList[i].right || saveList[i].left || saveList[i].up) break;
    saveList.pop();
  }
  api.storage.setValue("frames", saveList);
  return saveList;
}

// plugins/DLDTAS/src/tools.ts
var TASTools = class {
  constructor(values2, updateTable) {
    this.values = values2;
    this.updateTable = updateTable;
    this.physicsManager.physicsStep = (dt) => {
      api.stores.phaser.mainCharacter.physics.postUpdate(dt);
    };
    api.onStop(() => this.physicsManager.physicsStep = this.nativeStep);
    api.onStop(() => this.inputManager.getPhysicsInput = this.getPhysicsInput);
    this.reset();
    initLasers(this.values);
  }
  physicsManager = api.stores.phaser.scene.worldManager.physics;
  nativeStep = this.physicsManager.physicsStep;
  physics = api.stores.phaser.mainCharacter.physics;
  rb = this.physics.getBody().rigidBody;
  inputManager = api.stores.phaser.scene.inputManager;
  getPhysicsInput = this.inputManager.getPhysicsInput;
  slowdownAmount = 1;
  slowdownDelayedFrames = 0;
  // hardcoded, for now
  startPos = { x: 33.87, y: 638.38 };
  startState = defaultState;
  reset() {
    this.rb.setTranslation(this.startPos, true);
    this.physics.state = JSON.parse(this.startState);
  }
  startPlaying() {
    const { frames: frames2 } = this.values;
    this.slowdownDelayedFrames = 0;
    this.physicsManager.physicsStep = (dt) => {
      this.slowdownDelayedFrames++;
      if (this.slowdownDelayedFrames < this.slowdownAmount) return;
      this.slowdownDelayedFrames = 0;
      updateLasers(this.values.currentFrame);
      const frame = frames2[this.values.currentFrame];
      if (frame) {
        const translation = this.rb.translation();
        frames2[this.values.currentFrame].translation = { x: translation.x, y: translation.y };
        frames2[this.values.currentFrame].state = JSON.stringify(this.physics.state);
        const input = generatePhysicsInput(frame, frames2[this.values.currentFrame - 1]);
        this.inputManager.getPhysicsInput = () => input;
      }
      this.setMoveSpeed();
      this.nativeStep(dt);
      this.values.currentFrame++;
      this.updateTable();
    };
  }
  stopPlaying() {
    this.physicsManager.physicsStep = (dt) => {
      api.stores.phaser.mainCharacter.physics.postUpdate(dt);
    };
  }
  startControlling() {
    this.slowdownDelayedFrames = 0;
    this.inputManager.getPhysicsInput = this.getPhysicsInput;
    this.physicsManager.physicsStep = (dt) => {
      this.slowdownDelayedFrames++;
      if (this.slowdownDelayedFrames < this.slowdownAmount) return;
      this.slowdownDelayedFrames = 0;
      const keys = this.inputManager.keyboard.heldKeys;
      const { KeyCodes } = Phaser.Input.Keyboard;
      const left = keys.has(KeyCodes.LEFT) || keys.has(KeyCodes.A);
      const right = keys.has(KeyCodes.RIGHT) || keys.has(KeyCodes.D);
      const up = keys.has(KeyCodes.UP) || keys.has(KeyCodes.W) || keys.has(KeyCodes.SPACE);
      const translation = this.rb.translation();
      const state = JSON.stringify(this.physics.state);
      this.values.frames[this.values.currentFrame] = { left, right, up, translation, state };
      this.setMoveSpeed();
      this.nativeStep(dt);
      this.values.currentFrame++;
      this.updateTable();
    };
  }
  stopControlling() {
    this.physicsManager.physicsStep = (dt) => {
      api.stores.phaser.mainCharacter.physics.postUpdate(dt);
    };
  }
  advanceFrame() {
    const frame = this.values.frames[this.values.currentFrame];
    if (!frame) return;
    this.setMoveSpeed();
    const translation = this.rb.translation();
    frame.translation = { x: translation.x, y: translation.y };
    frame.state = JSON.stringify(this.physics.state);
    const lastFrame = this.values.frames[this.values.currentFrame - 1];
    const input = generatePhysicsInput(frame, lastFrame);
    this.inputManager.getPhysicsInput = () => input;
    this.nativeStep(0);
    this.values.currentFrame++;
    updateLasers(this.values.currentFrame);
  }
  setSlowdown(amount) {
    this.slowdownAmount = amount;
    this.slowdownDelayedFrames = 0;
  }
  // this function should only ever be used when going back in time
  setFrame(number) {
    const frame = this.values.frames[number];
    if (!frame || !frame.translation || !frame.state) return;
    this.values.currentFrame = number;
    updateLasers(this.values.currentFrame);
    this.rb.setTranslation(frame.translation, true);
    this.physics.state = JSON.parse(frame.state);
  }
  setMoveSpeed() {
    api.stores.me.movementSpeed = getMoveSpeed();
  }
};

// plugins/DLDTAS/src/ui.ts
var frames = api.storage.getValue("frames", []);
var values = { frames, currentFrame: 0 };
function createUI() {
  let rowOffset = 0;
  initOverlay();
  const tools = new TASTools(values, () => {
    scrollTable();
    updateTable();
  });
  const div = document.createElement("div");
  div.id = "inputTable";
  div.innerHTML = `
    <div class="btns">
        <button id="speeddown">&#9194;</button>
        <span id="speed">1x</span>
        <button id="speedup" disabled>&#9193;</button>
    </div>
    <div class="btns">
        <button id="reset">&#8634;</button>
        <button id="backFrame">&larr;</button>
        <button id="play">&#9654;</button>
        <button id="advanceFrame">&rarr;</button>
        <button id="control">${controller_default}</button>
        <button id="download">&#11123;</button>
        <button id="upload">&#11121;</button>
    </div>
    <table>
        <tr>
            <th>Frame #</th>
            <th>Left</th>
            <th>Right</th>
            <th>Jump</th>
        </tr>
    </table>`;
  div.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("keydown", (e) => e.preventDefault());
  });
  div.querySelector("#advanceFrame")?.addEventListener("click", (e) => onStep(e));
  div.querySelector("#backFrame")?.addEventListener("click", (e) => onBack(e));
  let playing = false;
  let controlling = false;
  const playBtn = div.querySelector("#play");
  playBtn?.addEventListener("click", () => {
    if (controlling) return;
    setPlaying(!playing);
  });
  function setPlaying(value) {
    playing = value;
    playBtn.innerHTML = playing ? "&#9209;" : "&#9654;";
    if (playing) {
      tools.startPlaying();
      hideHitbox();
    } else {
      tools.stopPlaying();
      showHitbox();
    }
  }
  div.querySelector("#download")?.addEventListener("click", () => {
    const data = JSON.stringify(
      {
        frames: save(values.frames),
        laserOffset: getLaserOffset()
      },
      null,
      4
    );
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tas.json";
    a.click();
    URL.revokeObjectURL(url);
  });
  div.querySelector("#upload")?.addEventListener("click", () => {
    setControlling(false);
    setPlaying(false);
    tools.stopPlaying();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.click();
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result;
        if (typeof data !== "string") return;
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          values.frames = parsed;
        } else {
          if ("laserOffset" in parsed) {
            values.frames = parsed.frames;
            setLaserOffset(parsed.laserOffset);
          } else {
            values.frames = parsed.frames.map(getTickKeys);
          }
          if (parsed.startPos) tools.startPos = parsed.startPos;
          if (parsed.startState) tools.startState = parsed.startState;
        }
        tools.reset();
        values.currentFrame = 0;
        rowOffset = 0;
        updateTable();
      };
      reader.readAsText(file);
    });
  });
  div.querySelector("#reset")?.addEventListener("click", () => {
    const conf = confirm("Are you sure you want to reset?");
    if (!conf) return;
    setPlaying(false);
    setControlling(false);
    values.frames = [];
    values.currentFrame = 0;
    rowOffset = 0;
    tools.reset();
    tools.stopPlaying();
    updateTable();
  });
  const controlBtn = div.querySelector("#control");
  controlBtn.addEventListener("click", () => {
    if (playing) return;
    setControlling(!controlling);
  });
  const countdownDiv = document.createElement("div");
  countdownDiv.id = "controlCountdown";
  const countdownContent = document.createElement("div");
  countdownDiv.appendChild(countdownContent);
  let activateTimeout;
  function setControlling(value) {
    controlling = value;
    controlBtn.innerHTML = controlling ? "&#9209;" : controller_default;
    if (controlling) {
      countdownContent.style.display = "block";
      countdownContent.innerHTML = "3";
      setTimeout(() => countdownContent.innerHTML = "2", 1e3);
      setTimeout(() => countdownContent.innerHTML = "1", 2e3);
      activateTimeout = setTimeout(() => {
        countdownContent.innerHTML = "";
        countdownContent.style.display = "none";
        tools.startControlling();
      }, 3e3);
      hideHitbox();
    } else {
      clearTimeout(activateTimeout);
      countdownContent.style.display = "none";
      tools.stopControlling();
      showHitbox();
    }
  }
  const slowdowns = [1, 2, 4, 8, 12, 20];
  let slowdownIndex = 0;
  const speedupBtn = div.querySelector("#speedup");
  const speeddownBtn = div.querySelector("#speeddown");
  const speed = div.querySelector("#speed");
  function updateSlowdown() {
    if (slowdownIndex === 0) speed.innerText = "1x";
    else speed.innerText = `1/${slowdowns[slowdownIndex]}x`;
    if (slowdownIndex === 0) speedupBtn.setAttribute("disabled", "true");
    else speedupBtn.removeAttribute("disabled");
    if (slowdownIndex === slowdowns.length - 1) speeddownBtn.setAttribute("disabled", "true");
    else speeddownBtn.removeAttribute("disabled");
  }
  speeddownBtn.addEventListener("click", () => {
    slowdownIndex++;
    tools.setSlowdown(slowdowns[slowdownIndex]);
    updateSlowdown();
  });
  speedupBtn.addEventListener("click", () => {
    slowdownIndex--;
    tools.setSlowdown(slowdowns[slowdownIndex]);
    updateSlowdown();
  });
  const rows = Math.floor((window.innerHeight - 60) / 26) - 1;
  let dragging = false;
  let draggingChecked = false;
  const props = ["left", "right", "up"];
  window.addEventListener("mouseup", () => dragging = false);
  for (let i = 0; i < rows; i++) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${i}</td>`;
    for (let j = 0; j < props.length; j++) {
      const data = document.createElement("td");
      const input = document.createElement("input");
      input.type = "checkbox";
      const checkPos = () => {
        if (i + rowOffset < values.currentFrame) {
          tools.setFrame(i + rowOffset);
          scrollTable();
          updateTable();
        }
      };
      data.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        dragging = true;
        draggingChecked = !values.frames[i + rowOffset][props[j]];
        values.frames[i + rowOffset][props[j]] = draggingChecked;
        input.checked = draggingChecked;
        checkPos();
      });
      data.addEventListener("mouseenter", () => {
        if (!dragging) return;
        values.frames[i + rowOffset][props[j]] = draggingChecked;
        input.checked = draggingChecked;
        checkPos();
      });
      input.addEventListener("click", (e) => e.preventDefault());
      data.appendChild(input);
      row.appendChild(data);
    }
    updateTable();
    div.querySelector("table")?.appendChild(row);
  }
  function updateTable() {
    const table = div.querySelector("table");
    const rowEls = table?.querySelectorAll("tr:not(:first-child)");
    if (!rowEls) return;
    const frames2 = values.frames;
    rowOffset = Math.max(0, rowOffset);
    for (let i = frames2.length; i < rowOffset + rowEls.length; i++) {
      if (frames2[i]) continue;
      frames2[i] = { right: false, left: false, up: false };
    }
    for (let i = 0; i < rowEls.length; i++) {
      const row = rowEls[i];
      row.classList.toggle("active", i + rowOffset === values.currentFrame);
      const frame = frames2[i + rowOffset];
      if (!frame) continue;
      row.firstChild.textContent = (i + rowOffset).toString();
      const checkboxes = rowEls[i].querySelectorAll("input");
      checkboxes[0].checked = frame.left;
      checkboxes[1].checked = frame.right;
      checkboxes[2].checked = frame.up;
    }
  }
  function scrollTable() {
    if (values.currentFrame - rowOffset < 3) {
      rowOffset = values.currentFrame - 3;
    } else if (values.currentFrame - rowOffset > rows - 3) {
      rowOffset = values.currentFrame - (rows - 3);
    }
  }
  function onStep(event) {
    if (playing || controlling) return;
    if (event.shiftKey) {
      for (let i = 0; i < 5; i++) {
        tools.advanceFrame();
      }
    } else {
      tools.advanceFrame();
    }
    scrollTable();
    updateTable();
  }
  function onBack(event) {
    if (playing || controlling) return;
    if (event.shiftKey) {
      tools.setFrame(Math.max(0, values.currentFrame - 5));
    } else {
      tools.setFrame(Math.max(0, values.currentFrame - 1));
    }
    scrollTable();
    updateTable();
  }
  window.addEventListener("wheel", (e) => {
    rowOffset += Math.sign(e.deltaY);
    rowOffset = Math.max(0, rowOffset);
    updateTable();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      onStep(e);
    } else if (e.key === "ArrowLeft") {
      onBack(e);
    }
  });
  setInterval(() => save(values.frames), 6e4);
  window.addEventListener("beforeunload", () => save(values.frames));
  document.body.appendChild(div);
  document.body.appendChild(countdownDiv);
}

// plugins/DLDTAS/src/index.ts
api.UI.addStyles(styles_default);
var startTasBtn = document.createElement("button");
startTasBtn.id = "startTasBtn";
startTasBtn.innerText = "Start TAS";
startTasBtn.addEventListener("click", () => createUI());
startTasBtn.addEventListener("click", () => startTasBtn.remove());
api.onStop(() => startTasBtn.remove());
api.net.onLoad(() => {
  document.body.appendChild(startTasBtn);
});
var moveSpeed = 310;
function getMoveSpeed() {
  return moveSpeed;
}
function setMoveSpeed(speed) {
  moveSpeed = speed;
}
export {
  getMoveSpeed,
  setMoveSpeed
};
