/**
 * @name FixTileDupe
 * @description Prevents you from placing a terrain twice on the same cell area, helpful in Dig It Up.
 * @author retrozy
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/FixTileDupe.js
 * @webpage https://gimloader.github.io/plugins/FixTileDupe
 * @gamemode 2d
 * @changelog Updated webpage url
 */

// plugins/FixTileDupe/src/index.ts
api.net.onLoad(() => {
  const placedTiles = /* @__PURE__ */ new Set();
  api.net.on("send:CONSUME", (data, editFn) => {
    if (!("x" in data)) return;
    const tileString = `${data.x}_${data.y}`;
    if (placedTiles.has(tileString)) {
      editFn(null);
    } else {
      placedTiles.add(tileString);
    }
  });
  api.net.on("TERRAIN_CHANGES", (data) => {
    if (data.initial) return;
    setTimeout(() => {
      for (const [x, y] of data.added.tiles) {
        const tileString = `${x}_${y}`;
        placedTiles.delete(tileString);
      }
    }, 500);
    for (const tile of data.removedTiles) {
      const tileString = tile.slice(tile.indexOf("_") + 1);
      placedTiles.delete(tileString);
    }
  });
});
