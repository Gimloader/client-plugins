import { replaceSection } from "$shared/rewritingUtils";

api.rewriter.addParseHook("App", code => {
    if(!code.includes("Discovery Is Closed During School Hours")) return code;

    return replaceSection(code, "()&&@?", "false");
});
