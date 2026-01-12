import { getSection, insert, replaceSection } from "$shared/rewritingUtils";

// Fixes placing tiles as soon as switching to the tile in your inventory
api.rewriter.addParseHook("App", code => {
    if(!code.includes(".previewDepth).removeTileAt(this.previewingTile.x")) return code;
    code = insert(code, "clearConsumeErrorMessage=()=>{const#.itemId)@.", "?");
    return insert(code, ".isHoldingDown;this.wasDown#.itemId);if(#@.", "?");
});

// Fixes crash maps that abuse custom shapes
api.rewriter.addParseHook("FixSpinePlugin", code => {
    const imageData = getSection(code, "this.height=#this.imageData=@,this.data");
    return replaceSection(
        code,
        "this.height=#this.imageData=@this.data",
        `null; try { this.imageData = ${imageData} } catch {}; `
    );
});
