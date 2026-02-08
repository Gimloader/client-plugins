import controller from "$assets/controller.svg";
import type { IRecording } from "plugins/InputRecorder/types";
import type { IFrameInfo, ISharedValues, TAS } from "../types";
import { hideHitbox, initOverlay, showHitbox } from "./overlay";
import TASTools from "./tools";
import { getLaserOffset, setLaserOffset } from "./updateLasers";
import { getTickKeys, save } from "./util";

const frames: IFrameInfo[] = api.storage.getValue("frames", []);
const values: ISharedValues = { frames, currentFrame: 0 };

export function createUI() {
    let rowOffset = 0;

    initOverlay();

    function update() {
        scrollTable();
        updateTable();
    }

    const tools = new TASTools(values, update);

    api.commands.addCommand({
        text: "DLDTAS: Go to previous frame"
    }, async (context) => {
        const frame = await context.number({
            title: "Frame",
            decimal: false,
            min: 0,
            max: values.currentFrame
        });

        tools.setFrame(frame);
        update();
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
        <button id="control">${controller}</button>
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

    // prevent accidentally clicking the buttons with space/enter
    div.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("keydown", (e) => e.preventDefault());
    });

    // add listeners to the buttons
    div.querySelector("#advanceFrame")?.addEventListener("click", (e) => onStep(e as MouseEvent));
    div.querySelector("#backFrame")?.addEventListener("click", (e) => onBack(e as MouseEvent));

    let playing = false;
    let controlling = false;
    const playBtn = div.querySelector("#play")!;
    playBtn?.addEventListener("click", () => {
        if(controlling) return;
        setPlaying(!playing);
    });

    function setPlaying(value: boolean) {
        playing = value;
        playBtn.innerHTML = playing ? "&#9209;" : "&#9654;";

        if(playing) {
            tools.startPlaying();
            hideHitbox();
        } else {
            tools.stopPlaying();
            showHitbox();
        }
    }

    // download the frames as a json file
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

    // upload a json file
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
            if(!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const data = reader.result;
                if(typeof data !== "string") return;

                const parsed: IFrameInfo[] | TAS | IRecording = JSON.parse(data);

                // compatibility with older versions and input recordings
                if(Array.isArray(parsed)) {
                    values.frames = parsed;
                } else {
                    if("laserOffset" in parsed) {
                        values.frames = parsed.frames;
                        setLaserOffset(parsed.laserOffset);
                    } else {
                        values.frames = parsed.frames.map(getTickKeys);
                    }

                    if(parsed.startPos) tools.startPos = parsed.startPos;
                    if(parsed.startState) tools.startState = parsed.startState;
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
        if(!conf) return;

        setPlaying(false);
        setControlling(false);

        values.frames = [];
        values.currentFrame = 0;
        rowOffset = 0;
        tools.reset();
        tools.stopPlaying();
        updateTable();
    });

    const controlBtn = div.querySelector("#control")!;
    controlBtn.addEventListener("click", () => {
        if(playing) return;
        setControlling(!controlling);
    });

    const countdownDiv = document.createElement("div");
    countdownDiv.id = "controlCountdown";
    const countdownContent = document.createElement("div");
    countdownDiv.appendChild(countdownContent);
    let activateTimeout: ReturnType<typeof setTimeout>;

    function setControlling(value: boolean) {
        controlling = value;
        controlBtn.innerHTML = controlling ? "&#9209;" : controller;

        if(controlling) {
            countdownContent.style.display = "block";
            countdownContent.innerHTML = "3";

            // start the countdown
            setTimeout(() => countdownContent.innerHTML = "2", 1000);
            setTimeout(() => countdownContent.innerHTML = "1", 2000);
            activateTimeout = setTimeout(() => {
                countdownContent.innerHTML = "";
                countdownContent.style.display = "none";
                tools.startControlling();
            }, 3000);
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
    const speedupBtn = div.querySelector("#speedup")!;
    const speeddownBtn = div.querySelector("#speeddown")!;
    const speed = div.querySelector("#speed")! as HTMLSpanElement;

    function updateSlowdown() {
        if(slowdownIndex === 0) speed.innerText = "1x";
        else speed.innerText = `1/${slowdowns[slowdownIndex]}x`;

        // disable the buttons if necessary
        if(slowdownIndex === 0) speedupBtn.setAttribute("disabled", "true");
        else speedupBtn.removeAttribute("disabled");

        if(slowdownIndex === slowdowns.length - 1) speeddownBtn.setAttribute("disabled", "true");
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
    const props: ("left" | "right" | "up")[] = ["left", "right", "up"];

    window.addEventListener("mouseup", () => dragging = false);

    for(let i = 0; i < rows; i++) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${i}</td>`;

        // add the checkboxes to the frames array
        for(let j = 0; j < props.length; j++) {
            const data = document.createElement("td");
            const input = document.createElement("input");
            input.type = "checkbox";

            const checkPos = () => {
                if(i + rowOffset < values.currentFrame) {
                    tools.setFrame(i + rowOffset);
                    update();
                }
            };

            // add listeners
            data.addEventListener("mousedown", (e) => {
                // check that it's a left click
                if(e.button !== 0) return;

                dragging = true;
                draggingChecked = !values.frames[i + rowOffset][props[j]];
                values.frames[i + rowOffset][props[j]] = draggingChecked;
                input.checked = draggingChecked;
                checkPos();
            });

            data.addEventListener("mouseenter", () => {
                if(!dragging) return;
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
        if(!rowEls) return;
        const frames = values.frames;

        rowOffset = Math.max(0, rowOffset);

        // add frames to the array if they don't exist
        for(let i = frames.length; i < rowOffset + rowEls.length; i++) {
            if(frames[i]) continue;
            frames[i] = { right: false, left: false, up: false };
        }

        for(let i = 0; i < rowEls.length; i++) {
            const row = rowEls[i];
            row.classList.toggle("active", i + rowOffset === values.currentFrame);

            // update the row
            const frame = frames[i + rowOffset];
            if(!frame) continue;

            row.firstChild!.textContent = (i + rowOffset).toString();

            const checkboxes = rowEls[i].querySelectorAll("input");
            checkboxes[0].checked = frame.left;
            checkboxes[1].checked = frame.right;
            checkboxes[2].checked = frame.up;
        }
    }

    function scrollTable() {
        // if the currentFrame is within 3 of the top or bottom, move the table
        if(values.currentFrame - rowOffset < 3) {
            rowOffset = values.currentFrame - 3;
        } else if(values.currentFrame - rowOffset > rows - 3) {
            rowOffset = values.currentFrame - (rows - 3);
        }
    }

    function onStep(event: MouseEvent | KeyboardEvent) {
        if(playing || controlling) return;
        if(event.shiftKey) {
            for(let i = 0; i < 5; i++) {
                tools.advanceFrame();
            }
        } else {
            tools.advanceFrame();
        }

        update();
    }

    function onBack(event: MouseEvent | KeyboardEvent) {
        if(playing || controlling) return;
        if(event.shiftKey) {
            tools.setFrame(Math.max(0, values.currentFrame - 5));
        } else {
            tools.setFrame(Math.max(0, values.currentFrame - 1));
        }

        update();
    }

    // move the table when scrolling
    window.addEventListener("wheel", (e) => {
        rowOffset += Math.sign(e.deltaY);
        rowOffset = Math.max(0, rowOffset);
        updateTable();
    });

    window.addEventListener("keydown", (e) => {
        if(e.key === "ArrowRight") {
            onStep(e);
        } else if(e.key === "ArrowLeft") {
            onBack(e);
        }
    });

    // periodically save the current translation and state
    setInterval(() => save(values.frames), 60000);
    window.addEventListener("beforeunload", () => save(values.frames));

    document.body.appendChild(div);
    document.body.appendChild(countdownDiv);
}
