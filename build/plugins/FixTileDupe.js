/**
 * @name FixTileDupe
 * @description Prevents you from placing a terrain twice on the same cell area, helpful in Dig It Up.
 * @author retrozy
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/FixTileDupe.js
 * @webpage https://gimloader.github.io/plugins/fixtiledupe
 * @gamemode 2d
 */

// plugins/FixTileDupe/src/index.ts
api.net.onLoad(() => {
  const placedTiles = /* @__PURE__ */ new Set();
  api.net.on("send:CONSUME", (data, editFn) => {
    if (!("x" in data)) return;
    const tileString = JSON.stringify(data);
    if (placedTiles.has(tileString)) {
      editFn(null);
    } else {
      placedTiles.add(tileString);
    }
  });
  api.net.on("TERRAIN_CHANGES", (data) => {
    for (const tile of data.removedTiles) {
      const [x, y] = tile.split("_").slice(1);
      placedTiles.delete(JSON.stringify({ x: +x, y: +y }));
    }
  });
});
