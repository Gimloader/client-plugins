import { replaceSection } from "$shared/rewritingUtils";

api.rewriter.addParseHook("App", (code) => {
    if(!code.includes("sticker.svg")) return code;
    return replaceSection(code, ".sticker-drawer#onClick:@,", (onclick) => `() => { ${onclick}(); document.activeElement?.blur() }`);
});
