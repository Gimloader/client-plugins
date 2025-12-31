import type { Vector } from "@dimforge/rapier2d-compat";

api.net.onLoad(() => {
    const placedTiles = new Set<string>();

    api.net.on("send:CONSUME", (data: Vector | {}, editFn) => {
        if(!("x" in data)) return;

        const tileString = `${data.x}_${data.y}`;
        if(placedTiles.has(tileString)) {
            editFn(null);
        } else {
            placedTiles.add(tileString);
        }
    });

    api.net.on("TERRAIN_CHANGES", (data) => {
        if(data.initial) return;

        setTimeout(() => {
            for(const [x, y] of data.added.tiles) {
                const tileString = `${x}_${y}`;
                placedTiles.delete(tileString);
            }
        }, 500);

        for(const tile of data.removedTiles) {
            const tileString = tile.slice(tile.indexOf("_") + 1);
            placedTiles.delete(tileString);
        }
    });
});
