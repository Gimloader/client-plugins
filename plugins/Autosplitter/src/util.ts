import type { Vector } from "@dimforge/rapier2d-compat";
import type { DLDData, SplitsData } from "./types";

export function getGamemodeData(gamemode: string) {
    switch (gamemode) {
        case "DLD":
            return getDLDData();
        case "Fishtopia":
            return getFishtopiaData();
        case "OneWayOut":
            return getOneWayOutData();
        default:
            throw new Error(`Invalid gamemode: ${gamemode}`);
    }
}

const DLDDefaults: DLDData = {
    mode: "Full Game",
    ilSummit: 0,
    ilPreboosts: false,
    autostartILs: false,
    autoRecord: true,
    attempts: {},
    pb: {},
    bestSplits: {},
    ilpbs: {},
    showPbSplits: false,
    showSplits: true,
    showSplitTimes: true,
    showSplitComparisons: true,
    showSplitTimeAtEnd: true,
    timerPosition: "top right"
};

export function getDLDData(): DLDData {
    const data = api.storage.getValue("DLDData", {});
    return Object.assign(DLDDefaults, data);
}

const splitsDefaults: SplitsData = {
    attempts: {},
    pb: {},
    bestSplits: {},
    showPbSplits: false,
    showSplits: true,
    showSplitTimes: true,
    showSplitComparisons: true,
    showSplitTimeAtEnd: true,
    timerPosition: "top right"
};

export function getFishtopiaData(): SplitsData {
    const data = api.storage.getValue("FishtopiaData", {});
    return Object.assign(splitsDefaults, data);
}

export function getOneWayOutData(): SplitsData {
    const data = api.storage.getValue("OneWayOutData", {});
    return Object.assign(splitsDefaults, data);
}

export function downloadFile(data: string, filename: string) {
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function readFile() {
    return new Promise<any>((res, rej) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.addEventListener("change", () => {
            const file = input.files?.[0];
            if(!file) return rej("No file selected");

            const reader = new FileReader();
            reader.onload = () => {
                const data = reader.result;
                if(typeof data !== "string") return rej("Failed to read file");

                const parsed = JSON.parse(data);
                res(parsed);
            };

            reader.readAsText(file);
        });

        input.click();
    });
}

export function fmtMs(ms: number) {
    ms = Math.round(ms);
    let seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    ms %= 1000;
    seconds %= 60;

    if(minutes > 0) return `${minutes}:${String(seconds).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
    return `${seconds}.${String(ms).padStart(3, "0")}`;
}

export function parseTime(time: string) {
    const parts = time.split(":").map(parseFloat);
    if(parts.some(Number.isNaN)) return 6e5;
    if(parts.length === 1) return parts[0] * 1e3;
    if(parts.length === 2) return parts[0] * 6e4 + parts[1] * 1e3;
    return parts[0] * 36e5 + parts[1] * 6e4 + parts[2] * 1e3;
}

export interface Area extends Vector {
    direction: "right" | "left";
}

export interface Box {
    p1: Vector;
    p2: Vector;
}

export function inArea(coords: Vector, area: Area) {
    if(area.direction === "right" && coords.x < area.x) return false;
    if(area.direction === "left" && coords.x > area.x) return false;
    if(coords.y > area.y + 10) return false; // little bit of leeway
    return true;
}

export function inBox(coords: Vector, box: Box) {
    return coords.x > box.p1.x && coords.x < box.p2.x
        && coords.y > box.p1.y && coords.y < box.p2.y;
}

export function onPhysicsStep(callback: () => void) {
    const worldManager = api.stores.phaser.scene.worldManager;

    api.patcher.after(worldManager.physics, "physicsStep", () => {
        callback();
    });
}

export function onFrame(callback: () => void) {
    const worldManager = api.stores.phaser.scene.worldManager;

    api.patcher.after(worldManager, "update", () => {
        callback();
    });
}
