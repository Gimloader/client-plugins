import type { Vector } from "@dimforge/rapier2d-compat";

api.net.onLoad(() => {
    const placedTiles = new Set<string>();

    api.net.on("send:CONSUME", (data: Vector | {}, editFn) => {
        if(!("x" in data)) return;

        const tileString = JSON.stringify(data);
        if(placedTiles.has(tileString)) {
            editFn(null);
        } else {
            placedTiles.add(tileString);
        }
    });

    api.net.on("TERRAIN_CHANGES", (data) => {
        for(const tile of data.removedTiles) {
            const [x, y] = tile.split("_").slice(1);
            placedTiles.delete(JSON.stringify({ x: +x, y: +y }));
        }
    });
});
