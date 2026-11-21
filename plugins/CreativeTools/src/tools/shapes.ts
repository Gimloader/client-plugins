import { getTerrainOptions } from "../util";
import { previewTiles } from "./selection";

type TilesGenerator = (callback: (x: number, y: number) => void, startX: number, startY: number, endX: number, endY: number) => void;

export async function createShape(context: Gimloader.CommandContext, name: string, getTiles: TilesGenerator) {
    const terrainOptions = getTerrainOptions();
    const tileType = await context.select({
        title: `Terrain type to make ${name} out of`,
        options: terrainOptions
    });
    const terrainOption = api.stores.worldOptions.terrainOptions.find((option) => option.id === tileType);
    if(!terrainOption) return;

    const toastId = api.UI.toast(`Click and drag to create a ${name} of terrain`, { duration: Infinity });

    const inputManager = api.stores.phaser.scene.inputManager;
    Object.defineProperty(inputManager.mouse, "isHoldingDown", { get: () => false, set: () => {} });
    Object.defineProperty(inputManager.mouse, "stopRunningClickHandlers", { get: () => true, set: () => {} });

    await new Promise((res) => api.stores.phaser.scene.input.once("pointerdown", res));

    api.UI.toast.dismiss(toastId);
    const startPos = api.stores.phaser.scene.inputManager.getMouseWorldXY();
    const startX = startPos.x >> 6;
    const startY = startPos.y >> 6;

    const onPointerMove = (e: Phaser.Input.Pointer) => {
        previewTiles.length = 0;
        const endX = Math.ceil(e.worldX / 64);
        const endY = Math.ceil(e.worldY / 64);
        const topLeftX = Math.min(startX, endX);
        const topLeftY = Math.min(startY, endY);
        const bottomRightX = Math.max(startX, endX);
        const bottomRightY = Math.max(startY, endY);

        getTiles(
            (x, y) => {
                previewTiles.push({
                    x,
                    y,
                    terrainOption
                });
            },
            topLeftX,
            topLeftY,
            bottomRightX,
            bottomRightY
        );
    };

    api.stores.phaser.scene.input.on("pointermove", onPointerMove);

    api.stores.phaser.scene.input.once("pointerup", async (e: Phaser.Input.Pointer) => {
        api.stores.phaser.scene.input.off("pointermove", onPointerMove);

        try {
            const shouldCollide = await context.select({
                title: "Should this terrain collide with players?",
                options: [
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" }
                ]
            });

            const depthChoice = await context.select({
                title: "What layer should this terrain be?",
                options: [
                    { label: "1 - Bottom", value: "1" },
                    { label: "2 - Lower", value: "2" },
                    { label: "3 - Middle", value: "3" },
                    { label: "4 - Upper", value: "4" },
                    { label: "5 - Top", value: "5" }
                ]
            });

            previewTiles.length = 0;
            const endX = Math.ceil(e.worldX / 64);
            const endY = Math.ceil(e.worldY / 64);
            const topLeftX = Math.min(startX, endX);
            const topLeftY = Math.min(startY, endY);
            const bottomRightX = Math.max(startX, endX);
            const bottomRightY = Math.max(startY, endY);

            const collides = shouldCollide === "yes";
            const depth = parseInt(depthChoice, 10);

            getTiles(
                (x, y) => {
                    api.net.colyseus.send("PLACE_TERRAIN", {
                        x,
                        y,
                        collides,
                        depth,
                        terrain: terrainOption.id
                    });
                },
                topLeftX,
                topLeftY,
                bottomRightX,
                bottomRightY
            );
        } catch {}

        Object.defineProperty(inputManager.mouse, "isHoldingDown", { value: true, writable: true, enumerable: true });
        Object.defineProperty(inputManager.mouse, "stopRunningClickHandlers", { value: true, writable: true, enumerable: true });
    });
}

export const getRectangleTiles: TilesGenerator = (callback, startX, startY, endX, endY) => {
    for(let x = startX; x < endX; x++) {
        for(let y = startY; y < endY; y++) {
            callback(x, y);
        }
    }
};

export const getSquareTiles: TilesGenerator = (callback, startX, startY, endX, endY) => {
    const size = Math.max(endX - startX, endY - startY);
    for(let x = startX; x < startX + size; x++) {
        for(let y = startY; y < startY + size; y++) {
            callback(x, y);
        }
    }
};

export const getCircleTiles: TilesGenerator = (callback, startX, startY, endX, endY) => {
    const radius = Math.floor(Math.max(endX - startX, endY - startY) / 2);
    const centerX = startX + radius;
    const centerY = startY + radius;

    let x = 0;
    let y = radius;
    let error = 1 - radius;

    while(x <= y) {
        callback(centerX + x, centerY + y);
        callback(centerX - x, centerY + y);
        callback(centerX + x, centerY - y);
        callback(centerX - x, centerY - y);
        callback(centerX + y, centerY + x);
        callback(centerX - y, centerY + x);
        callback(centerX + y, centerY - x);
        callback(centerX - y, centerY - x);

        if(error < 0) {
            error += 2 * x + 3;
        } else {
            error += 2 * (x - y) + 5;
            y--;
        }
        x++;
    }
};

// Completely stolen from somewhere
export const getEllipseTiles: TilesGenerator = (callback, startX, startY, endX, endY) => {
    const xc = Math.round((startX + endX) / 2);
    const yc = Math.round((startY + endY) / 2);
    const rx = Math.round((endX - startX) / 2);
    const ry = Math.round((endY - startY) / 2);

    const plotQuadrants = (x: number, y: number) => {
        callback(xc + x, yc + y);
        callback(xc - x, yc + y);
        callback(xc + x, yc - y);
        callback(xc - x, yc - y);
    };

    let x = 0;
    let y = ry;

    const rx2 = rx * rx;
    const ry2 = ry * ry;
    const twoRx2 = 2 * rx2;
    const twoRy2 = 2 * ry2;

    let px = 0;
    let py = twoRx2 * y;

    let d1 = ry2 - (rx2 * ry) + (0.25 * rx2);
    while(px < py) {
        plotQuadrants(x, y);
        x++;
        px += twoRy2;
        if(d1 < 0) {
            d1 += ry2 + px;
        } else {
            y--;
            py -= twoRx2;
            d1 += ry2 + px - py;
        }
    }

    let d2 = (ry2 * (x + 0.5) * (x + 0.5)) + (rx2 * (y - 1) * (y - 1)) - (rx2 * ry2);
    while(y >= 0) {
        plotQuadrants(x, y);
        y--;
        py -= twoRx2;
        if(d2 > 0) {
            d2 += rx2 - py;
        } else {
            x++;
            px += twoRy2;
            d2 += rx2 - py + px;
        }
    }
};
