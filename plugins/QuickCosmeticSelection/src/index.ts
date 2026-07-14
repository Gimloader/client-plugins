import { getSection, insert, replaceSection } from "$shared/rewritingUtils";

api.rewriter.addParseHook("App", (code) => {
    if(!code.includes(".sticker?12:void")) return code;
    let selectCosmeticCode = getSection(code, '"Update":"Selected"#onClick#{#,@}}};');
    selectCosmeticCode = replaceSection(selectCosmeticCode, ".type,@onSuccess", "");
    const isStickerCode = getSection(code, ".sticker?12:void#if@return");
    const shouldShowInfo = getSection(code, '"Update":"Selected"#disabled:@&');
    code = insert(code, ".sticker?12:void 0#onClick#,@#", `(!(${shouldShowInfo}) && !${isStickerCode}) ? ${selectCosmeticCode} : `);
    return code;
});
